require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function createAdmin() {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } =
      process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGO_URI) {
      throw new Error(
        "Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD and MONGO_URI in .env"
      );
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Admin password must contain at least 8 characters.");
    }

    await mongoose.connect(MONGO_URI);

    const email = ADMIN_EMAIL.trim().toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(
        `An account with ${email} already exists. No changes made.`
      );
      return;
    }

    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email,
      password: ADMIN_PASSWORD,
      role: "admin",
    });

    console.log("Admin account created successfully!");
    console.log("Name:", admin.name);
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
