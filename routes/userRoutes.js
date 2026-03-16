const express = require("express");
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser
} = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");

/* ---------------- PUBLIC ---------------- */
router.post("/login", loginUser);

/* ---------------- PROTECTED ---------------- */
router.post("/", authMiddleware(["ADMIN"]), createUser);
router.get("/", authMiddleware(), getUsers);
router.get("/:id", authMiddleware(), getUserById);
router.put("/:id", authMiddleware(["ADMIN"]), updateUser);
router.delete("/:id", authMiddleware(["ADMIN"]), deleteUser);

module.exports = router;