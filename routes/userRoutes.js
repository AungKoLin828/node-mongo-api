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
  getDashboard,
} = require("../controllers/userController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { adLimiter } = require("../middleware/adLimiter");

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
router.get("/ads/stats", authMiddleware(), getUserAdStats); // get user's ad stats + coins
router.get("/ads/global", authMiddleware(["ADMIN"]), getGlobalAdStats); // global stats for admin

// Apply limiter to ad routes
router.post("/ads/view", authMiddleware(), adLimiter, trackAdView);
router.post("/ads/click", authMiddleware(), adLimiter, trackAdClick);

// Monetization / Revenue endpoints
router.get("/ads/revenue", authMiddleware(), getUserAdRevenue); // user's estimated revenue

router.get(
  "/ads/revenue/global",
  authMiddleware(["ADMIN"]),
  getGlobalAdRevenue,
); // total revenue (admin)

router.get("/admin/dashboard", authMiddleware(["ADMIN"]), getDashboard);

router.post(
  "/ads/reward",
  authMiddleware(),
  adLimiter,
  userController.verifyAndRewardAd,
);

module.exports = router;
