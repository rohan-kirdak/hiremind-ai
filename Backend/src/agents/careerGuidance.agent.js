'use strict';

/**
 * HireMind AI — Career Guidance Agent
 *
 * Provides grounded, explainable career guidance, skill gap analysis,
 * interview preparation, and learning paths across all professional domains.
 * Uses only verified candidate profile facts and matching engine outputs.
 * Never invents scores, requirements, or false claims.
 */

const { generateWithRetry, getModel } = require('../services/gemini.client');
const { displaySkill } = require('../utils/skillCatalog');

const CAREER_GUIDANCE_SYSTEM_PROMPT = `
You are the Career Guidance Agent for HireMind AI.
Your role is to explain job matching results, analyze verified skill gaps, recommend practical learning paths, and help candidates prepare for interviews across all domains (IT, Finance, Marketing, HR, Sales, Design, Operations, Healthcare, Legal, etc.).

CRITICAL GROUNDING RULES:
1. Ground every statement in the actual candidate profile and real job matching data provided.
2. NEVER fabricate or invent match scores, job listings, salaries, or requirements.
3. When explaining skill gaps, reference ONLY the explicit "matchedSkills" and "missingSkills" from the matching engine.
4. If a job has "limited" or "none" skill evidence, explicitly caution the user to review the full job description.
5. Provide actionable, supportive, and domain-appropriate advice tailored to the candidate's seniority level.
6. Keep recommendations concise, structured, and easy to read with bullet points.
`;

/**
 * Fallback deterministic explanation when AI is offline or unavailable.
 */
function buildDeterministicExplanation({ candidateProfile, matchedJob }) {
  if (!matchedJob) {
    return 'No matched job details provided for analysis.';
  }

  const { title, company, matchScore, scoreBreakdown, matchedSkills, missingSkills, reasons } = matchedJob;

  const lines = [
    `### Match Analysis for **${title}** at **${company || 'Company'}**`,
    `**Overall Match Score:** ${matchScore}/100`,
    '',
    '**Component Breakdown:**',
    `- Role Title Relevance: ${scoreBreakdown?.title ?? 'N/A'}%`,
    `- Skills Relevance: ${scoreBreakdown?.skills ?? 'N/A'}%`,
    `- Experience Match: ${scoreBreakdown?.experience ?? 'N/A'}%`,
    `- Location / Work Mode: ${scoreBreakdown?.location ?? 'N/A'}%`,
    '',
    `**Matched Skills (${matchedSkills?.length || 0}):** ${matchedSkills?.join(', ') || 'None identified'}`,
    `**Missing Skills (${missingSkills?.length || 0}):** ${missingSkills?.join(', ') || 'None identified'}`,
  ];

  if (Array.isArray(reasons) && reasons.length) {
    lines.push('', '**Key System Reasons:**');
    reasons.forEach((r) => lines.push(`- ${r}`));
  }

  if (missingSkills && missingSkills.length > 0) {
    lines.push(
      '',
      '**Recommended Focus Areas:**',
      `To increase your match readiness for this role, prioritize developing competence in: **${missingSkills.slice(0, 3).join(', ')}**.`,
    );
  }

  return lines.join('\n');
}

/**
 * Explain why a candidate received a particular match score on a job.
 *
 * @param {object} params
 * @param {object} params.candidateProfile
 * @param {object} params.matchedJob
 * @returns {Promise<string>}
 */
