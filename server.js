const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const { seedUsers } = require("./seed/seedUsers");
const { seedRoles } = require("./seed/seedRoles");

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());

// ---------------- ROUTES ----------------
app.use("/api/users", userRoutes);

app.get("/", (req, res) => res.send("User API Server Running"));

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();    // Connect to MongoDB
    await seedUsers();    // seed default users (optional)
    await seedRoles();   // seed default roles

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1); // exit with failure
  }
}

startServer();