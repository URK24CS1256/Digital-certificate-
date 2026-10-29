const express = require("express");
const mongoose = require("mongoose");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Reject invalid dates and dates in the future.
const isValidIssueDate = (value) => {
  if (typeof value !== "string" && !(value instanceof Date)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now();
};

// Validate and retrieve a registered normal user.
const getAssignedUser = async (userId) => {
  if (
    typeof userId !== "string" ||
    !mongoose.isValidObjectId(userId)
  ) {
    return null;
  }

  return User.findOne({
    _id: userId,
    role: "user",
  }).select("_id name");
};

// CREATE: Admin creates and assigns a certificate.
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      certificateId,
      course,
      issuer,
      issueDate,
      status,
      userId,
    } = req.body;

    if (
      typeof certificateId !== "string" ||
      !certificateId.trim() ||
      typeof course !== "string" ||
      !course.trim() ||
      typeof issuer !== "string" ||
      !issuer.trim() ||
      !issueDate ||
      !userId
    ) {
      return res.status(400).json({
        message: "Certificate ID, course, issuer, issue date and assigned user are required.",
      });
    }

    if (!isValidIssueDate(issueDate)) {
      return res.status(400).json({ message: "Issue date must be a valid date that is not in the future." });
    }

    if (status !== undefined && !["Valid", "Revoked"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Valid or Revoked.",
      });
    }

    const assignedUser = await getAssignedUser(userId);

    if (!assignedUser) {
      return res.status(400).json({
        message: "Select a registered normal user.",
      });
    }

    const certificate = await Certificate.create({
      certificateId: certificateId.trim().toUpperCase(),
      recipientName: assignedUser.name,
      course: course.trim(),
      issuer: issuer.trim(),
      issueDate,
      status: status || "Valid",
      userId: assignedUser._id,
    });

    return res.status(201).json({
      message: "Certificate created and assigned successfully.",
      certificate,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This certificate ID already exists.",
      });
    }

    console.error("Create certificate error:", error.message);
    return res.status(400).json({ message: "Unable to create certificate. Check the supplied fields." });
  }
});

// READ: Admin sees all certificates; normal users see only assigned certificates.
router.get("/", protect, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { userId: req.user.id };

    const certificates = await Certificate.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json(certificates);
  } catch (error) {
    console.error("List certificates error:", error.message);
    return res.status(500).json({ message: "Unable to retrieve certificates." });
  }
});

// READ ONE: Admin can access any certificate; users only their own.
router.get("/id/:certificateId", protect, async (req, res) => {
  try {
    const filter = {
      certificateId: req.params.certificateId.trim().toUpperCase(),
    };

    if (req.user.role !== "admin") {
      filter.userId = req.user.id;
    }

    const certificate = await Certificate.findOne(filter);

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found.",
      });
    }

    return res.status(200).json(certificate);
  } catch (error) {
    console.error("Get certificate error:", error.message);
    return res.status(500).json({ message: "Unable to retrieve certificate." });
  }
});

// PUBLIC VERIFICATION: Anyone can verify a certificate by its ID.
router.get("/verify/:certificateId", async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId.trim().toUpperCase(),
    });

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found.",
      });
    }

    // Return only fields needed by the public verification page. Never expose
    // internal MongoDB IDs, userId, or timestamps through this public endpoint.
    const publicCertificate = {
      certificateId: certificate.certificateId,
      recipientName: certificate.recipientName,
      course: certificate.course,
      issuer: certificate.issuer,
      issueDate: certificate.issueDate,
      status: certificate.status,
    };
    const valid = certificate.status === "Valid";

    return res.status(200).json({
      valid,
      certificate: publicCertificate,
      message: certificate.status === "Revoked"
        ? "Certificate has been revoked."
        : "Certificate is valid.",
    });
  } catch (error) {
    console.error("Verify certificate error:", error.message);
    return res.status(500).json({ message: "Unable to verify certificate." });
  }
});

// UPDATE: Admin edits certificate details or changes assignment.
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid certificate ID.",
      });
    }

    const allowedFields = [
      "certificateId",
      "course",
      "issuer",
      "issueDate",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.certificateId !== undefined) {
      if (
        typeof updates.certificateId !== "string" ||
        !updates.certificateId.trim()
      ) {
        return res.status(400).json({
          message: "Certificate ID cannot be empty.",
        });
      }

      updates.certificateId = updates.certificateId.trim().toUpperCase();
    }

    for (const field of ["course", "issuer"]) {
      if (updates[field] !== undefined) {
        if (
          typeof updates[field] !== "string" ||
          !updates[field].trim()
        ) {
          return res.status(400).json({
            message: `${field} cannot be empty.`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    if (updates.issueDate !== undefined && !isValidIssueDate(updates.issueDate)) {
      return res.status(400).json({ message: "Issue date must be a valid date that is not in the future." });
    }

    if (
      updates.status !== undefined &&
      !["Valid", "Revoked"].includes(updates.status)
    ) {
      return res.status(400).json({
        message: "Status must be Valid or Revoked.",
      });
    }

    if (req.body.userId !== undefined) {
      const assignedUser = await getAssignedUser(req.body.userId);

      if (!assignedUser) {
        return res.status(400).json({
          message: "Select a registered normal user.",
        });
      }

      updates.userId = assignedUser._id;
      updates.recipientName = assignedUser.name;
    }

    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found.",
      });
    }

    return res.status(200).json({
      message: "Certificate updated successfully.",
      certificate,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This certificate ID already exists.",
      });
    }

    console.error("Update certificate error:", error.message);
    return res.status(400).json({ message: "Unable to update certificate. Check the supplied fields." });
  }
});

// DELETE: Admin only.
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid certificate ID.",
      });
    }

    const certificate = await Certificate.findByIdAndDelete(
      req.params.id
    );

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found.",
      });
    }

    return res.status(200).json({
      message: "Certificate deleted successfully.",
    });
  } catch (error) {
    console.error("Delete certificate error:", error.message);
    return res.status(500).json({ message: "Unable to delete certificate." });
  }
});

module.exports = router;