async function explainMatchResults({ candidateProfile, matchedJob }) {
  if (!matchedJob) {
    throw new Error('A matched job object is required.');
  }

  const fallbackText = buildDeterministicExplanation({ candidateProfile, matchedJob });

  try {
    const prompt = `
Explain this job matching result to the candidate in an encouraging, clear, and actionable way:

Candidate Profile:
- Title: ${candidateProfile?.designation || 'Not specified'}
- Skills: ${(candidateProfile?.skills || []).join(', ') || 'Not specified'}
- Years of experience: ${candidateProfile?.experience?.length || 0} listed positions

Matched Job Details:
- Title: ${matchedJob.title}
- Company: ${matchedJob.company || 'Not specified'}
- Overall Match Score: ${matchedJob.matchScore}/100
- Score Breakdown: Title ${matchedJob.scoreBreakdown?.title}%, Skills ${matchedJob.scoreBreakdown?.skills}%, Experience ${matchedJob.scoreBreakdown?.experience}%, Location ${matchedJob.scoreBreakdown?.location}%
- Matched Skills: ${(matchedJob.matchedSkills || []).join(', ') || 'None'}
- Missing Skills: ${(matchedJob.missingSkills || []).join(', ') || 'None'}
- Skill Evidence Level: ${matchedJob.skillEvidence?.level || 'unknown'} (Source: ${matchedJob.skillEvidence?.source || 'unknown'})
- Reasons noted: ${(matchedJob.reasons || []).join(' | ')}

Please explain:
1. Why this match score was assigned based on the breakdown.
2. The specific skills that helped the match and the verified gaps.
3. Pragmatic next steps for the candidate to improve their candidacy.
`;

    const response = await generateWithRetry({
      model: getModel(),
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: CAREER_GUIDANCE_SYSTEM_PROMPT,
        temperature: 0.2,
      },
    });

    const aiText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    return aiText || fallbackText;
  } catch (error) {
    console.warn(`[careerGuidance.agent] AI explanation failed (${error.message}). Returning grounded fallback.`);
    return fallbackText;
  }
}

/**
 * Analyze verified skill gaps across recommended jobs and provide learning paths.
 *
 * @param {object} params
 * @param {object} params.candidateProfile
 * @param {Array<object>} params.recommendedJobs
 * @param {string} [params.targetRole]
 * @returns {Promise<string>}
 */
async function explainSkillGaps({ candidateProfile, recommendedJobs = [], targetRole = '' }) {
  // Aggregate verified missing skills across recommended jobs
  const missingFreq = {};
  for (const job of recommendedJobs) {
    if (Array.isArray(job.missingSkills)) {
      for (const skill of job.missingSkills) {
        missingFreq[skill] = (missingFreq[skill] || 0) + 1;
      }
    }
  }

  const sortedGaps = Object.entries(missingFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([skill, count]) => `${skill} (requested in ${count} target roles)`);

  const fallbackText = [
    `### Verified Skill Gap Analysis for ${targetRole || candidateProfile?.designation || 'Your Profile'}`,
    '',
    sortedGaps.length
      ? `Based on evaluation of ${recommendedJobs.length} recommended positions, the most frequent missing requirements are:\n` +
        sortedGaps.map((g) => `- ${g}`).join('\n')
      : 'No verified skill gaps found across the evaluated target jobs!',
    '',
    '**Recommended Learning Actions:**',
    sortedGaps.length
      ? `- Focus on foundational coursework or hands-on projects in **${Object.keys(missingFreq).slice(0, 3).join(', ')}**.\n- Update your portfolio/resume once you complete practical assignments demonstrating these skills.`
      : '- Your current skill set aligns well with the roles reviewed.',
  ].join('\n');

  try {
    const prompt = `
Analyze the verified skill gaps for this candidate and suggest realistic learning recommendations:

Candidate Profile:
- Title: ${candidateProfile?.designation || 'Not specified'}
- Current Skills: ${(candidateProfile?.skills || []).join(', ') || 'Not specified'}
- Target Role / Focus: ${targetRole || candidateProfile?.designation || 'General advancement'}

Evaluated Target Roles (${recommendedJobs.length}):
${recommendedJobs.slice(0, 5).map((j) => `- ${j.title} (Match: ${j.matchScore}%, Missing: ${(j.missingSkills || []).join(', ') || 'None'})`).join('\n')}

Aggregated Missing Skills:
${sortedGaps.join('\n') || 'None'}

Please provide:
1. Summary of high-impact skills to prioritize.
2. 2-3 specific project or study ideas to bridge these gaps.
3. How to showcase these competencies to employers in this domain.
`;

    const response = await generateWithRetry({
      model: getModel(),
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: CAREER_GUIDANCE_SYSTEM_PROMPT,
        temperature: 0.2,
      },
    });

    const aiText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    return aiText || fallbackText;
  } catch (error) {
    console.warn(`[careerGuidance.agent] AI skill gap analysis failed (${error.message}). Returning grounded fallback.`);
    return fallbackText;
  }
}

