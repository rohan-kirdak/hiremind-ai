
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jobsRoutes = require("./src/routes/jobs.routes");

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

const PORT = process.env.PORT || 5000;
app.use("/api/jobs", jobsRoutes);

app.listen(PORT, () => {
  console.log(`HireMind AI server running on port ${PORT}`);
});
