const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: [true, "Certificate ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    recipientName: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },

    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
    },

    issuer: {
      type: String,
      required: [true, "Issuer is required"],
      trim: true,
    },

    issueDate: {
      type: Date,
      required: [true, "Issue date is required"],
    },

    status: {
      type: String,
      enum: ["Valid", "Revoked"],
      default: "Valid",
    },

    // The normal user who owns this certificate.
    // Optional temporarily for compatibility with existing records.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Certificate", certificateSchema);
