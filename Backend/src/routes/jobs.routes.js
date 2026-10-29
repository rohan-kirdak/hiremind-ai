
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const jobsFilePath = path.resolve(
  __dirname,
  "../../../job-data-collector/jobs.json"
);

router.get("/", (req, res) => {
  try {
    const fileContent = fs.readFileSync(jobsFilePath, "utf-8");
    const jobs = JSON.parse(fileContent);

    const search = (req.query.search || "").toLowerCase();
    const location = (req.query.location || "").toLowerCase();

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

      return (
        searchableText.includes(search) &&
        jobLocation.includes(location)
      );
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

module.exports = router;
