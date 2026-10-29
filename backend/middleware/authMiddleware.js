const jwt = require("jsonwebtoken");
const User = require("../models/User");

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

// Verify cookie token and retrieve the current user from MongoDB.
const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Please log in.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "_id name email role"
    );

    if (!user) {
      res.clearCookie("token", cookieOptions());

      return res.status(401).json({
        message: "User account no longer exists.",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    res.clearCookie("token", cookieOptions());

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired session. Please log in again.",
      });
    }

    return res.status(500).json({
      message: "Authentication failed.",
    });
  }
};

// Allow only administrators.
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin privileges required.",
    });
  }

  next();
};

module.exports = { protect, adminOnly, cookieOptions };
