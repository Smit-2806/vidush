import { Job, EventItem, Alumni, Application } from "@/data/mockData";
import {
  getJobsFromFirestore,
  addJobToFirestore,
  getEventsFromFirestore,
  addEventToFirestore,
  getAlumniFromFirestore,
  addAlumniToFirestore,
  saveUserProfile,
  getUserProfile,
  getAllUsersFromFirestore,
  deleteUserFromFirestore,
  adminRegisterMember,
  adminUpdateMemberPassword,
  adminSendPasswordResetEmail,
  addApplicationToFirestore,
  getApplicationsFromFirestore,
  getApplicationsForApplicantFromFirestore,
  getApplicationsForPosterFromFirestore,
  updateApplicationStatusInFirestore,
  UserProfileData,
} from "./firestore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Fetch jobs: queries Cloud Firestore directly, with backend API fallback
 */
export async function fetchJobs(): Promise<Job[]> {
  try {
    const firestoreJobs = await getJobsFromFirestore();
    if (firestoreJobs && firestoreJobs.length > 0) {
      return firestoreJobs;
    }
    // Fallback to backend REST API if Firestore is empty or loading
    const res = await fetch(`${API_BASE_URL}/jobs`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) return json.data;
    }
    return firestoreJobs;
  } catch (err) {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {}
    return [];
  }
}

/**
 * Create a job: persists DIRECTLY to Cloud Firestore and syncs to backend API
 */
export async function createJobViaApi(jobData: Omit<Job, "id">): Promise<Job> {
  let createdJob: Job | null = null;
  try {
    // 1. Direct write to Cloud Firestore
    createdJob = await addJobToFirestore(jobData);
  } catch (firestoreErr) {
    console.warn("Direct Firestore job write notice:", firestoreErr);
  }

  // 2. Sync to Backend REST API in background
  try {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobData),
    });
    if (res.ok) {
      const json = await res.json();
      if (!createdJob) createdJob = json.data;
    }
  } catch (backendErr) {
    // Backend sync is secondary
  }

  if (createdJob) return createdJob;
  return { id: `job-${Date.now()}`, ...jobData };
}

/**
 * Fetch events: queries Cloud Firestore directly, with backend API fallback
 */
export async function fetchEvents(): Promise<EventItem[]> {
  try {
    const firestoreEvents = await getEventsFromFirestore();
    if (firestoreEvents && firestoreEvents.length > 0) {
      return firestoreEvents;
    }
    const res = await fetch(`${API_BASE_URL}/events`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) return json.data;
    }
    return firestoreEvents;
  } catch (err) {
    try {
      const res = await fetch(`${API_BASE_URL}/events`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {}
    return [];
  }
}

/**
 * Create an event: persists DIRECTLY to Cloud Firestore and syncs to backend API
 */
export async function createEventViaApi(eventData: Omit<EventItem, "id">): Promise<EventItem> {
  let createdEvent: EventItem | null = null;
  try {
    // 1. Direct write to Cloud Firestore
    createdEvent = await addEventToFirestore(eventData);
  } catch (firestoreErr) {
    console.warn("Direct Firestore event write notice:", firestoreErr);
  }

  // 2. Sync to Backend REST API
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });
    if (res.ok) {
      const json = await res.json();
      if (!createdEvent) createdEvent = json.data;
    }
  } catch (backendErr) {
    // Backend sync is secondary
  }

  if (createdEvent) return createdEvent;
  return { id: `event-${Date.now()}`, ...eventData };
}

/**
 * Fetch alumni: queries Cloud Firestore and backend REST API, merging registered alumni members
 */
export async function fetchAlumni(): Promise<Alumni[]> {
  const alumniMap = new Map<string, Alumni>();

  // 1. Fetch from Firestore (queries alumni collection + registered alumni users)
  try {
    const firestoreAlumni = await getAlumniFromFirestore();
    firestoreAlumni.forEach((a) => alumniMap.set(a.id, a));
  } catch (err) {}

  // 2. Fetch from Backend /api/alumni
  try {
    const res = await fetch(`${API_BASE_URL}/alumni`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        json.data.forEach((a: Alumni) => {
          if (!alumniMap.has(a.id)) {
            alumniMap.set(a.id, a);
          }
        });
      }
    }
  } catch (e) {}

  // 3. Fallback: also ensure any user with role === "alumni" from /api/users is included
  try {
    const usersRes = await fetch(`${API_BASE_URL}/users`, { cache: "no-store" });
    if (usersRes.ok) {
      const json = await usersRes.json();
      if (Array.isArray(json.data)) {
        json.data
          .filter((u: any) => u.role === "alumni")
          .forEach((u: any) => {
            const uid = u.uid || u.id;
            if (!alumniMap.has(uid)) {
              alumniMap.set(uid, {
                id: uid,
                name: u.displayName || u.email?.split("@")[0] || "Alumni Member",
                email: u.email,
                classYear: u.classYear || "Alumni",
                department: u.department || "General",
                company: u.company || "Alumni Community",
                role: u.company ? `Member at ${u.company}` : "Alumni Member",
                skills: ["Alumni Community", "Mentorship"],
                avatarUrl: u.photoURL || "",
                isVerified: true,
                isMentor: true,
                createdAt: u.createdAt,
              });
            }
          });
      }
    }
  } catch (e) {}

  return Array.from(alumniMap.values());
}

