# ATS Resume Analyzer (Production-ready Full Stack)

Editorial Dark Brutalism UI, full-stack ATS scoring + AI recommendations, PDF resume generation, and a Telegram bot workflow.

## What’s included
- Backend (Node.js + Express + TypeScript)
  - File parsing: PDF / DOCX / TXT
  - ATS scoring engine (regex + 500+ hardcoded tech keywords)
  - OpenAI GPT-4o analysis + optimized ATS resume generation (JSON)
  - Puppeteer PDF generation (3 templates) + temporary storage cleanup
  - Telegram bot (/start, /help, /analyze, /templates) with session-based analysis
  - Zod-validated API responses and typed schemas
- Frontend (React 18 + Vite + TypeScript)
  - Strict UI per your “Editorial Dark Brutalism” direction (fonts, palette, sharp brutalist borders)
  - Resume upload (react-dropzone + react-pdf page count)
  - Results: animated score, animated progress bars, skills gap analysis, recommendations, resume JSON preview, and PDF downloads

## Local setup

### 1) Environment variables
Create a `.env` file at the project root from `.env.example`:
```bash
cp .env.example .env
```
You must provide:
- `OPENAI_API_KEY`
- `TELEGRAM_BOT_TOKEN` (optional for the bot; API scoring still requires OpenAI)

### 2) Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:3001`.

### 3) Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

### 4) Usage
- Open `/` to see the ATS SCORE landing screen
- Go to `/analyze`
- Upload a resume + job description
- Review `/results`
- Download the optimized resume as PDF (minimal/modern/executive)

## Telegram bot setup
1. Create a bot with **@BotFather**
2. Copy the bot token into `TELEGRAM_BOT_TOKEN` in your `.env`
3. Start the backend (`npm run dev` in `backend`)
4. In Telegram, message your bot:
   - `/start` for instructions
   - Upload your resume PDF/DOCX/TXT
   - Send job description text (or upload a file)
   - Use inline buttons to download generated PDFs or switch templates

Note: v1 uses polling by default. `TELEGRAM_WEBHOOK_URL` is optional unless you deploy with a webhook server.

## API endpoints
- `POST /api/analyze`
  - `multipart/form-data`
  - fields: `resume` (file) + `jobDescription` (text or file)
  - returns full analysis JSON (ATS score + AI suggestions + optimized resume JSON)
- `POST /api/generate-resume`
  - JSON body: `{ "analysisId": "...", "template": "minimal" | "modern" | "executive" }`
  - returns `{ downloadUrl, fileName, fileId }`
- `GET /api/download/:fileId`
  - streams the generated PDF
- `GET /api/health`
  - returns server status (+ Telegram bot username if enabled)

## Deployment (Docker)

### Build and run
From the project root:
```bash
docker compose up --build
```

### Configure secrets
Make sure your environment has:
- `OPENAI_API_KEY`
- `TELEGRAM_BOT_TOKEN` (optional)

Then reload containers:
```bash
docker compose up -d --build
```

### Access
- Frontend: `http://localhost:5173`
- Backend (API): `http://localhost:3001`

## Production notes
- Puppeteer template rendering uses headless Chromium (included via Alpine packages).
- Uploaded files and generated artifacts are automatically cleaned up after the configured cleanup window.
