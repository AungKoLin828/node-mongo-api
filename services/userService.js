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

/* ---------------- USER MANAGEMENT ---------------- */

// CREATE USER
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

// GET ALL USERS
exports.getUsers = async () => {
  return await User.find().select("-password").populate("role", "name").lean();
};

// GET USER BY ID
exports.getUserById = async (id) => {
  const user = await User.findById(id)
    .select("-password")
    .populate("role", "name");

  if (!user) throw new Error("User not found");

  return user;
};

// UPDATE USER
exports.updateUser = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
  }).select("-password");

  if (!user) throw new Error("User not found");

  return user;
};

// DELETE USER
exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("User not found");
};

/* ---------------- AUTH ---------------- */

// LOGIN
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

/* ---------------- GAME ---------------- */

// UPDATE SCORE
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

// LEADERBOARD
exports.getLeaderboard = async () => {
  return await User.find()
    .sort({ score: -1 })
    .limit(10)
    .select("name username score level coins")
    .lean();
};

/* ---------------- AD TRACKING ---------------- */

// VIEW
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

// CLICK
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

// USER AD STATS
exports.getUserAdStats = async (userId) => {
  const user = await User.findById(userId).select("adViews adClicks coins");

  if (!user) throw new Error("User not found");

  return user;
};

// GLOBAL STATS
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

/* ---------------- REVENUE ---------------- */

// USER REVENUE
exports.calculateAdRevenue = async (userId, cpm = 0.5, cpc = 0.05) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  const revenue = (user.adViews / 1000) * cpm + user.adClicks * cpc;

  return Number(revenue.toFixed(2));
};

// GLOBAL REVENUE
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
  return Number(((totalViews / 1000) * cpm).toFixed(2));
};

/* ---------------- DASHBOARD ---------------- */

exports.getDashboard = async () => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({
    lastLogin: { $gte: last24h },
  });

  const eventStats = await AdEvent.aggregate([
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        revenue: { $sum: "$revenue" },
      },
    },
  ]);

  const metrics = { VIEW: 0, CLICK: 0, REWARDED: 0, revenue: 0 };

  eventStats.forEach((e) => {
    metrics[e._id] = e.count;
    metrics.revenue += e.revenue;
  });

  const ctr = metrics.VIEW ? metrics.CLICK / metrics.VIEW : 0;
  const rewardRate = metrics.CLICK ? metrics.REWARDED / metrics.CLICK : 0;

  const suspiciousUsers = await User.countDocuments({
    isSuspicious: true,
  });

  const timeseries = await AdEvent.aggregate([
    { $match: { createdAt: { $gte: last7d } } },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        views: {
          $sum: { $cond: [{ $eq: ["$type", "VIEW"] }, 1, 0] },
        },
        clicks: {
          $sum: { $cond: [{ $eq: ["$type", "CLICK"] }, 1, 0] },
        },
        revenue: { $sum: "$revenue" },
      },
    },
    { $sort: { "_id.day": 1 } },
  ]);

  return {
    overview: {
      totalUsers,
      activeUsers,
      revenue: Number(metrics.revenue.toFixed(2)),
    },
    ads: {
      views: metrics.VIEW,
      clicks: metrics.CLICK,
      rewards: metrics.REWARDED,
      ctr: Number(ctr.toFixed(4)),
      rewardRate: Number(rewardRate.toFixed(4)),
    },
    fraud: {
      suspiciousUsers,
    },
    charts: {
      timeseries,
    },
  };
};

/* ---------------- VERIFY & REWARD ---------------- */

exports.verifyAndRewardAd = async (userId, data, req) => {
  const { adNetwork, rewardAmount, adUnitId, txId } = data;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const now = Date.now();
  const deviceHash = getDeviceHash(req);

  if (txId) {
    const exists = await AdEvent.findOne({ transactionId: txId });
    if (exists) throw new Error("Duplicate reward");
  }

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