/**
 * Create alumni: persists DIRECTLY to Cloud Firestore and syncs to backend API
 */
export async function createAlumniViaApi(alumniData: Omit<Alumni, "id">): Promise<Alumni> {
  let createdAlumnus: Alumni | null = null;
  try {
    // 1. Direct write to Cloud Firestore
    createdAlumnus = await addAlumniToFirestore(alumniData);
  } catch (firestoreErr) {
    console.warn("Direct Firestore alumni write notice:", firestoreErr);
  }

  // 2. Sync to Backend REST API
  try {
    const res = await fetch(`${API_BASE_URL}/alumni`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alumniData),
    });
    if (res.ok) {
      const json = await res.json();
      if (!createdAlumnus) createdAlumnus = json.data;
    }
  } catch (backendErr) {
    // Backend sync is secondary
  }

  if (createdAlumnus) return createdAlumnus;
  return { id: `alumni-${Date.now()}`, ...alumniData };
}

/**
 * Save user profile: persists DIRECTLY to Cloud Firestore and syncs to backend
 */
export async function saveProfileToBackend(userProfile: Partial<UserProfileData> & { uid: string }) {
  try {
    await saveUserProfile(userProfile);
  } catch (e) {
    console.warn("Direct Firestore profile save notice:", e);
  }
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userProfile),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Fetch user profile: queries Cloud Firestore directly, with backend API fallback
 */
export async function fetchProfileFromBackend(uid: string): Promise<UserProfileData | null> {
  try {
    const firestoreProfile = await getUserProfile(uid);
    if (firestoreProfile) return firestoreProfile;
  } catch (e) {}
  try {
    const res = await fetch(`${API_BASE_URL}/users/${uid}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}
  return null;
}

/**
 * Backend Auth: Register user via REST API
 */
export async function apiRegister(payload: {
  email: string;
  password: string;
  displayName: string;
  role?: string;
  department?: string;
  classYear?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

/**
 * Backend Auth: Login user via REST API
 */
export async function apiLogin(payload: { email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

/**
 * Backend Auth: Verify token via REST API
 */
export async function apiVerifyToken(token: string) {
  const res = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return await res.json();
}

/**
 * Fetch all enrolled students and alumni
 */
export async function fetchAllUsers(): Promise<UserProfileData[]> {
  try {
    const firestoreUsers = await getAllUsersFromFirestore();
    if (firestoreUsers && firestoreUsers.length > 0) {
      return firestoreUsers;
    }
    const res = await fetch(`${API_BASE_URL}/users`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
    return firestoreUsers;
  } catch (err) {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {}
    return [];
  }
}

/**
 * Admin: Enroll/Sign up student or alumnus
 */
export async function adminEnrollMember(params: {
  email: string;
  password: string;
  displayName: string;
  role: "student" | "alumni";
  department?: string;
  classYear?: string;
  company?: string;
  bio?: string;
}): Promise<UserProfileData> {
  const profile = await adminRegisterMember(params);
  // Replicate to backend
  try {
    await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  } catch (e) {}
  return profile;
}

/**
 * Admin: Update student or alumnus profile
 */
export async function updateUserViaApi(
  uid: string,
  updatedData: Partial<UserProfileData>
): Promise<void> {
  await saveUserProfile({ uid, ...updatedData });
  try {
    await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, ...updatedData }),
    });
  } catch (e) {}
}

/**
 * Admin: Delete a student or alumnus account
 */
export async function deleteUserViaApi(uid: string): Promise<void> {
  await deleteUserFromFirestore(uid);
  try {
    await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: "DELETE",
    });
  } catch (e) {}
}

/**
 * Admin: Update/Reset a member's password
 */
export async function adminChangePassword(params: {
  email: string;
  uid: string;
  newPassword: string;
  currentPassword?: string;
}): Promise<void> {
  await adminUpdateMemberPassword(params);
  try {
    await fetch(`${API_BASE_URL}/users/${params.uid}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: params.newPassword }),
    });
  } catch (e) {}
}

