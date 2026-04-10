# Mismah AI

Mismah AI is a full-stack Hebrew document-generation platform for small service businesses. The app helps a professional turn field notes, photos, company branding, and structured report requirements into polished client-ready PDF documents.

The current version focuses on inspection and service workflows such as leak-detection reports, price quotes, and technician visit summaries.

## Why I Built It

I started this project as a practical full-stack product: authentication, onboarding, company profiles, file uploads, MongoDB persistence, and PDF generation.

After building the base myself, I continued developing it with Codex as a way to gain hands-on experience working with AI coding tools, agent-style workflows, and prompt-guided product iteration. I used that process to expand the app beyond a simple prototype: refining UX flows, adding admin controls, improving AI prompt structure, building new document types, and preparing the project for real deployment.

I'm keeping that note here intentionally. Part of what this project demonstrates is not only that I can build a working app, but that I can collaborate effectively with modern AI development tools while still owning the product decisions, architecture, testing, and implementation direction.

## Product Highlights

- Hebrew-first PDF creation with right-to-left document templates.
- AI-assisted report generation from natural field notes.
- Keyword-guided prompt coverage so users can see which required report details were included.
- Company profile setup with logo and business details.
- Upload support for up to five report photos with optional descriptions.
- Multiple document types, including leak detection, price quotes, and technician visit summaries.
- Google login support alongside manually managed client accounts.
- Admin dashboard for reviewing users, generated reports, prompts, PDFs, and monthly document quotas.
- Monthly document limits per account, currently designed around a portfolio/demo SaaS-style flow.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- AI: OpenAI API
- PDF generation: EJS templates rendered through Puppeteer
- Auth: JWT, Google Identity support
- Deployment shape: Docker Compose, with planned AWS EC2 and MongoDB Atlas hosting

## What I Focused On

- Building a complete product flow rather than isolated screens.
- Designing Hebrew RTL PDFs that feel closer to client-facing business documents than raw AI output.
- Connecting frontend keyword guidance with backend prompt generation.
- Adding admin visibility so the project behaves more like a real internal tool.
- Keeping secrets, uploads, and environment-specific files out of the public repository.
- Learning how to use AI coding assistants responsibly: reviewing changes, tightening scope, iterating on UX, and validating with builds.

## Local Development

This repository is public-safe and does not include real environment secrets. To run it locally, create environment files from the examples and provide your own MongoDB, OpenAI, JWT, and optional Google/SMTP values.

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

The local app runs at:

```txt
http://localhost
```

## Project Status

This is an active portfolio project. The next planned step is deployment to `mismah.co.il` using AWS for hosting and MongoDB Atlas for the production database.

Future improvements I would like to explore:

- S3-based upload storage.
- CI/CD deployment flow.
- More robust report history and PDF preview tooling.
- Additional business document templates.
- Stronger observability and production monitoring.
