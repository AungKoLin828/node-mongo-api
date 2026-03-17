const userService = require("../services/userService");
const response = require("../utils/response");

/* CREATE */
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    return response.success(res, user, "User created", 201);
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* LOGIN */
exports.loginUser = async (req, res) => {
  try {
    const result = await userService.loginUser(req.body);
    return response.success(res, result, "Login successful");
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* GET ALL */
exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    return response.success(res, users, "Users fetched");
  } catch (err) {
    return response.error(res, err.message, 500);
  }
};

/* GET BY ID */
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return response.success(res, user, "User fetched");
  } catch (err) {
    return response.error(res, err.message, 404);
  }
};

/* UPDATE */
exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return response.success(res, user, "User updated");
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* DELETE */
exports.deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    return response.success(res, null, "User deleted");
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* SCORE */
exports.updateScore = async (req, res) => {
  try {
    const user = await userService.updateScore(req.user.userId, req.body.score);
    return response.success(res, user, "Score updated");
  } catch (err) {
    return response.error(res, err.message);
  }
};

/* LEADERBOARD */
exports.getLeaderboard = async (req, res) => {
  try {
    const data = await userService.getLeaderboard();
    return response.success(res, data, "Leaderboard fetched");
  } catch (err) {
    return response.error(res, err.message, 500);
  }
};
