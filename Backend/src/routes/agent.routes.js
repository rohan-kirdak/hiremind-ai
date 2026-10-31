'use strict';

const express = require('express');
const { runOrchestrator } = require('../agents/orchestrator.agent');
const { getConversation, clearConversation } = require('../services/conversation.service');
const { createRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

const chatLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_CHAT_MAX) || 25,
  message: 'Chat rate limit reached for this session. Please wait before asking more questions.',
});

/**
 * POST /api/agent/chat
 * Primary entry point for user interaction with HireMind AI.
 */
router.post('/chat', chatLimiter, async (req, res) => {
  try {
    const { message, conversationId, candidateProfile, userId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty message string is required.',
      });
    }

    const result = await runOrchestrator({
      message: message.trim(),
      conversationId: conversationId || null,
      candidateProfile: candidateProfile || null,
      userId: userId || 'anonymous',
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[agent.routes] Error processing chat:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to process your request.',
    });
  }
});

/**
 * GET /api/agent/conversation/:id
 * Retrieve persistent conversation history and associated profile.
 */
router.get('/conversation/:id', (req, res) => {
  try {
    const conv = getConversation(req.params.id);
    return res.status(200).json({
      success: true,
      conversation: conv,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve conversation history.',
    });
  }
});

/**
 * DELETE /api/agent/conversation/:id
 * Reset / clear conversation history.
 */
router.delete('/conversation/:id', (req, res) => {
  try {
    clearConversation(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Conversation cleared successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to clear conversation.',
    });
  }
});

module.exports = router;
