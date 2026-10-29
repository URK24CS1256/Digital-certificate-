const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const certificateRoutes = require("./routes/CertificateRoutes");
const authRoutes = require("./routes/AuthRoutes");

const app = express();

// Fail fast rather than silently starting with insecure/missing secrets.
if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required in backend/.env");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET is required and must be at least 32 characters long");
}

const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    // Requests without Origin include same-origin/server-to-server calls.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.use("/api/certificates", certificateRoutes);
app.use("/api/auth", authRoutes);
app.get("/", (_req, res) => res.send("Digital Certificate Verification System API is running!"));

// Central error handler, including rejected CORS origins and malformed JSON.
app.use((error, _req, res, _next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON request body." });
  }
  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed." });
  }
  console.error("Unhandled request error:", error.message);
  return res.status(500).json({ message: "Internal server error." });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    const port = Number(process.env.PORT) || 5000;
    app.listen(port, "0.0.0.0", () => console.log(`Server running on port ${port}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