/**
 * Generate interview preparation guidance based on actual job requirements.
 *
 * @param {object} params
 * @param {object} params.candidateProfile
 * @param {object} params.targetJob
 * @returns {Promise<string>}
 */
async function generateInterviewPrep({ candidateProfile, targetJob }) {
  if (!targetJob) {
    throw new Error('A target job is required for interview preparation.');
  }

  const fallbackText = [
    `### Interview Preparation: ${targetJob.title} at ${targetJob.company || 'Target Company'}`,
    '',
    '**Key Competencies to Emphasize:**',
    `- ${(targetJob.matchedSkills || []).slice(0, 4).join(', ') || 'Core domain experience'}`,
    '',
    '**Potential Questions to Prepare For:**',
    '1. Describe a complex project where you applied your primary expertise.',
    '2. How do you handle cross-functional collaboration and tight deadlines?',
    targetJob.missingSkills?.length
      ? `3. How would you approach tasks involving ${targetJob.missingSkills.slice(0, 2).join(' and ')}? (Address this gap proactively with your learning strategy).`
      : '3. What unique perspective do you bring to this team?',
  ].join('\n');

  try {
    const prompt = `
Create an interview preparation guide for this candidate applying to the specific role below:

Candidate Profile:
- Title: ${candidateProfile?.designation || 'Not specified'}
- Skills: ${(candidateProfile?.skills || []).join(', ') || 'Not specified'}
- Experience Count: ${candidateProfile?.experience?.length || 0} roles

Target Role:
- Title: ${targetJob.title}
- Company: ${targetJob.company || 'Not specified'}
- Matched Skills: ${(targetJob.matchedSkills || []).join(', ') || 'None'}
- Missing Skills: ${(targetJob.missingSkills || []).join(', ') || 'None'}
- Job Description Excerpt: ${String(targetJob.description || '').slice(0, 600)}

Provide:
1. 3 domain-specific technical or functional interview questions based on the job's actual requirements.
2. 2 behavioral/situational questions relevant to this seniority level.
3. Advice on how to address any missing skills honestly and positively if asked.
`;

    const response = await generateWithRetry({
      model: getModel(),
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: CAREER_GUIDANCE_SYSTEM_PROMPT,
        temperature: 0.3,
      },
    });

    const aiText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    return aiText || fallbackText;
  } catch (error) {
    console.warn(`[careerGuidance.agent] AI interview prep failed (${error.message}). Returning grounded fallback.`);
    return fallbackText;
  }
}

/**
 * General career guidance answering user questions grounded in profile & job data.
 *
 * @param {object} params
 * @param {object} params.candidateProfile
 * @param {string} params.query
 * @param {Array<object>} [params.matchedJobs]
 * @returns {Promise<string>}
 */
async function provideGeneralGuidance({ candidateProfile, query, matchedJobs = [] }) {
  const prompt = `
Candidate Query: "${query}"

Candidate Profile:
- Designation: ${candidateProfile?.designation || 'Not specified'}
- Skills: ${(candidateProfile?.skills || []).join(', ') || 'Not specified'}
- Experience: ${candidateProfile?.experience?.map((e) => e.role).join(', ') || 'Not specified'}

Available Matched Job Context (${matchedJobs.length} jobs):
${matchedJobs.slice(0, 3).map((j) => `- ${j.title} at ${j.company || 'N/A'} (Score: ${j.matchScore}%)`).join('\n') || 'None'}

Please answer the candidate's question with grounded, realistic, and domain-appropriate advice.
`;

  try {
    const response = await generateWithRetry({
      model: getModel(),
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: CAREER_GUIDANCE_SYSTEM_PROMPT,
        temperature: 0.3,
      },
    });

    return (
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      'I am here to help you navigate your career path. Please specify your target role or ask about specific skill gaps.'
    );
  } catch (error) {
    console.warn(`[careerGuidance.agent] General guidance AI call failed (${error.message}).`);
    return `Regarding "${query}": Focus on aligning your ${candidateProfile?.designation || 'professional'} competencies with verified market requirements. For best results, review matched positions in your domain and address key missing skills.`;
  }
}

module.exports = {
  explainMatchResults,
  explainSkillGaps,
  generateInterviewPrep,
  provideGeneralGuidance,
  buildDeterministicExplanation,
};

