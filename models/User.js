const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // ---------------- BASIC INFO ----------------
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    phone: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },

    // ---------------- AUTH ----------------
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", index: true },
    isActive: { type: Boolean, default: true },

    // ---------------- GAME PROFILE ----------------
    username: { type: String, unique: true, sparse: true },
    avatar: { type: String },

    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    score: { type: Number, default: 0, index: true },
    coins: { type: Number, default: 0 },

    // 🆕 DAILY REWARD CONTROL (ANTI-ABUSE)
    dailyCoins: { type: Number, default: 0, index: true },
    lastDailyReset: { type: Date, default: Date.now },

    // ---------------- GAME STATS ----------------
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },

    // ---------------- TRACKING ----------------
    lastLogin: { type: Date },
    lastRewardClaim: { type: Date },

    // 🆕 AD TRACKING
    adViews: { type: Number, default: 0, index: true },
    adClicks: { type: Number, default: 0 },

    // 🆕 REWARD CONTROL
    lastAdView: { type: Date },
    lastAdClick: { type: Date },
    lastAdReward: { type: Date },

    // ---------------- SECURITY ----------------
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // 🆕 FRAUD DETECTION
    isSuspicious: { type: Boolean, default: false },
    fraudScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ---------------- INDEXES (IMPORTANT FOR SCALE) ----------------

// Leaderboard
UserSchema.index({ score: -1 });

// Monetization analytics
UserSchema.index({ adViews: -1 });
UserSchema.index({ coins: -1 });

// Daily reward queries
UserSchema.index({ dailyCoins: -1 });

// Security tracking
UserSchema.index({ isSuspicious: 1 });

// ---------------- METHODS (OPTIONAL BUT CLEAN) ----------------

// Reset daily coins automatically
UserSchema.methods.resetDailyCoinsIfNeeded = function () {
  const today = new Date().toDateString();
  const last = this.lastDailyReset
    ? new Date(this.lastDailyReset).toDateString()
    : null;

  if (last !== today) {
    this.dailyCoins = 0;
    this.lastDailyReset = new Date();
  }
};

module.exports = mongoose.model("User", UserSchema);
