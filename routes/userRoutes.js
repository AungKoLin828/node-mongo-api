const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  updateScore,
  getLeaderboard,
} = require("../controllers/userController");

const { authMiddleware } = require("../middleware/authMiddleware");

/* ---------------- PUBLIC ---------------- */

// 🔐 Auth
router.post("/login", loginUser);

// 🆕 (optional) register user without admin
// router.post("/register", createUser);

/* ---------------- PROTECTED ---------------- */

// 👤 User Management
router.post("/", authMiddleware(["ADMIN"]), createUser);
router.get("/", authMiddleware(), getUsers);
router.get("/:id", authMiddleware(), getUserById);
router.put("/:id", authMiddleware(["ADMIN"]), updateUser);
router.delete("/:id", authMiddleware(["ADMIN"]), deleteUser);

// 🎮 Game Features

// Update score
router.post("/score", authMiddleware(), updateScore);

// Leaderboard
router.get("/leaderboard", authMiddleware(), getLeaderboard);

module.exports = router;
