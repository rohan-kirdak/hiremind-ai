'use strict';

const express = require('express');
const multer = require('multer');
const { analyzeResumeFile } = require('../agents/resume.agent');
const { updateCandidateProfile } = require('../services/conversation.service');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname || '').split('.').pop().toLowerCase();
    const mime = file.mimetype || '';

    const isPdf =
      ext === 'pdf' &&
      (mime === 'application/pdf' || mime === 'application/x-pdf');
    const isDocx =
      ext === 'docx' &&
      (mime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mime === 'application/msword');

    if (isPdf || isDocx) {
      cb(null, true);
    } else {
      const err = new Error('Only PDF and DOCX files are supported.');
      err.statusCode = 400;
      err.code = 'INVALID_FILE_TYPE';
      cb(err);
    }
  },
});

router.post(
  '/parse',
  (req, res, next) => {
    upload.single('resume')(req, res, (error) => {
      if (error) {
        console.error('Resume upload error:', error);

        return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
          success: false,
          message: error.message || 'Invalid resume upload.',
          code: error.code || 'UPLOAD_ERROR',
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
          message: "Please upload a PDF or DOCX resume using the 'resume' field.",
        });
      }

      const result = await analyzeResumeFile(req.file);

      // If conversationId is supplied, associate profile with the conversation
      const conversationId = req.body?.conversationId;
      if (conversationId && result.profile) {
        updateCandidateProfile(conversationId, result.profile);
      }

      return res.status(200).json({
        success: true,
        message: 'Resume parsed successfully.',
        characterCount: result.characterCount,
        profile: result.profile,
        domain: result.domain,
        summary: result.summary,
      });
    } catch (error) {
      console.error('[resume.routes] Error:', error.message);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : 'Unable to parse resume.',
      });
    }
  },
);

module.exports = router;
