# VSITR Alumni Portal

A modern, responsive Alumni Portal platform designed for students, alumni, and administrators to connect, share job referrals, organize events, and facilitate mentorship.

---

## Architecture Overview

The repository is organized cleanly into two independent parts:

```
Alumni-protal/
├── frontend/                 # Complete frontend client application
│   ├── public/               # Static web assets & icons
│   ├── src/                  # Next.js 16 (App Router) + React 19 + TypeScript
│   │   ├── app/              # Routes (home, directory, events, jobs, profile)
│   │   ├── components/       # Reusable UI components & layouts
│   │   ├── context/          # Client AuthContext (Firebase authentication)
│   │   ├── data/             # TypeScript models & initial mock data
│   │   └── lib/              # Client API connector & Firebase client SDK
│   ├── .env.local            # Frontend environment variables
│   ├── next.config.ts        # Next.js configuration
│   └── package.json          # Frontend dependencies & scripts
│
├── backend/                  # Database, security rules & backend REST API
│   ├── database/             # Database schemas, security rules & seeds
│   │   ├── firebase.json     # Firebase CLI Firestore configuration
│   │   ├── firestore.rules   # Cloud Firestore security rules
│   │   ├── firestore.indexes.json # Firestore composite indexes
│   │   ├── schema.md         # Full database collections schema documentation
│   │   ├── seedData.json     # Initial database datasets
│   │   └── seed.js           # Database seeding script
│   ├── src/                  # Express REST API server
│   │   ├── config/           # Database & environment configuration
│   │   ├── controllers/      # Route controllers (jobs, events, alumni, users)
│   │   ├── middleware/       # Error handling & request logging
│   │   ├── routes/           # Express API route declarations
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # API server entrypoint
│   ├── .env                  # Backend environment variables
│   └── package.json          # Backend dependencies & scripts
│
├── package.json              # Root workspace runner scripts
└── README.md                 # Project documentation
```

---

## Quick Start

### 1. Run the Backend API Server
```bash
cd backend
npm install
npm run dev
```
The backend API server will run at `http://localhost:5000`.

To seed or verify initial Firestore data:
```bash
npm run seed
```

### 2. Run the Frontend Web Application
```bash
cd frontend
npm install
npm run dev
```
The web portal will open at `http://localhost:3000`.

---

## Backend REST API Endpoints

- `GET /` — API Information
- `GET /api/health` — Service health check
- `GET /api/jobs` — Job listings & filters
- `POST /api/jobs` — Submit a new job posting
- `GET /api/events` — Upcoming events & filters
- `POST /api/events` — Submit a new event
- `GET /api/alumni` — Alumni directory & search
- `GET /api/users/:uid` — User profile details
- `POST /api/users` — Save/update user profile
- `GET /api/database/status` — Database connection status & metrics
- `POST /api/database/seed` — Seed database collections

---

## Database Configuration

The Firestore database security rules and collection indexes are located in `backend/database/`:
- `backend/firestore.rules` (and `backend/database/firestore.rules`)
- `backend/firestore.indexes.json` (and `backend/database/firestore.indexes.json`)
- `backend/firebase.json`

To deploy Firestore security rules and indexes directly to Firebase:
```bash
cd backend
firebase deploy --only firestore
```
