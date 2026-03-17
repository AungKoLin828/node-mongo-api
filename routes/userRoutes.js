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
  trackAdView,
  trackAdClick,
  getUserAdStats,
  getGlobalAdStats,
  getUserAdRevenue,
  getGlobalAdRevenue,
} = require("../controllers/userController");

const { authMiddleware } = require("../middleware/authMiddleware");

/* ---------------- PUBLIC ---------------- */
router.post("/login", loginUser);
// router.post("/register", createUser); // optional public registration

/* ---------------- PROTECTED ---------------- */

// User management (Admin)
router.post("/", authMiddleware(["ADMIN"]), createUser);
router.get("/", authMiddleware(), getUsers);
router.get("/:id", authMiddleware(), getUserById);
router.put("/:id", authMiddleware(["ADMIN"]), updateUser);
router.delete("/:id", authMiddleware(["ADMIN"]), deleteUser);

// Game features
router.post("/score", authMiddleware(), updateScore);
router.get("/leaderboard", authMiddleware(), getLeaderboard);

// Ad tracking & rewards
router.post("/ads/view", authMiddleware(), trackAdView); // record ad view + reward coins
router.post("/ads/click", authMiddleware(), trackAdClick); // record ad click + reward coins
router.get("/ads/stats", authMiddleware(), getUserAdStats); // get user's ad stats + coins
router.get("/ads/global", authMiddleware(["ADMIN"]), getGlobalAdStats); // global stats for admin

// Monetization / Revenue endpoints
router.get("/ads/revenue", authMiddleware(), getUserAdRevenue); // user's estimated revenue
router.get(
  "/ads/revenue/global",
  authMiddleware(["ADMIN"]),
  getGlobalAdRevenue,
); // total revenue (admin)

module.exports = router;
