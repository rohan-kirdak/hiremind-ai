const express = require("express");
const fs = require("fs");
const path = require("path");

const { recommendJobs } = require("../services/jobMatching.service.v4.1");

const router = express.Router();

const jobsFilePath = path.resolve(
  __dirname,
  "../../../job-data-collector/jobs.json",
);

router.post("/", (req, res) => {
  try {
    const { candidateProfile } = req.body;

    if (
      !candidateProfile ||
      typeof candidateProfile !== "object" ||
      !Array.isArray(candidateProfile.skills)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid candidateProfile with a skills array is required.",
      });
    }

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.body.limit, 10) || 10),
    );

    const jobs = JSON.parse(fs.readFileSync(jobsFilePath, "utf-8"));

    if (!Array.isArray(jobs)) {
      throw new Error("Jobs dataset must contain an array.");
    }

    const recommendations = recommendJobs(
      candidateProfile,
      jobs,
      limit,
    );

    return res.status(200).json({
      success: true,
      totalJobsConsidered: jobs.length,
      totalRecommendations: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to generate job recommendations.",
    });
  }
});

module.exports = router;