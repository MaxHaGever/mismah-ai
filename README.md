# Mismah AI

Mismah AI is a full-stack web app for creating Hebrew leak-detection PDF reports with AI. It lets a business set its company details and logo, generate polished client-ready documents, and manage customer access through an admin panel.

## What It Does

- creates local and Google-based user accounts
- stores company details and branding
- generates Hebrew leak-detection PDFs with AI
- tracks generated reports per user
- supports admin review of users, prompts, PDFs, and monthly document quotas

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose
- PDF generation: EJS templates + Puppeteer
- AI: OpenAI API
- Deployment: Docker Compose

## Authorship Note

The original base application was built by me.

This repository was then extended together with Codex as a practical learning project focused on:
- working with AI-assisted development
- iterating with agent-style workflows
- improving prompts, UX, and deployment readiness

I keep this note in the repo intentionally because part of the value of the project is showing how I collaborate with AI tools to ship and refine real software, not just to generate isolated snippets.

## Local Development

For local development, copy the backend example env file and fill in real values:

```bash
cp backend/.env.example backend/.env
```

Minimum required values in `backend/.env`:

- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `OPENAI_API_KEY`

Recommended:

- `ADMIN_EMAILS=your@email.com`
- `ALLOWED_ORIGIN=http://localhost`

If you plan to use Google login:

- set `GOOGLE_CLIENT_ID` in `backend/.env`
- set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`

## Run Locally With Docker

From the repo root:

```bash
docker compose up --build
```

Local app URL:

- `http://localhost`

## First-Time Flow

1. Log in with Google or create a user manually as admin.
2. Accept terms.
3. Fill in company details.
4. Upload a logo if needed.
5. Generate a leak-detection PDF from the dashboard.

If your account is admin, you can also open the admin dashboard and:
- invite users
- view prompts and generated PDFs
- see monthly usage
- adjust each user’s monthly document limit

## OpenAI API Key

AI PDF generation requires a valid OpenAI API key in `backend/.env`:

```env
OPENAI_API_KEY=sk-...
```

## Production Deployment

This repository is prepared for a single-domain deployment on AWS EC2 with Docker Compose:

- `https://mismah.co.il` serves the frontend
- `/api` proxies to the backend
- `/uploads` serves generated PDFs and uploaded assets
- MongoDB is intended to run on MongoDB Atlas

For the full deployment flow, see [DEPLOYMENT.md](/Users/maxspector/Desktop/Projects/Graveyard/pdf-ai-fullstack/DEPLOYMENT.md).

## Development Checks

Backend:

```bash
cd backend
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

## Before Publishing This Repo

Before pushing to GitHub:

- make sure real secrets are not committed
- keep `backend/.env` and `frontend/.env` local only
- avoid pushing generated PDFs, logos, or uploads
- rotate any credentials that may have been exposed during development