/**
 * Admin: Send password reset link to member's email
 */
export async function adminSendResetEmail(email: string): Promise<void> {
  await adminSendPasswordResetEmail(email);
}

// ==========================================
// JOB APPLICATIONS API
// ==========================================

/**
 * Submit a Job Application: saves directly to Firestore and syncs with backend
 */
export async function submitJobApplicationViaApi(
  appData: Omit<Application, "id">
): Promise<Application> {
  const appId = `app-${Date.now()}`;
  const fullApp: Application = {
    id: appId,
    ...appData,
  };

  // 1. Direct write to Firestore
  try {
    await addApplicationToFirestore(fullApp);
  } catch (err) {
    console.warn("Direct Firestore application write notice:", err);
  }

  // 2. Sync with Backend REST API
  try {
    const res = await fetch(`${API_BASE_URL}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullApp),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data?.id) fullApp.id = json.data.id;
    }
  } catch (e) {}

  return fullApp;
}

/**
 * Fetch all applications submitted by a specific applicant
 */
export async function fetchApplicationsForApplicant(
  applicantId: string,
  applicantEmail?: string
): Promise<Application[]> {
  const appsMap = new Map<string, Application>();

  // 1. Fetch from Backend REST API
  try {
    const params = new URLSearchParams();
    if (applicantId) params.append("applicantId", applicantId);
    if (applicantEmail) params.append("applicantEmail", applicantEmail);

    const res = await fetch(`${API_BASE_URL}/applications?${params.toString()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        json.data.forEach((app: Application) => appsMap.set(app.id, app));
      }
    }
  } catch (e) {}

  // 2. Fetch from Firestore
  try {
    const firestoreApps = await getApplicationsForApplicantFromFirestore(
      applicantId,
      applicantEmail
    );
    firestoreApps.forEach((app) => {
      const existing = appsMap.get(app.id);
      // Prioritize decisive status (Selected / Rejected) if there's any lag
      if (!existing || (app.status !== "Under Review" && existing.status === "Under Review")) {
        appsMap.set(app.id, app);
      }
    });
  } catch (err) {}

  return Array.from(appsMap.values());
}

/**
 * Fetch all applications received for jobs posted by a specific alumnus
 */
export async function fetchApplicationsForPoster(
  posterId: string,
  posterEmail?: string
): Promise<Application[]> {
  const appsMap = new Map<string, Application>();

  // 1. Fetch from Backend REST API
  try {
    const params = new URLSearchParams();
    if (posterId) params.append("posterId", posterId);
    if (posterEmail) params.append("posterEmail", posterEmail);

    const res = await fetch(`${API_BASE_URL}/applications?${params.toString()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        json.data.forEach((app: Application) => appsMap.set(app.id, app));
      }
    }
  } catch (e) {}

  // 2. Fetch from Firestore
  try {
    const firestoreApps = await getApplicationsForPosterFromFirestore(posterId, posterEmail);
    firestoreApps.forEach((app) => {
      const existing = appsMap.get(app.id);
      if (!existing || (app.status !== "Under Review" && existing.status === "Under Review")) {
        appsMap.set(app.id, app);
      }
    });
  } catch (err) {}

  return Array.from(appsMap.values());
}

/**
 * Update candidate application review status (Selected, Rejected, Under Review)
 */
export async function updateApplicationStatusViaApi(
  applicationId: string,
  status: "Under Review" | "Selected" | "Rejected"
): Promise<void> {
  // 1. Update in Backend REST API
  try {
    await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    console.warn("Backend status update notice:", e);
  }

  // 2. Update in Firestore
  try {
    await updateApplicationStatusInFirestore(applicationId, status);
  } catch (err) {
    console.warn("Firestore application status update notice:", err);
  }
}

/**
 * Upload an image/photo to the backend storage
 * Supports File object (FormData) or base64 dataUrl string
 */
export async function uploadPhotoViaApi(fileOrDataUrl: File | string): Promise<string> {
  try {
    if (typeof fileOrDataUrl === "string") {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: fileOrDataUrl }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) return json.url;
      }
    } else {
      const formData = new FormData();
      formData.append("file", fileOrDataUrl);
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) return json.url;
      }
    }
  } catch (err) {
    console.warn("Upload API notice:", err);
  }

  // Fallback: if string, return as dataUrl
  if (typeof fileOrDataUrl === "string") {
    return fileOrDataUrl;
  }
  return "";
}



