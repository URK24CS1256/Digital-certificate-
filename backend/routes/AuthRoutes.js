const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const jwt = require("jsonwebtoken");
const {
  protect,
  adminOnly,
  cookieOptions,
} = require("../middleware/authMiddleware");

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const isStrongPassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (name.trim().length > 100 || email.trim().length > 254) {
      return res.status(400).json({ message: "Name or email is too long." });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must have at least 8 characters, an uppercase letter, a lowercase letter and a number",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // Public signup must never create an administrator.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "user",
    });

    return res.status(201).json({
      message: "Account created successfully",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    console.error("Signup error:", error.message);
    return res.status(500).json({
      message: "Unable to create account",
    });
  }
});

// LOGIN — JWT is sent only in an HttpOnly cookie.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      ...cookieOptions(),
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      message: "Unable to log in",
    });
  }
});

// CURRENT SESSION — used by ProtectedRoute.
router.get("/me", protect, (req, res) => {
  return res.status(200).json({ user: req.user });
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions());

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

// GET ALL USERS — Admin only.
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("_id name email role createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);
    return res.status(500).json({
      message: "Unable to retrieve users",
    });
  }
});

// GET ONE USER — Admin only.
router.get("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(req.params.id)
      .select("_id name email role createdAt updatedAt");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get user error:", error.message);
    return res.status(500).json({
      message: "Unable to retrieve user",
    });
  }
});

// DELETE A NORMAL USER — Admin only.
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message:
          "Administrator accounts cannot be deleted through this endpoint",
      });
    }

    const assignedCertificates = await Certificate.countDocuments({ userId: user._id });
    if (assignedCertificates > 0) {
      return res.status(409).json({
        message: "This user has assigned certificates. Reassign or delete those certificates before deleting the account.",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error.message);
    return res.status(500).json({
      message: "Unable to delete user",
    });
  }
});

// CHANGE PASSWORD — Logged-in user.
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "New password must have at least 8 characters, an uppercase letter, a lowercase letter and a number",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message:
          "New password must be different from the current password",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const passwordMatches =
      await user.comparePassword(currentPassword);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    // Require a fresh login after a password change.
    res.clearCookie("token", cookieOptions());

    return res.status(200).json({
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({
      message: "Unable to change password",
    });
  }
});

module.exports = router;
