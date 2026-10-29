const express = require("express");
const multer = require("multer");
const { extractResumeText } = require("../services/resumeParser.service");
const {
  extractCandidateProfile,
} = require("../services/candidateProfile.service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/parse",
  (req, res, next) => {
    upload.single("resume")(req, res, (error) => {
      if (error) {
        console.error("Resume upload error:", error);

        return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
          success: false,
          message: error.message || "Invalid resume upload.",
          code: error.code || "UPLOAD_ERROR",
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload a PDF or DOCX resume using the 'resume' field.",
        });
      }

      const text = await extractResumeText(req.file);

      const profile = extractCandidateProfile(text);

      return res.status(200).json({
        success: true,
        message: "Resume parsed successfully.",
        characterCount: text.length,
        profile,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : "Unable to parse resume.",
      });
    }
  },
);

module.exports = router;
