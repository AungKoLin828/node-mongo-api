const User = require("../models/User");
const Role = require("../models/Role");
const { hashPassword } = require("../utils/password");

async function seedUsers() {
  try {
    const count = await User.countDocuments();
    if (count > 0) return;

    // Check if default role exists
    let adminRole = await Role.findOne({ name: "ADMIN" });
    if (!adminRole) {
      adminRole = await Role.create({ name: "ADMIN", description: "Admin role" });
    }

    const password = await hashPassword("admin123");

    await User.create({
      name: "Aung Ko Lin",
      email: "aungko.linn404@gmail.com",
      phone: "0912345678",
      password,
      role: adminRole._id,
      isActive: true
    });

    console.log("Seed user inserted successfully");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

module.exports = { seedUsers };