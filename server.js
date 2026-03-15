const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const User = require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("User API Server Running");
});

/* ---------------- SEED FUNCTION ---------------- */

async function seedUser() {
  try {
    const count = await User.countDocuments();

    if (count === 0) {
      await User.create({
        name: "Aung Ko Lin",
        email: "aung@gmail.com",
        age: 30
      });

      console.log("Sample user inserted");
    }
  } catch (error) {
    console.error("Seed error:", error);
  }
}

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();   // connect to MongoDB
  await seedUser();    // insert sample data

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();