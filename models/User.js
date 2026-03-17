const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // ---------------- BASIC INFO ----------------
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // ---------------- AUTH ----------------
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    isActive: { type: Boolean, default: true },

    // ---------------- GAME PROFILE ----------------
    username: { type: String, unique: true, sparse: true }, // display name
    avatar: { type: String }, // image URL

    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },

    // ---------------- GAME STATS ----------------
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },

    // ---------------- TRACKING ----------------
    lastLogin: { type: Date },
    lastRewardClaim: { type: Date },

    // ---------------- SECURITY ----------------
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // User model additions
    adViews: { type: Number, default: 0 },
    adClicks: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
