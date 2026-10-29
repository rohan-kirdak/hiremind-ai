
const express = require("express");
const { runOrchestrator } = require("../agents/orchestrator.agent");

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const result = await runOrchestrator({
      message: req.body.message,
      candidateProfile: req.body.candidateProfile,
    });

    res.json(result);
  } catch (error) {
    console.error("Agent error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to process your request.",
    });
  }
});

module.exports = router;
