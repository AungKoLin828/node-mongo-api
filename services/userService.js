const User = require("../models/User");
const Role = require("../models/Role");
const jwt = require("jsonwebtoken");
const passwordUtils = require("../utils/password"); // renamed for clarity

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
  const user = await User.findOne({ phone });
  if (!user) throw new Error("User not found");

  // 🔐 Account lock check
  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new Error("Account locked. Try later");
  }

  const match = await passwordUtils.comparePassword(password, user.password);

  if (!match) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
    }

    await user.save();
    throw new Error("Invalid password");
  }

  // reset security
  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  return { user, token };
};

/* ---------------- GET USERS ---------------- */
exports.getUsers = async () => {
  return await User.find().populate("role");
};

/* ---------------- GET USER ---------------- */
exports.getUserById = async (id) => {
  const user = await User.findById(id).populate("role");
  if (!user) throw new Error("User not found");
  return user;
};

/* ---------------- UPDATE USER ---------------- */
exports.updateUser = async (id, data) => {
  const { password, roleName } = data;

  if (password) {
    data.password = await passwordUtils.hashPassword(password);
  }

  if (roleName) {
    const role = await Role.findOne({ name: roleName });
    if (!role) throw new Error("Role not found");
    data.role = role._id;
  }

  return await User.findByIdAndUpdate(id, data, { new: true }).populate("role");
};

/* ---------------- DELETE ---------------- */
exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("User not found");
  return true;
};

/* ---------------- GAME: SCORE ---------------- */
exports.updateScore = async (userId, score) => {
  if (score < 0 || score > 10000) throw new Error("Invalid score");

  const user = await User.findById(userId);

  user.score += score;
  user.experience += score;
  user.gamesPlayed += 1;

  if (user.experience >= 100) {
    user.level += 1;
    user.experience = 0;
  }

  await user.save();
  return user;
};

/* ---------------- LEADERBOARD ---------------- */
exports.getLeaderboard = async () => {
  return await User.find()
    .sort({ score: -1 })
    .limit(10)
    .select("name username score level");
};
