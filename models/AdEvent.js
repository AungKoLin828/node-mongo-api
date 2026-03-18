const mongoose = require("mongoose");

const AdEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["VIEW", "CLICK"] },
    ip: String,
    deviceId: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdEvent", AdEventSchema);
