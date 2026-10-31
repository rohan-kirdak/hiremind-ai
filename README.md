# HireMind AI — Intelligent Multi-Domain Career Platform

HireMind AI is a full-stack, AI-powered career intelligence platform designed to eliminate the opacity of automated job application processes. Built on a hybrid multi-agent architecture and deterministic matching engine (V4.1), HireMind AI bridges candidates and job opportunities across **15 professional domains**—including IT, Finance, Marketing, Sales, Human Resources, Customer Support, Design, Operations, and Healthcare.

Unlike opaque black-box AI platforms, HireMind AI pairs deterministic ranking algorithms with specialist LLM agents to deliver 100% transparent score breakdowns, verified skill gap guidance, and tailored interview preparation.

---

## Architecture Overview

HireMind AI uses a **hybrid multi-agent architecture**: specialist AI agents handle unstructured reasoning (resume understanding, conversational context, interview coaching), while high-precision deterministic JavaScript services handle dataset search, skill normalization, and score calculation.

```
+-----------------------------------------------------------------------------------+
|                                 REACT FRONTEND                                    |
|   (Dashboard • Job Search • My Profile & Resume • Match Analysis • AI Assistant)  |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS / REST APIs
                                         v
+-----------------------------------------------------------------------------------+
|                               EXPRESS.JS BACKEND                                  |
|   (Configurable CORS • Sliding-Window Rate Limiting • Dual PDF/DOCX Validation)   |
+-----------------------------------------------------------------------------------+
       |                                      |                          |
       v                                      v                          v
+------------------------+  +-------------------------------+  +---------------------+
|      ORCHESTRATOR      |  |         RESUME AGENT          |  |   CAREER GUIDANCE   |
|         AGENT          |  | (Mammoth / pdf-parse + Gemini)|  |        AGENT        |
|  - Intent Detection    |  |  - Profile Extraction         |  |  - Match Breakdown  |
|  - Agent Delegation    |  |  - Domain Classification      |  |  - Skill Gap Advice |
|  - Context Persistence |  |  - Skill Normalization        |  |  - Interview Prep   |
+------------------------+  +-------------------------------+  +---------------------+
       |                                      |                          |
       +--------------------------------------+--------------------------+
                                              |
                                              v
+-----------------------------------------------------------------------------------+
|                          DETERMINISTIC BACKEND SERVICES                           |
|  - Matching Engine V4.1: Skills (50%), Title (25%), Exp (15%), Location (10%)    |
|  - In-Memory Dataset Cache: 1,700+ enriched jobs across 15 canonical domains      |
|  - Centralized Skill & Role Taxonomy Catalog                                      |
|  - File-Backed Conversation Persistence (data/conversations.json)                |
+-----------------------------------------------------------------------------------+
```

---

## The Three AI Agents

All AI agents use a shared Gemini client (`@google/genai`) with automatic bounded exponential backoff and grounded fallback dispatching when quota limits are met:

### 1. Orchestrator Agent (`orchestrator.agent.js`)
- **Intent Recognition:** Analyzes user prompts to identify intents (general career question, resume review, job search, match explanation, skill gap analysis, or interview prep).
- **Specialist Delegation & Handoffs:** Invokes internal tool calls or specialist agents with structured parameters.
- **Context Synthesis:** Unifies results from deterministic engines and specialist agents into cohesive, actionable responses with preserved conversation memory.

### 2. Resume Agent (`resume.agent.js`)
- **Dual-Engine Text Extraction:** Extracts raw text from uploaded `.pdf` and `.docx` binary files via `pdf-parse` and `mammoth`.
- **Structured Profile Extraction:** Identifies candidate designation, normalized skills, professional domain, experience years, education, and certifications.
- **Deterministic Taxonomy Fallback:** Matches candidate credentials against the canonical catalog even if external LLM APIs are unreachable.

