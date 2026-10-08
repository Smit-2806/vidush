# VSITR Alumni Portal — Frontend

The frontend application for the VSITR Alumni Portal, built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.

---

## Folder Structure

```
frontend/
├── public/                 # Static assets (images, logos, icons)
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── directory/      # Alumni directory page
│   │   ├── events/         # Upcoming events page
│   │   ├── home/           # Home dashboard feed
│   │   ├── jobs/           # Job board & application postings
│   │   ├── profile/        # User profile & settings
│   │   ├── globals.css     # Global theme styling
│   │   ├── layout.tsx      # Root application layout & AuthProvider
│   │   └── page.tsx        # Landing / Authentication page (Sign in & Register)
│   ├── components/         # Reusable UI components
│   │   ├── BottomNav.tsx   # Mobile & desktop navigation bar
│   │   ├── Header.tsx      # Top bar with notifications & profile avatar
│   │   └── LayoutWrapper.tsx # Shared frame with side drawer
│   ├── context/            # React contexts
│   │   └── AuthContext.tsx # Firebase authentication provider
│   ├── data/               # Mock data & TypeScript interfaces
│   │   └── mockData.ts
│   └── lib/                # Client libraries & API integration
│       ├── api.ts          # REST API client connecting to backend service
│       ├── firebase.ts     # Firebase client SDK initialization
│       └── firestore.ts    # Client-side Firestore database operations
├── .env.local              # Local environment variables
├── .env.local.example      # Example environment template
├── next.config.ts          # Next.js build configuration
├── package.json            # Frontend dependencies & scripts
└── tsconfig.json           # TypeScript configuration
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local` and set your Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alunimi-947f0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alunimi-947f0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build for Production
```bash
npm run build
```
Outputs static assets into `out/`.
