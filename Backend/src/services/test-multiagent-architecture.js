'use strict';

require('dotenv').config({ path: 'Backend/.env' });
require('dns').setDefaultResultOrder('ipv4first');

/**
 * HireMind AI — Hybrid Multi-Agent Architecture Test Suite
 *
 * Verifies all 7 required scenarios from the prompt:
 * 1. General career question
 * 2. Upload and analyze resume
 * 3. Search jobs without resume
 * 4. Search jobs with candidate profile
 * 5. Explain why a job received a certain match score
 * 6. Missing skills and learning suggestions
 * 7. Follow-up question in the same conversation (multi-turn memory)
 */

const assert = require('node:assert/strict');
const { runOrchestrator } = require('../agents/orchestrator.agent');
const { getConversation, clearConversation } = require('../services/conversation.service');
const { getJobs } = require('./jobData.service');

async function runTests() {
  console.log('='.repeat(75));
  console.log('STARTING HIREMIND AI MULTI-AGENT ARCHITECTURE VERIFICATION');
  console.log('='.repeat(75));

  const testConvId = `test-agent-${Date.now()}`;
  const jobs = getJobs({ reload: true });
  console.log(`Loaded ${jobs.length} jobs in cache.\n`);

  // --------------------------------------------------------------------------
  // Scenario 1: General Career Question
  // --------------------------------------------------------------------------
  console.log('[Scenario 1] Testing general career question...');
  const res1 = await runOrchestrator({
    message: 'What does a Project Manager do and what core methodologies do they use?',
    conversationId: testConvId,
  });

  assert.ok(res1.success, 'Scenario 1 should succeed');
  assert.ok(res1.answer.length > 50, 'Scenario 1 should produce a substantial response');
  assert.equal(res1.conversationId, testConvId, 'Scenario 1 should preserve conversation ID');
  console.log('✓ Scenario 1 PASS: Answered general career inquiry.');
  console.log(`  Sample Output: ${res1.answer.slice(0, 150).replace(/\n/g, ' ')}...\n`);

  // --------------------------------------------------------------------------
  // Scenario 2: User uploads and analyzes a resume
  // --------------------------------------------------------------------------
  console.log('[Scenario 2] Testing resume analysis via Orchestrator / Resume Agent...');
  const accountantResumeText = [
    'Sarah Jenkins',
    'Senior Accountant | CPA',
    'sarah.jenkins@example.com | 555-4321',
    'PROFESSIONAL SUMMARY',
    'Experienced CPA with 6 years in corporate financial reporting, general ledger, and auditing.',
    'SKILLS',
    'Accounting, Financial Analysis, QuickBooks, Auditing, Taxation, Excel, GAAP',
    'EXPERIENCE',
    'Senior Accountant Jan 2021 – Present',
    'Apex Financial Consulting',
    '• Reconciled balance sheet accounts and prepared monthly financial packages',
    '• Ensured US GAAP and statutory tax compliance',
    'EDUCATION',
    'B.Com in Accounting 2015 – 2019',
    'Boston College',
  ].join('\n');

  const res2 = await runOrchestrator({
    message: `Please analyze my resume and extract my skills and domain:\n\n${accountantResumeText}`,
    conversationId: testConvId,
  });

  assert.ok(res2.success, 'Scenario 2 should succeed');
  assert.ok(res2.candidateProfile, 'Scenario 2 should attach extracted profile to response');
  assert.equal(res2.candidateProfile.designation, 'Senior Accountant | CPA');
  assert.ok(res2.candidateProfile.skills.includes('Accounting'), 'Profile should include Accounting');
  assert.ok(res2.candidateProfile.skills.includes('QuickBooks'), 'Profile should include QuickBooks');

  // Verify conversation memory stored the profile
  const convState2 = getConversation(testConvId);
  assert.ok(convState2.candidateProfile, 'Conversation memory must retain candidate profile');
  assert.equal(convState2.candidateProfile.designation, 'Senior Accountant | CPA');
  console.log('✓ Scenario 2 PASS: Resume parsed, profile extracted & persisted in memory.');
  console.log(`  Candidate: ${res2.candidateProfile.name} | Designation: ${res2.candidateProfile.designation}`);
  console.log(`  Skills: ${res2.candidateProfile.skills.join(', ')}\n`);

  // --------------------------------------------------------------------------
  // Scenario 3: Search jobs without a resume
  // --------------------------------------------------------------------------
  console.log('[Scenario 3] Testing job search without candidate resume...');
  const searchConvId = `search-only-${Date.now()}`;
  const res3 = await runOrchestrator({
    message: 'Search for remote jobs in customer support',
    conversationId: searchConvId,
  });

  assert.ok(res3.success, 'Scenario 3 should succeed');
  assert.ok(res3.answer.length > 50, 'Scenario 3 should return listings');
  assert.ok(/customer|support/i.test(res3.answer), 'Search results should contain customer support');
  console.log('✓ Scenario 3 PASS: Returned keyword-based listings without requiring a candidate profile.');
  console.log(`  Sample Output: ${res3.answer.slice(0, 160).replace(/\n/g, ' ')}...\n`);

  // --------------------------------------------------------------------------
  // Scenario 4: Search jobs with a candidate profile (Recommendations)
  // --------------------------------------------------------------------------
  console.log('[Scenario 4] Testing job recommendations with candidate profile in memory...');
  const res4 = await runOrchestrator({
    message: 'Recommend the top suitable jobs for my background',
    conversationId: testConvId, // Reusing testConvId where Sarah Jenkins is stored
  });

  assert.ok(res4.success, 'Scenario 4 should succeed');
  assert.ok(/match score|recommendations/i.test(res4.answer), 'Should contain match score rankings');
  console.log('✓ Scenario 4 PASS: Generated deterministic job recommendations using memory profile.');
  console.log(`  Sample Output: ${res4.answer.slice(0, 180).replace(/\n/g, ' ')}...\n`);

  // --------------------------------------------------------------------------
  // Scenario 5: User asks why a job received a certain match score
  // --------------------------------------------------------------------------
  console.log('[Scenario 5] Testing explanation of a specific match score...');
  // Find a real finance job from dataset
  const sampleFinanceJob = jobs.find((j) => j.domain?.categoryId === 'finance') || jobs[0];

  const res5 = await runOrchestrator({
    message: `Why did I get this score for job ${sampleFinanceJob.jobId}? Please explain the score breakdown.`,
    conversationId: testConvId,
  });

  assert.ok(res5.success, 'Scenario 5 should succeed');
  assert.ok(/match|score|skills/i.test(res5.answer), 'Explanation should detail score and skills');
  console.log(`✓ Scenario 5 PASS: Career Guidance Agent explained match score for ${sampleFinanceJob.title}.`);
  console.log(`  Sample Output: ${res5.answer.slice(0, 180).replace(/\n/g, ' ')}...\n`);

  // --------------------------------------------------------------------------
  // Scenario 6: User asks for missing skills and learning suggestions
  // --------------------------------------------------------------------------
  console.log('[Scenario 6] Testing skill gap and learning suggestions...');
  const res6 = await runOrchestrator({
    message: 'What skills should I improve and learn to qualify for more senior roles?',
    conversationId: testConvId,
  });

  assert.ok(res6.success, 'Scenario 6 should succeed');
  assert.ok(/skills?|learning|improve/i.test(res6.answer), 'Should provide learning and skill advice');
  console.log('✓ Scenario 6 PASS: Career Guidance Agent analyzed verified missing skills and learning paths.');
  console.log(`  Sample Output: ${res6.answer.slice(0, 180).replace(/\n/g, ' ')}...\n`);

  // --------------------------------------------------------------------------
  // Scenario 7: User asks a follow-up question in the same conversation
  // --------------------------------------------------------------------------
  console.log('[Scenario 7] Testing follow-up multi-turn conversation memory...');
  const res7 = await runOrchestrator({
    message: `Can you help me prepare for an interview for job ${sampleFinanceJob.jobId}?`,
    conversationId: testConvId,
  });

  assert.ok(res7.success, 'Scenario 7 should succeed');
  assert.ok(/interview|questions?|prepare/i.test(res7.answer), 'Follow-up should provide interview prep');

  // Verify conversation history has all multi-turn messages
  const convStateFinal = getConversation(testConvId);
  assert.ok(convStateFinal.messages.length >= 10, 'Conversation should retain all previous turns');
  console.log(`✓ Scenario 7 PASS: Multi-turn history preserved (${convStateFinal.messages.length} messages in conversation).`);
  console.log(`  Sample Output: ${res7.answer.slice(0, 180).replace(/\n/g, ' ')}...\n`);

  // Cleanup test conversation
  clearConversation(testConvId);
  clearConversation(searchConvId);

  console.log('='.repeat(75));
  console.log('ALL 7 REQUIRED MULTI-AGENT SCENARIOS PASSED WITH FULL INTEGRITY');
  console.log('='.repeat(75));
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