### 3. Career Guidance Agent (`careerGuidance.agent.js`)
- **Match Breakdown Explanations:** Deconstructs deterministic scores and explains why specific jobs ranked high or low.
- **Verified Skill Gap Roadmaps:** Identifies genuine missing competencies across target roles and recommends concrete learning milestones.
- **Job-Tailored Interview Coaching:** Formulates behavioral and technical interview questions mapped directly to real job requirements.

---

## Tech Stack

### Frontend
- **Framework:** React 18.3.1 (Vite 6.0.1)
- **Styling:** Tailwind CSS 3.4.16 (Custom SaaS Slate & Brand Indigo palette)
- **Routing:** React Router DOM 6.28.0
- **HTTP Client:** Axios 1.7.9 (Centralized baseURL, interceptors, timeout management)
- **Icons:** Lucide React
- **Markdown:** Native zero-dependency safe Markdown renderer

### Backend
- **Runtime:** Node.js (v20+ LTS / v24)
- **Web Server:** Express.js 5.3.0
- **AI SDK:** Google Gen AI SDK (`@google/genai`)
- **File Parsing:** `multer` (in-memory 5MB limit with strict MIME validation), `pdf-parse`, `mammoth`
- **Security:** Configurable CORS allowlist, sliding-window rate limiting, production error sanitization
- **Dataset:** In-memory cached dataset of 1,700+ enriched multi-domain job listings

---

## Repository Structure

```
HireMind AI/
├── Backend/
│   ├── data/
│   │   ├── jobs.json                   # 1,700+ enriched multi-domain job records
│   │   └── conversations.json          # Persistent conversation storage
│   ├── src/
│   │   ├── agents/
│   │   │   ├── orchestrator.agent.js   # Master routing & coordination agent
│   │   │   ├── resume.agent.js         # Resume parser & profile extractor
│   │   │   └── careerGuidance.agent.js # Match explanations & career coaching
│   │   ├── middlewares/
│   │   │   └── rateLimiter.js          # In-memory sliding-window rate limiter
│   │   ├── routes/
│   │   │   ├── agent.routes.js         # /api/agent/chat & conversation management
│   │   │   ├── jobs.routes.js          # /api/jobs & /api/jobs/:id
│   │   │   ├── recommendations.routes.js # /api/recommendations
│   │   │   └── resume.routes.js        # /api/resume/parse
│   │   ├── services/
│   │   │   ├── conversation.service.js # History & profile memory persistence
│   │   │   ├── gemini.client.js        # Centralized resilient Gemini client
│   │   │   ├── jobData.service.js      # Dataset cache & query filtering
│   │   │   └── jobMatching.service.v4.1.js # Deterministic 4-component scoring engine
│   │   └── utils/
│   │       ├── skillCatalog.js         # Centralized skills taxonomy & alias map
│   │       └── taxonomy.js             # 15 domain categories & canonical roles
│   ├── server.js                       # Express application entry point
│   ├── package.json
│   └── .env.example
├── Frontend/
│   ├── src/
│   │   ├── api/                        # Centralized Axios client & modular APIs
│   │   ├── components/
│   │   │   ├── common/                 # Button, Badge, Card, Spinner, EmptyState
│   │   │   ├── jobs/                   # JobCard, JobDetailsModal
│   │   │   └── layout/                 # Navbar, Sidebar, Footer, Layout
│   │   ├── context/
│   │   │   └── ProfileContext.jsx      # Global candidate profile state & storage
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx       # Overview, readiness banner, top matches
│   │   │   ├── JobSearchPage.jsx       # Real-time search, 15 domain filters, pagination
│   │   │   ├── ProfilePage.jsx         # PDF/DOCX drag-and-drop resume parser
│   │   │   ├── AssistantPage.jsx       # Multi-agent chat with history restoration
│   │   │   └── MatchAnalysisPage.jsx   # Deep-dive 4-component match breakdown
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── job-data-collector/                 # Autonomous web scraper & dataset enrichment
└── README.md
```

