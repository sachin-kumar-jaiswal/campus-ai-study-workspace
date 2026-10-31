# CampusAI — Your university study workspace

> "A quieter place for focused study."

CampusAI is a full-stack study workspace for organizing course documents, asking AI about your material, practicing with saved quizzes, and keeping a personal study plan.

---

## Features

- Email and password registration, login, account profile editing, password changes, and email-based password resets
- Private PDF library with text extraction, search, summaries, and document questions
- AI tutor conversations, with optional links to a study document
- Saved multiple-choice quizzes generated from a topic or an uploaded document
- Personal study planner with session dates, estimated duration, priority, and completion tracking
- Analytics based on real completed sessions and saved quiz attempts
- Light and dark themes with a warm cream, chocolate, and burnt-orange visual system
- PDF files persisted in MongoDB GridFS, including on hosts with ephemeral local filesystems

---

## Tech Stack

### Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS
- React Router v7
- Axios
- Lucide React

### Backend
- Node.js + Express.js
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs
- Helmet, CORS, express-rate-limit

### Infrastructure
- MongoDB Atlas (database)
- OpenAI API (backend-only; required for AI tutor, summaries, document Q&A, and quiz generation)
- Resend (backend-only; sends password reset links)
- Render blueprint for a single full-stack web service

---

## Architecture

```
Browser
   │
   ▼
React Frontend (Vite)
   │ HTTPS
   ▼
Express REST API
   │
   ├──▶ MongoDB Atlas
   │
   └──▶ OpenAI API (when configured)
```

**Security principle:** The OpenAI API key NEVER leaves the backend. All AI requests are proxied through the Express server.

---

## Folder Structure

```
campus-ai/
├── client/                    # React frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/            # Reusable design system components
│   │   │   ├── layout/
│   │   │   ├── auth/
│   │   │   └── dashboard/
│   │   ├── pages/
│   │   │   ├── landing/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── ai-tutor/
│   │   │   ├── documents/
│   │   │   ├── quizzes/
│   │   │   ├── planner/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── lib/
│   │   ├── types/
│   │   └── routes/
│   ├── .env.example
│   └── package.json
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js 22.12+ (Vite 8 requirement)
- npm 9+
- MongoDB Atlas account (free tier works) or local MongoDB

### 1. Clone the repository

```bash
git clone <repo-url>
cd campus-ai
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/campusai
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=         # Required for AI-powered features; never put this in the frontend
OPENAI_MODEL=gpt-4o-mini
# OPENAI_BASE_URL=      # Optional OpenAI-compatible provider endpoint
RESEND_API_KEY=         # Required for password reset emails
EMAIL_FROM=CampusAI <no-reply@your-verified-domain.com>
MAX_FILE_SIZE_MB=20
```

### Frontend (`client/.env.local`)

```env
VITE_API_URL=http://localhost:5000/api
```

**Never commit `.env` files. Use `.env.example` as a template.**

---

## MongoDB Setup

1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist your IP (or use `0.0.0.0/0` for development)
4. Copy the connection string into `MONGODB_URI`

---

## API Overview

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new student |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/forgot-password` | Email a one-time password reset link |
| POST | `/api/auth/reset-password` | Set a new password with a valid reset token |
| GET | `/api/auth/me` | Get current user (protected) |
| PATCH | `/api/auth/me` | Update the display name (protected) |
| PATCH | `/api/auth/me/password` | Change the password (protected) |
| POST | `/api/auth/logout` | Logout |

### Study workspace

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/documents` | List or upload private PDFs |
| GET | `/api/documents/:id/file` | Stream a document owned by the signed-in user |
| GET/POST | `/api/quizzes` | List saved quizzes or generate a new quiz |
| GET/POST/DELETE | `/api/quizzes/:id` | View or delete an owned quiz |
| POST | `/api/quizzes/:id/submit` | Score and save a quiz attempt |
| GET/POST | `/api/planner` | List or create study sessions |
| PATCH/DELETE | `/api/planner/:id` | Update or remove an owned session |
| GET | `/api/analytics` | Aggregate the signed-in user's study activity |
| GET | `/api/health` | Service health check |

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

---

## Development Commands

```bash
# Backend (from server/)
npm run dev        # Development with hot reload
npm run build      # Compile TypeScript
npm start          # Run compiled production build

# Frontend (from client/)
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

---

## Deploy on Render

The root [render.yaml](./render.yaml) describes one service that builds and serves both the API and React application. This keeps the app and API on the same origin and avoids separate frontend/backend host configuration.

1. Push this repository to your GitHub account.
2. In Render, choose **New → Blueprint** and select the repository.
3. Before deploying, create a MongoDB Atlas database and a database user. Set the Atlas network access list to allow Render's outbound connections; Render's free service does not provide fixed outbound IPs. Use a dedicated database user and never put its URI in source control.
4. Enter the Atlas connection string for `MONGODB_URI` in Render's private environment settings. Render generates `JWT_SECRET` from the blueprint.
5. Add a funded `OPENAI_API_KEY` in Render's private environment settings to enable the AI tutor, document summaries, document Q&A, and quiz generation. Use `gpt-4o-mini` or another supported model in `OPENAI_MODEL`. If using an OpenAI-compatible provider instead, set its endpoint in `OPENAI_BASE_URL` and its model in `OPENAI_MODEL`. The key stays on the server; AI features return a clear configuration error until it is set.
6. To enable password resets, add `RESEND_API_KEY` and a verified sender in `EMAIL_FROM` in Render's private environment settings. Create a Resend account and verify the sending domain first. `CLIENT_URL` should be the public app URL; if omitted on Render, the service uses its `RENDER_EXTERNAL_URL`.
7. Wait for the deployment to pass its `/api/health` check. Render shows the public application URL in the service dashboard.

The blueprint uses Render's free web-service plan. Free web services can sleep when idle and take longer to answer the first request after waking. Uploaded PDF files and application data are stored in MongoDB; they do not depend on a host's temporary filesystem.

The local development API still runs separately on port 5000. In production, Express also serves the built client and supports direct navigation to frontend routes.

The uploaded PDF binary data uses the `campusFiles` GridFS bucket in the configured MongoDB database. MongoDB database users therefore need read/write access to the application database, including this bucket's file and chunk collections.

```
[Render web service]
       ├── React single-page application
       ├── Express API
       ├── MongoDB Atlas + GridFS document storage
       ├── OpenAI API (required for AI features; backend-only)
       └── Resend API (required for password-reset email; backend-only)
```

## Validation commands

```bash
# Run separately from client/ and server/
npm run lint
npm run build
npm audit

# With server/.env configured and the API running on localhost:5000:
cd server
npm run test:smoke
```

---

## Security Notes

- Passwords are hashed with bcryptjs (salt rounds: 12)
- JWT tokens expire in 7 days
- API keys and secrets are never exposed to the frontend
- CORS allows the configured `CLIENT_URL` and Render's service URL
- Rate limiting is applied to auth endpoints
- HTTP security headers via Helmet
- No secrets in source control

---

*A full-stack study workspace, built for practical everyday use.*
