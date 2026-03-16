const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      unique: true,
      sparse: true
    },

    phone: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    age: {
      type: Number
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", UserSchema);