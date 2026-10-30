
const express = require("express");
const { getJobs, getJobById, reloadJobs } = require("../services/jobData.service");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const jobs = getJobs();

    const search = (req.query.search || "").toLowerCase();
    const location = (req.query.location || "").toLowerCase();
    const category = (req.query.category || "").toLowerCase();

    const filteredJobs = jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.company,
        job.description,
        ...(Array.isArray(job.skills) ? job.skills : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const jobLocation = String(job.location || "").toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesLocation = !location || jobLocation.includes(location);
      const matchesCategory =
        !category ||
        job.domain?.categoryId === category ||
        (Array.isArray(job.categories) &&
          job.categories.some((c) => c.toLowerCase() === category));

      return matchesSearch && matchesLocation && matchesCategory;
    });

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const startIndex = (page - 1) * limit;
    const paginatedJobs = filteredJobs.slice(
      startIndex,
      startIndex + limit
    );

    res.json({
      success: true,
      total: filteredJobs.length,
      page,
      limit,
      jobs: paginatedJobs,
    });
  } catch (error) {
    console.error("Error reading jobs:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load job listings.",
    });
  }
});

router.get("/:id", (req, res) => {
  try {
    const job = getJobById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error fetching job:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch job details",
    });
  }
});

module.exports = router;
