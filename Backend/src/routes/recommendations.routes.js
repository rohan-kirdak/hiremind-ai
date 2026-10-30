const express = require("express");
const { getJobs } = require("../services/jobData.service");
const { recommendJobs } = require("../services/jobMatching.service.v4.1");

const router = express.Router();

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

    const jobs = getJobs();

    if (!Array.isArray(jobs)) {
      throw new Error("Jobs dataset must contain an array.");
    }

    const category = typeof req.body.category === 'string' ? req.body.category.toLowerCase().trim() : null;
    let pool = jobs;
    if (category) {
      pool = jobs.filter(
        (j) =>
          j.domain?.categoryId === category ||
          (Array.isArray(j.categories) &&
            j.categories.some((c) => c.toLowerCase() === category)),
      );
    }

    const recommendations = recommendJobs(
      candidateProfile,
      pool,
      limit,
    );

    return res.status(200).json({
      success: true,
      totalJobsConsidered: pool.length,
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