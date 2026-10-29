
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
require("dotenv").config();
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

app.listen(PORT, () => {
  console.log(`HireMind AI server running on port ${PORT}`);
});
