const Role = require("../models/Role");

/**
 * Seed default roles into the database
 * Safe to run multiple times; won't create duplicates
 */
async function seedRoles() {
  try {
    // Define default roles
    const roles = [
      { name: "ADMIN", description: "Administrator with full access" },
      { name: "USER", description: "Regular user with limited access" },
      { name: "MODERATOR", description: "Can moderate content" }
    ];

    for (const roleData of roles) {
      // Check if role already exists
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
        console.log(`Role "${roleData.name}" created`);
      } else {
        console.log(`Role "${roleData.name}" already exists`);
      }
    }

    console.log("Role seeding completed");
  } catch (err) {
    console.error("Role seed error:", err);
  }
}

module.exports = { seedRoles };