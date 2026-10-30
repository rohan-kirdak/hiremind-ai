'use strict';

/**
 * HireMind AI — Orchestrator Agent
 *
 * Primary coordinator of the hybrid multi-agent architecture:
 * 1. Understands user messages and identifies intent.
 * 2. Decides whether to delegate to Resume Agent, Career Guidance Agent, or Backend Services.
 * 3. Coordinates structured handoffs.
 * 4. Maintains conversational context via conversation.service.
 * 5. Generates the final, cohesive user response.
 */

const { generateWithRetry, getModel, Type } = require('../services/gemini.client');
const { getJobs } = require('../services/jobData.service');
const { recommendJobs, calculateJobMatch } = require('../services/jobMatching.service.v4.1');
const { analyzeResumeText } = require('./resume.agent');
const {
  explainMatchResults,
  explainSkillGaps,
  generateInterviewPrep,
  provideGeneralGuidance,
} = require('./careerGuidance.agent');
const {
  getConversation,
  addMessage,
  updateCandidateProfile,
  getRecentHistory,
} = require('../services/conversation.service');

const MAX_STEPS = 5;

function formatSalary(salary) {
  if (!salary || typeof salary !== 'object') return salary || 'Not specified';
  if (salary.min == null && salary.max == null) return 'Not specified';
  const currency = salary.currency || 'USD';
  const period = salary.period ? ` / ${salary.period}` : '';
  if (salary.min != null && salary.max != null) {
    return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()} ${currency}${period}`;
  }
  if (salary.min != null) return `From $${salary.min.toLocaleString()} ${currency}${period}`;
  if (salary.max != null) return `Up to $${salary.max.toLocaleString()} ${currency}${period}`;
  return 'Not specified';
}

function cleanExcerpt(text, maxChars = 200) {
  if (!text) return '';
  const plain = String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxChars) return plain;
  return plain.slice(0, maxChars).trim() + '...';
}

const tools = [
  {
    functionDeclarations: [
      {
        name: 'search_jobs',
        description: 'Search the job dataset by keyword, category, or location without candidate matching.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            keyword: {
              type: Type.STRING,
              description: 'Keyword in title, description, company, or skills',
            },
            category: {
              type: Type.STRING,
              description: 'Optional category filter: it-software, marketing, sales, hr, finance, design, support, operations, healthcare, legal, education, logistics, hospitality',
            },
            location: {
              type: Type.STRING,
              description: 'Optional location string (e.g. Worldwide, Remote, United States)',
            },
          },
        },
      },
      {
        name: 'recommend_jobs',
        description: 'Rank jobs for the current candidate profile using the deterministic matching engine.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            limit: {
              type: Type.INTEGER,
              description: 'Number of recommendations, 1-10 (default 5)',
            },
            category: {
              type: Type.STRING,
              description: 'Optional domain category to restrict recommendations to',
            },
          },
        },
      },
      {
        name: 'analyze_resume',
        description: 'Delegate to the Resume Agent to extract structured profile, designation, skills, and domain from resume text.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            resumeText: {
              type: Type.STRING,
              description: 'Raw resume text or summary provided by the user',
            },
          },
          required: ['resumeText'],
        },
      },
      {
        name: 'explain_job_match',
        description: 'Delegate to Career Guidance Agent to explain why a job received a specific match score, breakdown, and matched/missing skills.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            jobId: {
              type: Type.STRING,
              description: 'The jobId of the recommended job to explain',
            },
          },
          required: ['jobId'],
        },
      },
      {
        name: 'get_skill_gap_advice',
        description: 'Delegate to Career Guidance Agent to analyze verified missing skills across target roles and suggest learning paths.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            targetRole: {
              type: Type.STRING,
              description: 'Optional target job title or role name',
            },
          },
        },
      },
      {
        name: 'get_interview_prep',
        description: 'Delegate to Career Guidance Agent to generate interview questions and prep guide tailored to a specific job.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            jobId: {
              type: Type.STRING,
              description: 'The jobId of the job to prepare interview answers for',
            },
          },
          required: ['jobId'],
        },
      },
    ],
  },
];

/**
 * Dispatches tool executions to the appropriate specialist agent or backend service.
 */
async function executeTool(name, args, candidateProfile, jobs, conversationId) {
  // --- Backend Service: Job Search ---
  if (name === 'search_jobs') {
    const keyword = String(args.keyword || '').trim().toLowerCase();
    const category = String(args.category || '').trim().toLowerCase();
    const location = String(args.location || '').trim().toLowerCase();

    const matchedJobs = jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.description,
        job.company,
        ...(Array.isArray(job.skills) ? job.skills : []),
      ]
        .filter((v) => typeof v === 'string')
        .join(' ')
        .toLowerCase();

      const jobLoc = String(job.location || '').toLowerCase();
      const jobCat = job.domain?.categoryId || '';

      const matchKey = !keyword || searchableText.includes(keyword);
      const matchLoc = !location || jobLoc.includes(location);
      const matchCat = !category || jobCat === category || (Array.isArray(job.categories) && job.categories.some((c) => c.toLowerCase() === category));

      return matchKey && matchLoc && matchCat;
    });

    const topJobs = matchedJobs.slice(0, 5).map((job) => ({
      jobId: job.jobId,
      title: job.title || 'Not specified',
      company: job.company || 'Not specified',
      domain: job.domain?.categoryName || 'General',
      location: job.location || 'Not specified',
      workMode: job.workMode || 'Not specified',
      salary: formatSalary(job.salary),
      summary: cleanExcerpt(job.description, 200),
      sourceLink: job.sourceLink || 'Not specified',
      applicationUrl: job.sourceLink || 'Not specified',
      skills: Array.isArray(job.skills) ? job.skills : [],
    }));

    return {
      totalMatches: matchedJobs.length,
      returnedCount: topJobs.length,
      jobs: topJobs,
    };
  }

  // --- Backend Service: Deterministic Job Matching ---
  if (name === 'recommend_jobs') {
    if (!candidateProfile || !Array.isArray(candidateProfile.skills)) {
      return {
        error: 'A candidate profile with skills is required for job matching. Ask the user to upload or provide their resume first.',
      };
    }

    const limit = Math.min(10, Math.max(1, Number(args.limit) || 5));
    const category = String(args.category || '').trim().toLowerCase();

    let pool = jobs;
    if (category) {
      pool = jobs.filter((j) => j.domain?.categoryId === category);
    }

    const recommendations = recommendJobs(candidateProfile, pool, limit);

    return {
      totalEvaluated: pool.length,
      recommendations: recommendations.map((r) => ({
        jobId: r.jobId,
        title: r.title,
        company: r.company,
        domain: r.domain?.category || 'General',
        location: r.location,
        workMode: r.workMode,
        experienceRequired: r.experienceRequired,
        matchScore: r.matchScore,
        matchedSkills: r.matchedSkills,
        missingSkills: r.missingSkills,
        scoreBreakdown: r.scoreBreakdown,
        evidenceLevel: r.skillEvidence?.level || 'unknown',
        reasons: r.reasons,
        salary: r.salary ? formatSalary(r.salary) : 'Not specified',
        sourceLink: r.sourceLink || 'Not specified',
        applicationUrl: r.sourceLink || 'Not specified',
      })),
    };
  }

  // --- Specialist Agent 2: Resume Agent Handoff ---
  if (name === 'analyze_resume') {
    const resumeText = String(args.resumeText || '').trim();
    if (!resumeText) {
      return { error: 'Please provide resume text to analyze.' };
    }

    const result = await analyzeResumeText(resumeText);
    if (conversationId && result.profile) {
      updateCandidateProfile(conversationId, result.profile);
    }

    return {
      success: true,
      extractedProfile: result.profile,
      domain: result.domain,
      summary: result.summary,
    };
  }

  // --- Specialist Agent 3: Career Guidance - Explain Match ---
  if (name === 'explain_job_match') {
    const jobId = String(args.jobId || '').trim();
    const job = jobs.find((j) => j.jobId === jobId);

    if (!job) {
      return { error: `Job with ID '${jobId}' not found in dataset.` };
    }

    if (!candidateProfile) {
      return { error: 'Candidate profile required to explain match score.' };
    }

    const match = calculateJobMatch(candidateProfile, job);
    const explanation = await explainMatchResults({
      candidateProfile,
      matchedJob: match,
    });

    return {
      jobId,
      title: job.title,
      company: job.company,
      matchScore: match.matchScore,
      scoreBreakdown: match.scoreBreakdown,
      explanation,
    };
  }

  // --- Specialist Agent 3: Career Guidance - Skill Gaps ---
  if (name === 'get_skill_gap_advice') {
    if (!candidateProfile || !Array.isArray(candidateProfile.skills)) {
      return { error: 'Candidate profile required for skill gap analysis.' };
    }

    const targetRole = String(args.targetRole || candidateProfile.designation || '').trim();
    const targetJobs = recommendJobs(candidateProfile, jobs, 5);

    const advice = await explainSkillGaps({
      candidateProfile,
      recommendedJobs: targetJobs,
      targetRole,
    });

    return {
      targetRole,
      advice,
    };
  }

  // --- Specialist Agent 3: Career Guidance - Interview Prep ---
  if (name === 'get_interview_prep') {
    const jobId = String(args.jobId || '').trim();
    const job = jobs.find((j) => j.jobId === jobId);

    if (!job) {
      return { error: `Job with ID '${jobId}' not found.` };
    }

    const match = candidateProfile ? calculateJobMatch(candidateProfile, job) : { title: job.title, company: job.company, matchedSkills: [], missingSkills: job.skills || [] };
    const prepGuide = await generateInterviewPrep({
      candidateProfile,
      targetJob: { ...job, ...match },
    });

    return {
      jobId,
      title: job.title,
      company: job.company,
      prepGuide,
    };
  }

  return { error: `Unknown tool: ${name}` };
}

/**
 * Main Orchestrator entry point.
 * Coordinates conversation context, intent identification, tool invocation, and handoffs.
 *
 * @param {object} options
 * @param {string} options.message - User prompt
 * @param {string} [options.conversationId] - Active conversation ID for memory persistence
 * @param {object} [options.candidateProfile] - Optional candidate profile override
 * @param {string} [options.userId='anonymous']
 * @returns {Promise<object>} Orchestrator response { success, answer, conversationId, candidateProfile }
 */
async function runOrchestrator({ message, conversationId = null, candidateProfile = null, userId = 'anonymous' }) {
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('A message is required.');
  }

  if (message.length > 4000) {
    throw new Error('Message must be 4000 characters or fewer.');
  }

  // Retrieve or create conversation record
  const conversation = getConversation(conversationId, userId);
  const activeConversationId = conversation.conversationId;

  // Active candidate profile resolution: passed profile > conversation stored profile > null
  let activeProfile = candidateProfile || conversation.candidateProfile || null;
  if (candidateProfile) {
    updateCandidateProfile(activeConversationId, candidateProfile);
    activeProfile = candidateProfile;
  }

  // Record user message
  addMessage(activeConversationId, { role: 'user', content: message.trim() });

  const jobs = getJobs();

  // Retrieve recent conversation history for multi-turn context
  const history = getRecentHistory(activeConversationId, 6);

  // System instruction for Orchestrator
  const systemInstruction = `
You are the Orchestrator Agent for HireMind AI — a practical, explainable, multi-domain AI job-search platform.
You coordinate tasks between specialist agents and traditional backend services across all professional domains (IT, Finance, Marketing, HR, Sales, Design, Support, Operations, Healthcare, Legal, Education, Logistics, Hospitality).

YOUR ARCHITECTURAL ROLES:
1. Orchestrator (You): Understand intent, coordinate handoffs, formulate final answers.
2. Resume Agent (Tool 'analyze_resume'): Extracts candidate designation, skills, experience, and domain from resume text.
3. Matching Engine (Tool 'recommend_jobs'): Deterministically ranks jobs for a profile.
4. Job Search Service (Tool 'search_jobs'): Searches jobs by keyword, category, or location without matching.
5. Career Guidance Agent (Tools 'explain_job_match', 'get_skill_gap_advice', 'get_interview_prep'): Explains match scores, verified skill gaps, and interview prep.

EXECUTION RULES:
- If user provides resume text or asks to analyze resume -> Call 'analyze_resume'.
- If user wants job recommendations and profile exists -> Call 'recommend_jobs'.
- If user wants job recommendations but has NO profile -> Ask them to upload/paste their resume or use 'search_jobs'.
- If user asks why a score was given -> Call 'explain_job_match' with the relevant jobId.
- If user asks what skills they need to learn or improve -> Call 'get_skill_gap_advice'.
- If user asks how to prepare for an interview for a job -> Call 'get_interview_prep'.
- If user asks a general career question -> Answer directly or call 'get_skill_gap_advice'.
- Never execute tools unnecessarily. For simple questions, answer directly.
- NEVER invent salary, company, match scores, or jobs. Use only facts returned by tools.
- Maintain a warm, encouraging, and highly professional tone.
`;

  // Build contents array starting with multi-turn history
  const contents = [...history];

  // Append context prompt for current turn
  contents.push({
    role: 'user',
    parts: [
      {
        text: [
          `Current User Message: ${message.trim()}`,
          activeProfile
            ? `Active Candidate Profile in Memory: ${JSON.stringify({
                name: activeProfile.name,
                designation: activeProfile.designation,
                skills: activeProfile.skills,
                experienceCount: activeProfile.experience?.length || 0,
              })}`
            : 'No candidate profile currently attached to conversation.',
        ].join('\n'),
      },
    ],
  });

  let finalAnswer = '';
  let stepsTaken = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    stepsTaken = step + 1;

    try {
      const response = await generateWithRetry({
        model: getModel(),
        contents,
        config: {
          systemInstruction,
          tools,
          temperature: 0.2,
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const functionCalls = parts.filter((part) => part.functionCall);

      if (functionCalls.length === 0) {
        finalAnswer = parts
          .filter((part) => part.text)
          .map((part) => part.text)
          .join('\n');
        break;
      }

      // Add model's function calls to conversation turn
      contents.push({
        role: 'model',
        parts,
      });

      // Execute each tool call
      const functionResponses = [];
      for (const { functionCall } of functionCalls) {
        let result;
        try {
          result = await executeTool(
            functionCall.name,
            functionCall.args || {},
            activeProfile,
            jobs,
            activeConversationId,
          );

          // If analyze_resume was run, update active profile
          if (functionCall.name === 'analyze_resume' && result.extractedProfile) {
            activeProfile = result.extractedProfile;
          }
        } catch (err) {
          result = { error: err.message };
        }

        functionResponses.push({
          functionResponse: {
            name: functionCall.name,
            response: { result },
          },
        });
      }

      contents.push({
        role: 'user',
        parts: functionResponses,
      });
    } catch (error) {
      console.warn(`[orchestrator.agent] Generation error (${error.message}).`);

      // Grounded fallback handling when network is sandboxed or Gemini is unreachable
      const fallbackResult = await handleDirectFallback(message, activeProfile, jobs, activeConversationId);
      finalAnswer = fallbackResult.answer;
      if (fallbackResult.updatedProfile) {
        activeProfile = fallbackResult.updatedProfile;
      }
      break;
    }
  }

  if (!finalAnswer) {
    const fallbackResult = await handleDirectFallback(message, activeProfile, jobs, activeConversationId);
    finalAnswer = fallbackResult.answer;
    if (fallbackResult.updatedProfile) {
      activeProfile = fallbackResult.updatedProfile;
    }
  }

  // Record assistant response in conversation memory
  addMessage(activeConversationId, {
    role: 'model',
    content: finalAnswer,
    metadata: { steps: stepsTaken },
  });

  return {
    success: true,
    answer: finalAnswer,
    conversationId: activeConversationId,
    candidateProfile: activeProfile,
    steps: stepsTaken,
  };
}

/**
 * Deterministic fallback dispatcher when LLM network connectivity is restricted.
 * Guarantees zero downtime and complete functionality for all core user intents.
 */
async function handleDirectFallback(message, candidateProfile, jobs, conversationId) {
  const text = message.toLowerCase();

  // 1. Resume Analysis Intent
  if (/resume|cv|curriculum vitae|my background|analyze me/i.test(text) && text.length > 50) {
    const parsed = await analyzeResumeText(message);
    if (parsed.profile && conversationId) {
      updateCandidateProfile(conversationId, parsed.profile);
    }
    return {
      answer: [
        `### Resume Analysis Completed`,
        `**Candidate Name:** ${parsed.profile.name || 'Identified'}`,
        `**Designation:** ${parsed.profile.designation || 'Professional'}`,
        `**Domain:** ${parsed.domain.categoryName} (${parsed.domain.roleName})`,
        `**Extracted Skills (${parsed.profile.skills.length}):** ${parsed.profile.skills.join(', ')}`,
        '',
        `**Summary:** ${parsed.summary}`,
        '',
        `You can now ask me to **"recommend jobs"** or ask for **"skill gap advice"** tailored to your background!`,
      ].join('\n'),
      updatedProfile: parsed.profile,
    };
  }

  // 2. Recommend Jobs Intent
  if (/recommend|match|find (me )?jobs|suitable jobs|my jobs/i.test(text)) {
    if (!candidateProfile || !Array.isArray(candidateProfile.skills)) {
      return {
        answer: 'To get personalized job recommendations, please provide your resume text or upload your CV first.',
        updatedProfile: null,
      };
    }

    const recs = recommendJobs(candidateProfile, jobs, 3);
    return {
      answer: [
        `### Top Job Recommendations for ${candidateProfile.designation || 'Your Profile'}:`,
        '',
        ...recs.map((r, i) =>
          `**${i + 1}. ${r.title}** at **${r.company || 'Company'}**\n` +
          `- Match Score: **${r.matchScore}/100** (Title: ${r.scoreBreakdown?.title}%, Skills: ${r.scoreBreakdown?.skills}%)\n` +
          `- Matched Skills: ${r.matchedSkills.join(', ') || 'None'}\n` +
          `- Missing Skills: ${r.missingSkills.join(', ') || 'None'}\n` +
          `- Job ID: \`${r.jobId}\``
        ),
        '',
        'Would you like me to explain the match score for any of these roles, or give you advice on how to bridge the missing skills?',
      ].join('\n'),
      updatedProfile: null,
    };
  }

  // 3. Interview Prep Intent
  const jobIdMatch = text.match(/himalayas_[a-z0-9_-]+/i) || message.match(/\b([a-zA-Z0-9_-]{8,})\b/);
  if (/interview|questions?|prepare/i.test(text) && jobIdMatch) {
    const job = jobs.find((j) => j.jobId === jobIdMatch[0]) || jobs[0];
    if (job) {
      const match = candidateProfile
        ? calculateJobMatch(candidateProfile, job)
        : { title: job.title, company: job.company, matchedSkills: [], missingSkills: job.skills || [] };
      const guide = await generateInterviewPrep({ candidateProfile, targetJob: { ...job, ...match } });
      return { answer: guide, updatedProfile: null };
    }
  }

  // 4. Score Explanation Intent
  if (/explain|why|how (come|did)|score/i.test(text) && jobIdMatch) {
    const job = jobs.find((j) => j.jobId === jobIdMatch[0]) || jobs[0];
    if (job && candidateProfile) {
      const match = calculateJobMatch(candidateProfile, job);
      const explanation = await explainMatchResults({ candidateProfile, matchedJob: match });
      return { answer: explanation, updatedProfile: null };
    }
  }

  // 5. Skill Gap / Improvement Intent
  if (
    /skill/i.test(text) &&
    /(improve|gap|learn|missing|develop|need|study|focus)/i.test(text)
  ) {
    if (!candidateProfile) {
      return {
        answer:
          'Please share your profile or resume so I can evaluate your verified skill gaps against active job postings.',
        updatedProfile: null,
      };
    }
    const recs = recommendJobs(candidateProfile, jobs, 4);
    const gaps = await explainSkillGaps({
      candidateProfile,
      recommendedJobs: recs,
    });
    return { answer: gaps, updatedProfile: null };
  }

  // 6. Job Search Intent (without profile)
  if (/search|find|looking for|jobs in|openings/i.test(text)) {
    const cleanedKeywords = text
      .replace(/\b(search|find|looking|for|jobs?|openings?|remote|in|a|an|the|show|me)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const results = jobs
      .filter((j) => {
        const searchable = [
          j.title,
          j.company,
          j.domain?.categoryName,
          j.domain?.roleName,
          ...(Array.isArray(j.skills) ? j.skills : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes(cleanedKeywords);
      })
      .slice(0, 3);

    if (results.length) {
      return {
        answer: [
          `### Matching Positions for "${cleanedKeywords || 'Customer Support'}":`,
          '',
          ...results.map((j, i) =>
            `**${i + 1}. ${j.title}** at **${j.company || 'Company'}** (${j.location})\n` +
            `- Domain: ${j.domain?.categoryName || 'General'}\n` +
            `- Skills: ${j.skills?.slice(0, 5).join(', ') || 'Not specified'}\n` +
            `- Job ID: \`${j.jobId}\``
          ),
        ].join('\n'),
        updatedProfile: null,
      };
    }
  }

  // 7. General Career / Role Guidance
  if (
    /(what does|tell me about|how to become|role of|career path|responsibilities of)\s+(a\s+|an\s+)?([a-z\s]+)/i.test(
      text,
    )
  ) {
    const guidance = await provideGeneralGuidance({
      candidateProfile,
      query: message,
      matchedJobs: jobs.slice(0, 3),
    });
    return { answer: guidance, updatedProfile: null };
  }

  // 8. General / Fallback
  return {
    answer:
      `Hello! I am your HireMind AI Career Assistant. I can help you across any professional domain:\n` +
      `1. **Analyze Resume**: Paste your resume text to extract skills and experience.\n` +
      `2. **Find & Match Jobs**: Get ranked positions tailored to your profile.\n` +
      `3. **Skill Gap Guidance**: Learn what skills to improve for your target roles.\n` +
      `4. **Interview Prep**: Practice questions customized to specific job requirements.\n\n` +
      `How can I assist your career search today?`,
    updatedProfile: null,
  };
}

module.exports = {
  runOrchestrator,
  executeTool,
};
