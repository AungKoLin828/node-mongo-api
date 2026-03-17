const userService = require("../services/userService");
const response = require("../utils/response");

/* ---------------- CREATE ---------------- */
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    return response.success(res, user, "User created", 201);
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* ---------------- LOGIN ---------------- */
exports.loginUser = async (req, res) => {
  try {
    const result = await userService.loginUser(req.body);
    return response.success(res, result, "Login successful");
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* ---------------- GET ALL USERS ---------------- */
exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    return response.success(res, users, "Users fetched");
  } catch (err) {
    return response.error(res, err.message, 500);
  }
};

/* ---------------- GET USER BY ID ---------------- */
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return response.success(res, user, "User fetched");
  } catch (err) {
    return response.error(res, err.message, 404);
  }
};

/* ---------------- UPDATE USER ---------------- */
exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return response.success(res, user, "User updated");
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* ---------------- DELETE USER ---------------- */
exports.deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    return response.success(res, null, "User deleted");
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* ---------------- UPDATE SCORE ---------------- */
exports.updateScore = async (req, res) => {
  try {
    const user = await userService.updateScore(req.user.userId, req.body.score);
    return response.success(res, user, "Score updated");
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* ---------------- LEADERBOARD ---------------- */
exports.getLeaderboard = async (req, res) => {
  try {
    const data = await userService.getLeaderboard();
    return response.success(res, data, "Leaderboard fetched");
  } catch (err) {
    return response.error(res, err.message, 500);
  }
};

/* ---------------- AD TRACKING ---------------- */

// Track ad view + reward coins
exports.trackAdView = async (req, res) => {
  try {
    const result = await userService.trackAdView(req.user.userId);
    return response.success(res, result, "Ad view recorded and coins rewarded");
  } catch (err) {
    return response.error(res, err.message);
  }
};

// Track ad click + reward coins
exports.trackAdClick = async (req, res) => {
  try {
    const result = await userService.trackAdClick(req.user.userId);
    return response.success(
      res,
      result,
      "Ad click recorded and coins rewarded",
    );
  } catch (err) {
    return response.error(res, err.message);
  }
};

// Get user's ad stats + coins
exports.getUserAdStats = async (req, res) => {
  try {
    const stats = await userService.getUserAdStats(req.user.userId);
    return response.success(res, stats, "User ad stats fetched");
  } catch (err) {
    return response.error(res, err.message);
  }
};

// Get global ad stats + total coins
exports.getGlobalAdStats = async (req, res) => {
  try {
    const stats = await userService.getGlobalAdStats();
    return response.success(res, stats, "Global ad stats fetched");
  } catch (err) {
    return response.error(res, err.message, 500);
  }
};

/* ---------------- REVENUE ---------------- */

// Calculate user's ad revenue
exports.getUserAdRevenue = async (req, res) => {
  try {
    const revenue = await userService.calculateAdRevenue(req.user.userId);
    return response.success(res, { revenue }, "User ad revenue calculated");
  } catch (err) {
    return response.error(res, err.message);
  }
};

// Calculate global ad revenue (Admin only)
exports.getGlobalAdRevenue = async (req, res) => {
  try {
    const revenue = await userService.calculateGlobalRevenue();
    return response.success(res, { revenue }, "Global ad revenue calculated");
  } catch (err) {
    return response.error(res, err.message, 500);
  }
};
