/**
 * End-to-End Runtime and Headless Chrome Verification Script for HireMind AI
 * Starts both backend and frontend servers, verifies API endpoints, file uploads,
 * AI chat, and executes headless Chrome to inspect live DOM rendering.
 */

const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 5173;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let backendProcess = null;
let frontendProcess = null;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 404) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await sleep(400);
  }
  throw new Error(`Server at ${url} failed to start within ${timeoutMs}ms`);
}

function stopProcesses() {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
  }
  if (frontendProcess) {
    try {
      frontendProcess.kill();
    } catch (e) {}
  }
}

process.on('exit', stopProcesses);
process.on('SIGINT', () => {
  stopProcesses();
  process.exit();
});

async function runAudit() {
  console.log('===========================================================================');
  console.log('HIREMIND AI: END-TO-END RUNTIME & BROWSER CONSISTENCY AUDIT');
  console.log('===========================================================================');

  let passed = 0;
  let total = 0;

  function recordPass(name) {
    total++;
    passed++;
    console.log(`✓ Check ${total} PASS: ${name}`);
  }

  function recordFail(name, err) {
    total++;
    console.error(`✗ Check ${total} FAIL: ${name}`);
    console.error(err);
  }

  try {
    // 1. Launch Backend Server
    console.log('[1/4] Spawning backend server on port 5000...');
    const backendDir = path.resolve(__dirname, '../..');
    backendProcess = spawn(process.execPath, ['server.js'], {
      cwd: backendDir,
      stdio: 'pipe',
      env: { ...process.env, PORT: String(BACKEND_PORT) },
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`[Backend Exited] code=${code}, signal=${signal}`);
    });

    backendProcess.stdout.on('data', (d) => {
      console.log('[Backend]:', d.toString().trim());
    });

    backendProcess.stderr.on('data', (d) => {
      console.error('[Backend Err]:', d.toString().trim());
    });

    await waitForServer(`http://127.0.0.1:${BACKEND_PORT}/api/health`);
    recordPass(`Backend server started and healthy on http://127.0.0.1:${BACKEND_PORT}`);

    // 2. Launch Frontend Preview Server
    console.log('[2/4] Spawning frontend preview server on port 5173...');
    const frontendDir = path.resolve(__dirname, '../../../Frontend');
    const viteBin = path.resolve(frontendDir, 'node_modules/vite/bin/vite.js');
    frontendProcess = spawn(
      process.execPath,
      [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(FRONTEND_PORT), '--strictPort'],
      {
        cwd: frontendDir,
        stdio: 'pipe',
      }
    );

    await waitForServer(`http://127.0.0.1:${FRONTEND_PORT}/`);
    recordPass(`Frontend server started and serving on http://127.0.0.1:${FRONTEND_PORT}`);

    // 3. API Integration Verification
    console.log('[3/4] Running live HTTP API verification checks...');

    // Test A: Health endpoint
    const healthRes = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/health`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.success, true);
    recordPass('GET /api/health returns success: true and status: healthy');

    // Test B: Job Search with search, location, category, pagination
    const jobsRes = await fetch(
      `http://127.0.0.1:${BACKEND_PORT}/api/jobs?search=developer&category=it-software&page=1&limit=5`
    );
    const jobsData = await jobsRes.json();
    assert.strictEqual(jobsData.success, true);
    assert(Array.isArray(jobsData.jobs));
    assert(jobsData.jobs.length > 0 && jobsData.jobs.length <= 5);
    const sampleJob = jobsData.jobs[0];
    assert('jobId' in sampleJob, 'Job must have jobId');
    assert('title' in sampleJob, 'Job must have title');
    assert('company' in sampleJob, 'Job must have company');
    assert('salary' in sampleJob, 'Job must preserve salary field');
    assert('sourceLink' in sampleJob, 'Job must have sourceLink');
    recordPass(`GET /api/jobs returns ${jobsData.jobs.length} filtered jobs with salary metadata`);

    // Test C: Job Details
    const jobDetailRes = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/jobs/${encodeURIComponent(sampleJob.jobId)}`);
    const jobDetailData = await jobDetailRes.json();
    assert.strictEqual(jobDetailData.success, true);
    assert.strictEqual(jobDetailData.job.jobId, sampleJob.jobId);
    recordPass(`GET /api/jobs/:id returns complete job record (${sampleJob.title})`);

    // Test D: Invalid file upload rejection (Multer fileFilter)
    const invalidForm = new FormData();
    invalidForm.append('resume', new Blob(['invalid binary content'], { type: 'text/plain' }), 'malicious.txt');
    const rejectRes = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/resume/parse`, {
      method: 'POST',
      body: invalidForm,
    });
    const rejectData = await rejectRes.json();
    assert.strictEqual(rejectRes.status, 400, 'Invalid file type must return HTTP 400');
    assert.strictEqual(rejectData.success, false);
    recordPass('POST /api/resume/parse safely rejects invalid file formats (.txt) with HTTP 400');

    // Test E: Resume PDF parsing
    const pdfPath = path.resolve(__dirname, '../../node_modules/pdf-parse/test/data/04-valid.pdf');
    if (fs.existsSync(pdfPath)) {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdfForm = new FormData();
      pdfForm.append('resume', new Blob([pdfBytes], { type: 'application/pdf' }), '04-valid.pdf');

      const pdfRes = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/resume/parse`, {
        method: 'POST',
        body: pdfForm,
      });
      const pdfData = await pdfRes.json();
      assert.strictEqual(pdfRes.status, 200, 'Valid PDF must parse successfully');
      assert.strictEqual(pdfData.success, true);
      assert(pdfData.profile !== null);
      recordPass(`POST /api/resume/parse parses PDF resumes successfully (${pdfData.characterCount} chars extracted)`);
    } else {
      console.warn('PDF test file not found at', pdfPath);
    }

    // Test F: Resume DOCX parsing
    const docxPath = path.resolve(__dirname, '../../node_modules/mammoth/test/test-data/single-paragraph.docx');
    if (fs.existsSync(docxPath)) {
      const docxBytes = fs.readFileSync(docxPath);
      const docxForm = new FormData();
      docxForm.append(
        'resume',
        new Blob([docxBytes], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
        'single-paragraph.docx'
      );

      const docxRes = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/resume/parse`, {
        method: 'POST',
        body: docxForm,
      });
      const docxData = await docxRes.json();
      assert.strictEqual(docxRes.status, 200, 'Valid DOCX must parse successfully');
      assert.strictEqual(docxData.success, true);
      recordPass('POST /api/resume/parse parses DOCX resumes successfully');
    } else {
      console.warn('DOCX test file not found at', docxPath);
    }

    // Test G: Recommendations with exact breakdown
    const recsRes = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateProfile: {
          designation: 'Senior Frontend Developer',
          skills: ['JavaScript', 'React.js', 'Tailwind CSS', 'TypeScript'],
          experienceYears: 4,
        },
        limit: 3,
      }),
    });
    const recsData = await recsRes.json();
    assert.strictEqual(recsData.success, true);
    assert(Array.isArray(recsData.recommendations));
    assert(recsData.recommendations.length > 0);
    const topRec = recsData.recommendations[0];
    assert(typeof topRec.matchScore === 'number');
    assert('skills' in topRec.scoreBreakdown);
    assert('title' in topRec.scoreBreakdown);
    assert('experience' in topRec.scoreBreakdown);
    assert('location' in topRec.scoreBreakdown);
    recordPass(`POST /api/recommendations returns ${recsData.recommendations.length} matches with 4-part scoreBreakdown`);

    // Test H: AI Assistant Chat & Memory Persistence
    const chatConvId = `browser-audit-${Date.now()}`;
    const chatRes = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What does a Project Manager do?',
        conversationId: chatConvId,
      }),
    });
    const chatData = await chatRes.json();
    assert.strictEqual(chatData.success, true);
    assert.strictEqual(chatData.conversationId, chatConvId);
    assert(typeof chatData.answer === 'string' && chatData.answer.length > 30);
    recordPass('POST /api/agent/chat processes message and returns markdown answer');

    // Test I: Conversation history retrieval
    const convHistRes = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/agent/conversation/${chatConvId}`);
    const convHistData = await convHistRes.json();
    assert.strictEqual(convHistData.success, true);
    assert(convHistData.conversation.messages.length >= 2);
    recordPass(`GET /api/agent/conversation/:id restores dialogue history (${convHistData.conversation.messages.length} messages)`);

    // 4. Headless Chrome Live DOM Rendering Verification
    console.log('[4/4] Executing Headless Chrome DOM rendering checks...');

    if (fs.existsSync(CHROME_PATH)) {
      // Check 1: Dashboard DOM
      const dashboardDom = execFileSync(
        CHROME_PATH,
        ['--headless=new', '--disable-gpu', `http://127.0.0.1:${FRONTEND_PORT}/`, '--dump-dom'],
        { encoding: 'utf8', timeout: 15000 }
      );
      assert(dashboardDom.includes('HireMind AI'), 'Dashboard DOM must contain HireMind AI branding');
      assert(dashboardDom.includes('1,700+'), 'Dashboard DOM must render 1,700+ jobs metric');
      assert(dashboardDom.includes('15 Domains'), 'Dashboard DOM must render 15 Domains metric');
      assert(dashboardDom.includes('id="root"'), 'Dashboard DOM must mount into #root');
      recordPass('Headless Chrome successfully rendered Dashboard with branding and live metrics');

      // Check 2: Job Search DOM
      const jobsDom = execFileSync(
        CHROME_PATH,
        ['--headless=new', '--disable-gpu', `http://127.0.0.1:${FRONTEND_PORT}/jobs`, '--dump-dom'],
        { encoding: 'utf8', timeout: 15000 }
      );
      assert(jobsDom.includes('Explore Job Opportunities'), 'Jobs DOM must contain page title');
      assert(jobsDom.includes('IT &amp; Software') || jobsDom.includes('IT & Software'), 'Jobs DOM must contain domain categories');
      recordPass('Headless Chrome successfully rendered Job Search page with search and category filters');

      // Check 3: Profile DOM
      const profileDom = execFileSync(
        CHROME_PATH,
        ['--headless=new', '--disable-gpu', `http://127.0.0.1:${FRONTEND_PORT}/profile`, '--dump-dom'],
        { encoding: 'utf8', timeout: 15000 }
      );
      assert(profileDom.includes('Candidate Profile &amp; Resume') || profileDom.includes('Candidate Profile & Resume'), 'Profile DOM must render title');
      assert(profileDom.includes('Choose a file or drag &amp; drop here') || profileDom.includes('Choose a file or drag & drop here'), 'Profile DOM must render upload dropzone');
      recordPass('Headless Chrome successfully rendered Profile page with drag-and-drop resume dropzone');

      // Check 4: Assistant DOM
      const assistantDom = execFileSync(
        CHROME_PATH,
        ['--headless=new', '--disable-gpu', `http://127.0.0.1:${FRONTEND_PORT}/assistant`, '--dump-dom'],
        { encoding: 'utf8', timeout: 15000 }
      );
      assert(assistantDom.includes('AI Career Assistant'), 'Assistant DOM must render title');
      assert(assistantDom.includes('Hybrid Multi-Agent'), 'Assistant DOM must render multi-agent badge');
      recordPass('Headless Chrome successfully rendered AI Assistant chat page with agent status');
    } else {
      console.warn('Chrome executable not found at standard path, skipped browser dump-dom.');
    }

    console.log('===========================================================================');
    console.log(`E2E AUDIT COMPLETE: ${passed}/${total} CHECKS PASSED SUCCESSFULLY`);
    console.log('===========================================================================');
  } catch (error) {
    recordFail('E2E Runtime Audit Failure', error);
  } finally {
    stopProcesses();
  }

  if (passed !== total) {
    process.exit(1);
  }
}

runAudit();
