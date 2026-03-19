const User = require("../models/User");
const Role = require("../models/Role");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passwordUtils = require("../utils/password");
const AdEvent = require("../models/AdEvent");

/* ---------------- HELPERS ---------------- */

const getDeviceHash = (req) => {
  const raw = `${req.ip}-${req.headers["user-agent"]}-${req.headers["device-id"]}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
};

/* ---------------- CREATE USER ---------------- */
exports.createUser = async (data) => {
  const { name, email, phone, password, roleName, isActive } = data;

  if (await User.findOne({ phone })) {
    throw new Error("Phone already registered");
  }

  const role = await Role.findOne({ name: roleName });
  if (!role) throw new Error("Role not found");

  const hashedPassword = await passwordUtils.hashPassword(password);

  return await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: role._id,
    isActive: isActive ?? true,
  });
};

/* ---------------- LOGIN ---------------- */
exports.loginUser = async ({ phone, password }) => {
  const user = await User.findOne({ phone }).populate("role");
  if (!user) throw new Error("User not found");

  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new Error("Account locked. Try later");
  }

  const match = await passwordUtils.comparePassword(password, user.password);

  if (!match) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000;
    }

    await user.save();
    throw new Error("Invalid password");
  }

  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role?.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  return { user, token };
};

/* ---------------- SCORE (ATOMIC SAFE) ---------------- */
exports.updateScore = async (userId, score) => {
  if (score < 0 || score > 10000) throw new Error("Invalid score");

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: {
        score,
        experience: score,
        gamesPlayed: 1,
      },
    },
    { new: true },
  );

  if (!user) throw new Error("User not found");

  if (user.experience >= 100) {
    user.level += 1;
    user.experience = 0;
    await user.save();
  }

  return user;
};

/* ---------------- LEADERBOARD ---------------- */
exports.getLeaderboard = async () => {
  return await User.find()
    .sort({ score: -1 })
    .limit(10)
    .select("name username score level coins")
    .lean();
};

/* ---------------- TRACK AD VIEW ---------------- */
exports.trackAdView = async (userId, req) => {
  const deviceHash = getDeviceHash(req);

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.lastAdView && Date.now() - user.lastAdView < 30000) {
    throw new Error("Too frequent ad views");
  }

  await AdEvent.create({
    user: userId,
    type: "VIEW",
    ip: req.ip,
    deviceId: deviceHash,
    userAgent: req.headers["user-agent"],
  });

  await User.findByIdAndUpdate(userId, {
    $inc: { adViews: 1, coins: 1 },
    $set: { lastAdView: Date.now() },
  });

  return { success: true };
};

/* ---------------- TRACK AD CLICK ---------------- */
exports.trackAdClick = async (userId, req) => {
  const deviceHash = getDeviceHash(req);

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.lastAdClick && Date.now() - user.lastAdClick < 15000) {
    throw new Error("Too frequent clicks");
  }

  await AdEvent.create({
    user: userId,
    type: "CLICK",
    ip: req.ip,
    deviceId: deviceHash,
    userAgent: req.headers["user-agent"],
  });

  await User.findByIdAndUpdate(userId, {
    $inc: { adClicks: 1, coins: 5 },
    $set: { lastAdClick: Date.now() },
  });

  return { success: true };
};

/* ---------------- GLOBAL STATS (AGGREGATION) ---------------- */
exports.getGlobalAdStats = async () => {
  const [stats] = await User.aggregate([
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$adViews" },
        totalClicks: { $sum: "$adClicks" },
        totalCoins: { $sum: "$coins" },
      },
    },
  ]);

  return stats || { totalViews: 0, totalClicks: 0, totalCoins: 0 };
};

/* ---------------- GLOBAL REVENUE (FIXED ⚡) ---------------- */
exports.calculateGlobalRevenue = async (cpm = 0.5) => {
  const [stats] = await User.aggregate([
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$adViews" },
      },
    },
  ]);

  const totalViews = stats?.totalViews || 0;
  return parseFloat(((totalViews / 1000) * cpm).toFixed(2));
};

/* ---------------- DASHBOARD ---------------- */
exports.getDashboardStats = async (cpm = 0.5, cpc = 0.05) => {
  const [stats] = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalViews: { $sum: "$adViews" },
        totalClicks: { $sum: "$adClicks" },
        totalCoins: { $sum: "$coins" },
      },
    },
  ]);

  const safe = stats || {
    totalUsers: 0,
    totalViews: 0,
    totalClicks: 0,
    totalCoins: 0,
  };

  const ctr = safe.totalViews > 0 ? safe.totalClicks / safe.totalViews : 0;

  const revenue = (safe.totalViews / 1000) * cpm + safe.totalClicks * cpc;

  return {
    ...safe,
    ctr: Number(ctr.toFixed(4)),
    revenue: Number(revenue.toFixed(2)),
  };
};

/* ---------------- VERIFY & REWARD (HARDENED) ---------------- */
exports.verifyAndRewardAd = async (userId, data, req) => {
  const { type, adNetwork, rewardAmount, adUnitId, txId } = data;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const now = Date.now();
  const deviceHash = getDeviceHash(req);

  // ✅ idempotency check
  if (txId) {
    const exists = await AdEvent.findOne({ transactionId: txId });
    if (exists) throw new Error("Duplicate reward");
  }

  // ✅ reset daily
  if (
    new Date(user.lastDailyReset).toDateString() !== new Date().toDateString()
  ) {
    user.dailyCoins = 0;
    user.lastDailyReset = now;
  }

  if (user.dailyCoins >= 1000) {
    throw new Error("Daily reward limit reached");
  }

  if (user.lastAdReward && now - user.lastAdReward < 20000) {
    throw new Error("Too many rewards");
  }

  let coinsReward = rewardAmount || 1;
  let revenue = 0.01;

  if (user.dailyCoins + coinsReward > 1000) {
    coinsReward = 1000 - user.dailyCoins;
  }

  // ✅ fraud detection
  if (user.adViews > 100 && user.adClicks / user.adViews > 0.8) {
    user.isSuspicious = true;
    user.fraudScore += 10;
  }

  await AdEvent.create({
    user: userId,
    type: "REWARDED",
    deviceId: deviceHash,
    adProvider: adNetwork,
    adUnitId,
    revenue,
    transactionId: txId,
  });

  user.coins += coinsReward;
  user.dailyCoins += coinsReward;
  user.adViews += 1;
  user.lastAdReward = now;

  await user.save();

  return {
    coins: user.coins,
    dailyCoins: user.dailyCoins,
    earned: revenue,
  };
};
