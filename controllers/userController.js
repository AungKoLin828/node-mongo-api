const User = require("../models/User");
const Role = require("../models/Role");
const jwt = require("jsonwebtoken");
const { handleError } = require("../utils/errorHandler");
const { hashPassword, comparePassword } = require("../utils/password");

/* ---------------- CREATE USER ---------------- */
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, roleName, isActive } = req.body;

    if (await User.findOne({ phone })) 
      return res.status(400).json({ message: "Phone already registered" });

    const role = await Role.findOne({ name: roleName });
    if (!role) return res.status(400).json({ message: "Role not found" });

    const user = await User.create({
      name,
      email,
      phone,
      password: await hashPassword(password),
      role: role._id,
      isActive: isActive ?? true
    });

    await user.populate("role");

    res.status(201).json(user);
  } catch (error) {
    handleError(res, error);
  }
};

/* ---------------- GET USERS ---------------- */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().populate("role");
    res.json(users);
  } catch (error) {
    handleError(res, error);
  }
};

/* ---------------- GET USER BY ID ---------------- */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("role");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
};

/* ---------------- UPDATE USER ---------------- */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, password, roleName, isActive } = req.body;
    const updateData = { name, email, phone, isActive };

    if (password) updateData.password = await hashPassword(password);
    if (roleName) {
      const role = await Role.findOne({ name: roleName });
      if (!role) return res.status(400).json({ message: "Role not found" });
      updateData.role = role._id;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true
    }).populate("role");

    res.json(updatedUser);
  } catch (error) {
    handleError(res, error);
  }
};

/* ---------------- DELETE USER ---------------- */
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    handleError(res, error);
  }
};

/* ---------------- LOGIN ---------------- */
exports.loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!(await comparePassword(password, user.password)))
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    handleError(res, error);
  }
};