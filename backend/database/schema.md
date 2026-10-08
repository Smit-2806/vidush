# Firestore Database Schema Documentation

This document describes the structure of the Google Cloud Firestore database used by the Alumni Portal.

---

## Collections Overview

| Collection | Description | Access Rules |
| :--- | :--- | :--- |
| `users` | User accounts and profile information | Authenticated users can read; Owners can create/update their doc |
| `jobs` | Job postings and internship listings | Public read; Authenticated users can create/update/delete |
| `events` | Academic and alumni events / webinars | Public read; Authenticated users can create/update/delete |
| `alumni` | Directory entries of verified alumni | Public read; Authenticated users can write |

---

## 1. `users` Collection
- **Document ID**: Firebase Auth UID (`{userId}`)
- **Security**: Can only be written by the matching authenticated user (`request.auth.uid == userId`).

```typescript
interface UserDocument {
  uid: string;                 // Firebase Auth UID (required)
  email: string;               // User email address (required)
  displayName: string;         // Full name of user (required)
  role: "student" | "alumni";  // Role within platform (required)
  classYear?: string;          // e.g. "Class of '24"
  department?: string;         // e.g. "Computer Science"
  company?: string;            // Current employer (if applicable)
  avatarUrl?: string;          // Profile picture URL
  updatedAt?: Timestamp;       // Server timestamp of last update
  createdAt?: Timestamp;       // Server timestamp of account creation
}
```

---

## 2. `jobs` Collection
- **Document ID**: Auto-generated or custom (`{jobId}`)
- **Security**: Publicly readable.

```typescript
interface JobDocument {
  id?: string;
  title: string;               // Job title (required)
  company: string;             // Company name (required)
  location: string;            // City / Remote / Hybrid (required)
  type: string;                // "Full-time" | "Internship" | "Part-time"
  level: string;               // "Entry Level" | "Mid-Senior" | "Senior" | "Director"
  referral: boolean;           // Whether alumni referral is available
  featured: boolean;           // Highlighted on home page
  postedDate?: string;         // Human readable posting date
  deadline?: string;           // Application deadline
  logoColorClass?: string;     // Tailwind color class for logo fallback
  logoText?: string;           // Short abbreviation for logo fallback
  logoUrl?: string;            // Company logo image URL
  alumniCount?: number;        // Number of alumni working at the company
  createdAt?: Timestamp;
}
```

---

## 3. `events` Collection
- **Document ID**: Auto-generated or custom (`{eventId}`)
- **Security**: Publicly readable.

```typescript
interface EventDocument {
  id?: string;
  title: string;               // Event name (required)
  month: string;               // 3-letter month abbreviation (e.g. "Oct")
  day: string;                 // Day of month (e.g. "12")
  location: string;            // Venue or "Virtual Event"
  isVirtual: boolean;          // Virtual vs in-person
  imageUrl?: string;           // Event banner/photo
  createdAt?: Timestamp;
}
```

---

## 4. `alumni` Collection
- **Document ID**: Auto-generated or custom (`{alumniId}`)
- **Security**: Publicly readable.

```typescript
interface AlumniDocument {
  id?: string;
  name: string;                // Full name (required)
  classYear: string;           // Graduation year (e.g. "Class of '14")
  department: string;          // Major / Department
  company: string;             // Current company
  role: string;                // Current job title
  skills: string[];            // Skill tags array
  avatarUrl?: string;          // Photo URL
  isVerified: boolean;         // Verified alumni status
  isMentor: boolean;           // Willing to mentor students
  createdAt?: Timestamp;
}
```
