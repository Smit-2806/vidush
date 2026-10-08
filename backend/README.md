# VSITR Alumni Portal — Backend & Database

This folder contains the complete backend services, REST API, and Firestore database configuration for the VSITR Alumni Portal.

---

## Folder Structure

```
backend/
├── database/                   # Database schemas, rules & seed data
│   ├── firebase.json           # Firebase CLI Firestore configuration
│   ├── firestore.rules         # Cloud Firestore security rules
│   ├── firestore.indexes.json  # Cloud Firestore composite indexes
│   ├── schema.md               # Collection schemas and types documentation
│   ├── seedData.json           # Seed datasets (jobs, events, alumni)
│   └── seed.js                 # Standalone database seeding script
├── src/
│   ├── config/
│   │   ├── env.js              # Environment variable loader
│   │   └── db.js               # Database adapter (Firestore + Mock fallback)
│   ├── controllers/
│   │   ├── jobController.js    # Job listings handlers
│   │   ├── eventController.js  # Event listings handlers
│   │   ├── alumniController.js # Alumni directory handlers
│   │   ├── userController.js   # User profile handlers
│   │   └── databaseController.js# Seeding & health status handlers
│   ├── middleware/
│   │   ├── errorHandler.js     # Global error handling
│   │   └── logger.js           # Request logging
│   ├── routes/
│   │   ├── jobRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── alumniRoutes.js
│   │   ├── userRoutes.js
│   │   └── databaseRoutes.js
│   ├── app.js                  # Express app setup & route mounting
│   └── server.js               # Server entry point
├── .env                        # Local environment settings
├── .env.example                # Example environment file
├── .gitignore                  # Git ignore rules
└── package.json                # Node.js dependencies and scripts
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
A `.env` file is provided with default settings:
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
FIREBASE_PROJECT_ID=alunimi-947f0
ADMIN_EMAILS=admin@alumniportal.com
ADMIN_UIDS=iL8SjtYEODUpX778guh7UpNpPhz1
```

`ADMIN_EMAILS` and `ADMIN_UIDS` are comma-separated allowlists for existing administrator accounts. Add the real Firebase Auth email or UID here if it differs from the seeded admin. These values are checked only after the backend verifies the Firebase ID token; they do not enable public admin signup. Configure `FIREBASE_SERVICE_ACCOUNT_PATH` to enable Admin SDK account enrollment, deletion, and direct password updates.

### 3. Run the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

### 4. Seed Database
```bash
npm run seed
```

---

## REST API Endpoints

### Health & Info
- `GET /` — API welcome & list of active endpoints
- `GET /api/health` — Health check & uptime

### Jobs
- `GET /api/jobs` — Fetch jobs (supports query params: `?search=term&type=Full-time&level=Senior`)
- `GET /api/jobs/:id` — Get single job details
- `POST /api/jobs` — Create new job posting
- `DELETE /api/jobs/:id` — Delete a job posting

### Events
- `GET /api/events` — Fetch events (supports query param: `?virtual=true`)
- `GET /api/events/:id` — Get single event
- `POST /api/events` — Create new event

### Alumni Directory
- `GET /api/alumni` — Fetch alumni (supports query params: `?search=name&mentor=true&department=CS`)
- `GET /api/alumni/:id` — Get single alumni profile

### Users
- `GET /api/users/:uid` — Get user profile by Firebase UID
- `POST /api/users` — Save/update user profile

### Database
- `GET /api/database/status` — Get database connection status & item counts
- `POST /api/database/seed` — Seed or reset collections with initial data

---

## Deploying Firebase Security Rules
To deploy the database security rules and indexes directly to Firebase:
```bash
firebase deploy --only firestore
```
*(Make sure Firebase CLI is logged in to project `alunimi-947f0`)*