---

## Local Installation & Setup

### Prerequisites
- Node.js (v20 LTS or higher recommended)
- npm (v10 or higher)
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/rohan-kirdak/hiremind-ai.git
cd hiremind-ai
```

### 2. Configure Backend
```bash
cd Backend
npm install
cp .env.example .env
```
Edit `Backend/.env` with your credentials:
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
CORS_ORIGIN=http://localhost:5173
```

### 3. Configure Frontend
```bash
cd ../Frontend
npm install
cp .env.example .env
```
Ensure `Frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Start Development Servers

**Start Backend (Terminal 1):**
```bash
cd Backend
npm start
# Server starts on http://localhost:5000
```

**Start Frontend (Terminal 2):**
```bash
cd Frontend
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Environment Variables Reference

### Backend (`Backend/.env`)
| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port for Express server |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-3.5-flash` | Gemini model name |
| `CORS_ORIGIN` | No | `*` (dev) | Comma-separated list of allowed production origins |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Sliding window duration in milliseconds (15 min) |
| `RATE_LIMIT_CHAT_MAX` | No | `25` | Maximum chat requests per client IP per window |
| `RATE_LIMIT_UPLOAD_MAX` | No | `15` | Maximum resume uploads per client IP per window |

### Frontend (`Frontend/.env`)
| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `http://localhost:5000/api` | Target backend REST API endpoint |

---

## API Documentation

### 1. Health Check
- **`GET /api/health`**
- **Response `200`:** `{ "success": true, "status": "healthy" }`

### 2. Job Search & Filtering
- **`GET /api/jobs?search={keyword}&category={domain}&location={loc}&page={n}&limit={m}`**
- **Query Params:**
  - `search`: Filter across title, company, description, and skills
  - `category`: Domain category ID (e.g. `it-software`, `finance`, `marketing`, `hr`, `design`, `operations`)
  - `location`: Location keyword (e.g. `Remote`, `United States`)
  - `page`: Page index (default: 1)
  - `limit`: Page size (default: 20, max: 100)
- **Response `200`:** `{ "success": true, "total": 1700, "page": 1, "limit": 20, "jobs": [...] }`

### 3. Job Details
- **`GET /api/jobs/:id`**
- **Response `200`:** `{ "success": true, "job": { "jobId": "...", "title": "...", "salary": {...}, ... } }`

### 4. Deterministic Job Recommendations
- **`POST /api/recommendations`**
- **Request Body:**
  ```json
  {
    "candidateProfile": {
      "designation": "Frontend Developer",
      "skills": ["JavaScript", "React.js", "Tailwind CSS"],
      "experienceYears": 3
    },
    "limit": 5,
    "category": "it-software"
  }
  ```
- **Response `200`:**
  ```json
  {
    "success": true,
    "totalJobsConsidered": 1700,
    "totalRecommendations": 5,
    "recommendations": [
      {
        "jobId": "...",
        "title": "...",
        "matchScore": 86,
        "scoreBreakdown": { "skills": 100, "title": 85, "experience": 100, "location": 100 },
        "matchedSkills": ["JavaScript", "React.js"],
        "missingSkills": ["TypeScript"],
        "salary": { "min": 90000, "max": 120000, "currency": "$", "period": "year" },
        "sourceLink": "https://...",
        "applicationUrl": "https://..."
      }
    ]
  }
  ```

### 5. Resume Upload & Parsing
- **`POST /api/resume/parse`**
- **Content-Type:** `multipart/form-data`
- **Payload:** Field `resume` (PDF or DOCX file, $\le$ 5MB). Optional: `conversationId`.
- **Response `200`:** `{ "success": true, "profile": { "designation": "...", "skills": [...] }, "domain": {...} }`
- **Response `400`:** Disallowed file extension/MIME (`INVALID_FILE_TYPE`).
- **Response `413`:** File size exceeds 5MB limit.

