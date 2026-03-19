const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { adLimiter } = require("../middleware/adLimiter");

/* ---------------- PUBLIC ---------------- */
router.post("/login", userController.loginUser);
// router.post("/register", userController.createUser); // optional public registration

/* ---------------- PROTECTED ---------------- */

// User management (Admin only)
router.post("/", authMiddleware(["ADMIN"]), userController.createUser);
router.get("/", authMiddleware(["ADMIN"]), userController.getUsers);
router.get("/:id", authMiddleware(), userController.getUserById);
router.put("/:id", authMiddleware(["ADMIN"]), userController.updateUser);
router.delete("/:id", authMiddleware(["ADMIN"]), userController.deleteUser);

// Game features
router.post("/score", authMiddleware(), userController.updateScore);
router.get("/leaderboard", authMiddleware(), userController.getLeaderboard);

// Ad tracking & stats
router.get("/ads/stats", authMiddleware(), userController.getUserAdStats); // user's ad stats
router.get(
  "/ads/global",
  authMiddleware(["ADMIN"]),
  userController.getGlobalAdStats,
); // global stats (admin)

// Ad actions with rate limiter
router.post(
  "/ads/view",
  authMiddleware(),
  adLimiter,
  userController.trackAdView,
);
router.post(
  "/ads/click",
  authMiddleware(),
  adLimiter,
  userController.trackAdClick,
);
router.post(
  "/ads/reward",
  authMiddleware(),
  adLimiter,
  userController.verifyAndRewardAd,
);

// Monetization / Revenue endpoints
router.get("/ads/revenue", authMiddleware(), userController.getUserAdRevenue); // user's estimated revenue
router.get(
  "/ads/revenue/global",
  authMiddleware(["ADMIN"]),
  userController.getGlobalAdRevenue,
); // total revenue (admin)

// Admin dashboard
router.get(
  "/admin/dashboard",
  authMiddleware(["ADMIN"]),
  userController.getDashboard,
);

module.exports = router;
