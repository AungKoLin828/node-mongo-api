const AdEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["VIEW", "CLICK", "REWARDED"] },

    ip: String,
    deviceId: String,
    userAgent: String,

    adProvider: String, // ADMOB, UNITY
    adUnitId: String,

    revenue: { type: Number, default: 0 },

    isFraud: { type: Boolean, default: false },
  },
  { timestamps: true },
);