### 6. AI Career Assistant Chat
- **`POST /api/agent/chat`**
- **Request Body:**
  ```json
  {
    "message": "What are my verified skill gaps for full stack roles?",
    "conversationId": "uuid-v4-string",
    "candidateProfile": { "skills": [...] }
  }
  ```
- **Response `200`:** `{ "success": true, "answer": "### Markdown formatted answer...", "conversationId": "..." }`

### 7. Conversation History & Management
- **`GET /api/agent/conversation/:id`**: Returns stored dialogue history and profile.
- **`DELETE /api/agent/conversation/:id`**: Clears dialogue history.

---

## Test Verification Suite

All core functionality is accompanied by automated test suites. Run them from the project root:

```powershell
# 1. Deterministic Matching Engine Unit Tests (33 assertions)
node Backend/src/services/test-job-matching-v4.1.js

# 2. Multi-Domain Taxonomy & Profile Matching Suite (7 diverse roles)
node Backend/src/services/test-multidomain-matching.js

# 3. Multi-Agent Coordination Scenarios (7 scenarios)
$env:NODE_PATH="Backend/node_modules"; node Backend/src/services/test-multiagent-architecture.js

# 4. Backend Fixes & Error Handling Suite (8 assertions)
$env:NODE_PATH="Backend/node_modules"; node Backend/src/services/test-backend-fixes.js

# 5. Frontend - Backend REST Integration Contract Suite (7 contracts)
$env:NODE_PATH="Backend/node_modules"; node Backend/src/services/test-frontend-integration.js

# 6. Live E2E Runtime & Headless Chrome DOM Suite (15 checks)
$env:NODE_PATH="Backend/node_modules"; node Backend/src/services/test-e2e-runtime.js
```

---

## Production Deployment Guide

### Recommended Architecture
- **Frontend:** Hosted on **Vercel** or **Netlify** (Global Edge CDN, instant previews, zero maintenance).
- **Backend:** Hosted on **Render** (Web Service) or **Railway** (Continuous Node.js process, persistent IPv4 DNS, 512MB+ RAM).

### 1. Deploying the Backend on Render
1. Push your code to GitHub.
2. Sign in to [Render](https://render.com/) and create a new **Web Service**.
3. Connect your repository.
4. Configure settings:
   - **Root Directory:** `Backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Under **Environment Variables**, add:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `GEMINI_API_KEY=your_actual_key`
   - `GEMINI_MODEL=gemini-3.5-flash`
   - `CORS_ORIGIN=https://your-frontend.vercel.app`
6. Click **Deploy Web Service**. Note your deployed URL (e.g., `https://hiremind-backend.onrender.com`).

### 2. Deploying the Frontend on Vercel
1. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import your GitHub repository.
3. Configure settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL=https://hiremind-backend.onrender.com/api`
5. Click **Deploy**.

---

## Architectural Considerations & Limitations

1. **Conversation Persistence Storage:**
   - Conversations are persisted to a local JSON file (`Backend/data/conversations.json`).
   - This functions reliably on single-instance container deployments (e.g. Render Web Service with a disk volume).
   - If migrating to a multi-instance horizontal cluster or serverless functions (AWS Lambda/Vercel serverless), this storage should be migrated to an external database (e.g. MongoDB, Redis, or PostgreSQL).
2. **Conversation Access Model:**
   - Conversation sessions are addressed by an unguessable UUIDv4. In the absence of user authentication, any client holding the UUID can retrieve dialogue history. For multi-tenant enterprise deployments, a user authentication layer (JWT or Session cookies) should be attached.
3. **Gemini Free-Tier Rate Limits:**
   - Google AI Studio free tier limits requests to 20 requests/day per project.
   - HireMind AI implements grounded deterministic fallback parsers for resume extraction and career coaching, ensuring complete system continuity when quota thresholds are reached.

---

## License

This project is licensed under the ISC License.
