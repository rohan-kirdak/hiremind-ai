// Prefer IPv4 DNS resolution on Windows — prevents "fetch failed" errors
// when the Gemini SDK uses Node.js's built-in fetch against Google APIs.
// Must be the very first statement before any network-related modules load.
require("dns").setDefaultResultOrder("ipv4first");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 5000;

const jobsRoutes = require("./src/routes/jobs.routes");
const resumeRoutes = require("./src/routes/resume.routes");
const recommendationsRoutes = require("./src/routes/recommendations.routes");
const agentRoutes = require("./src/routes/agent.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HireMind AI backend is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
  });
});

app.use("/api/jobs", jobsRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/agent", agentRoutes);

// Global 404 JSON handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err.message || err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

app.listen(PORT, () => {
  console.log(`HireMind AI server running on port ${PORT}`);
});
