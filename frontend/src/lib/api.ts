import { Job, EventItem, Alumni, Application } from "@/data/mockData";
import { auth } from "./firebase";
import {
  getJobsFromFirestore,
  getEventsFromFirestore,
  getAlumniFromFirestore,
  getUserProfile,
  adminSendPasswordResetEmail,
  getEventRegistrationsForStudent,
  saveEventRegistration,
  UserProfileData,
} from "./firestore";

export function getApiBaseUrl(): string | null {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      // In cloud/Vercel production without a backend URL: use direct Firestore
      return null;
    }
  }
  return "http://localhost:5000/api";
}

const API_BASE_URL = getApiBaseUrl() || "";

async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("No backend API configured for cloud hosting");
  }
  let finalPath = path;
  if (finalPath.startsWith("http://localhost:5000/api")) {
    finalPath = finalPath.replace("http://localhost:5000/api", baseUrl);
  }
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  const url = finalPath.startsWith("http") ? finalPath : `${baseUrl}${finalPath.startsWith("/") ? finalPath : `/${finalPath}`}`;
  return fetch(url, { ...init, headers });
}

/**
 * Fetch jobs: queries Cloud Firestore directly, with backend API fallback
 */
export async function fetchJobs(): Promise<Job[]> {
  try {
    const res = await apiRequest("/jobs", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) return json.data;
    }
  } catch (err) {
    // Expected in cloud mode, silent fallback to Firestore
  }
  return getJobsFromFirestore();
}

/**
 * Create a job: persists DIRECTLY to Cloud Firestore and syncs to backend API
 */
export async function createJobViaApi(jobData: Omit<Job, "id">): Promise<Job> {
  const res = await apiRequest(`${API_BASE_URL}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Unable to create job");
  return json.data as Job;
}

/**
 * Fetch events: queries Cloud Firestore directly, with backend API fallback
 */
export async function fetchEvents(): Promise<EventItem[]> {
  try {
    const res = await apiRequest(`${API_BASE_URL}/events`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) return json.data;
    }
  } catch (err) {
    console.warn("Events API unavailable; using Firestore read fallback:", err);
  }
  return getEventsFromFirestore();
}

export async function fetchEventRegistrationsForStudent(studentUid: string) {
  return getEventRegistrationsForStudent(studentUid);
}

export async function registerForEvent(registration: {
  eventId: string;
  eventTitle: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  status: "registered";
}) {
  return saveEventRegistration(registration);
}

/**
 * Create an event: persists DIRECTLY to Cloud Firestore and syncs to backend API
 */
export async function createEventViaApi(eventData: Omit<EventItem, "id">): Promise<EventItem> {
  const res = await apiRequest(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Unable to create event");
  return json.data as EventItem;
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
  } catch {}

  // 2. Fetch from Backend /api/alumni only if backend URL is available
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/alumni`, { cache: "no-store" });
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
    } catch {}
  }

  return Array.from(alumniMap.values());
}

/**
 * Create alumni: persists DIRECTLY to Cloud Firestore and syncs to backend API
 */
export async function createAlumniViaApi(alumniData: Omit<Alumni, "id">): Promise<Alumni> {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    try {
      await apiRequest("/alumni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumniData),
      });
    } catch {}
  }
  return alumniData as Alumni;
}

/**
 * Sync an authenticated user's profile to the backend store (non-blocking fallback)
 */
export async function saveProfileToBackend(userProfile: Partial<UserProfileData> & { uid: string }) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return null;
  }
  try {
    const res = await apiRequest("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userProfile),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * Fetch user profile: queries Cloud Firestore directly, with backend API fallback
 */
export async function fetchProfileFromBackend(uid: string): Promise<UserProfileData | null> {
  try {
    const firestoreProfile = await getUserProfile(uid);
    if (firestoreProfile) return firestoreProfile;
  } catch {}
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;
  try {
    const res = await apiRequest(`/users/${uid}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {}
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
  const res = await apiRequest(`${API_BASE_URL}/auth/verify`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  return await res.json();
}

/**
 * Fetch all enrolled students and alumni
 */
export async function fetchAllUsers(): Promise<UserProfileData[]> {
  const res = await apiRequest(`${API_BASE_URL}/users`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Unable to load member accounts");
  return Array.isArray(json.data) ? json.data : [];
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
  const response = await apiRequest(`${API_BASE_URL}/users/enroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Unable to enroll member");
  }
  return result.data as UserProfileData;
}

/**
 * Admin: Update student or alumnus profile
 */
export async function updateUserViaApi(
  uid: string,
  updatedData: Partial<UserProfileData>
): Promise<void> {
  const response = await apiRequest(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, ...updatedData }),
  });
  if (!response.ok) throw new Error("Unable to update member profile");
}

/**
 * Admin: Delete a student or alumnus account
 */
export async function deleteUserViaApi(uid: string): Promise<void> {
  const response = await apiRequest(`${API_BASE_URL}/users/${uid}`, { method: "DELETE" });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || "Unable to delete member account");
  }
}

/**
 * Admin: Update/Reset a member's password
 */
export async function adminChangePassword(params: {
  email: string;
  uid: string;
  newPassword: string;
}): Promise<void> {
  const response = await apiRequest(`${API_BASE_URL}/users/${params.uid}/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword: params.newPassword }),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || "Unable to update password");
  }
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
  const response = await apiRequest(`${API_BASE_URL}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(appData),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to submit application");
  return result.data as Application;
}

/**
 * Fetch all applications submitted by a specific applicant
 */
export async function fetchApplicationsForApplicant(): Promise<Application[]> {
  const response = await apiRequest(`${API_BASE_URL}/applications`, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to load applications");
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Fetch all applications received for jobs posted by a specific alumnus
 */
export async function fetchApplicationsForPoster(): Promise<Application[]> {
  const response = await apiRequest(`${API_BASE_URL}/applications`, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to load applications");
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Update candidate application review status (Selected, Rejected, Under Review)
 */
export async function updateApplicationStatusViaApi(
  applicationId: string,
  status: "Under Review" | "Selected" | "Rejected"
): Promise<void> {
  const response = await apiRequest(`${API_BASE_URL}/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || "Unable to update application status");
  }
}

/**
 * Upload an image/photo to the backend storage
 * Supports File object (FormData) or base64 dataUrl string
 */
export async function uploadPhotoViaApi(fileOrDataUrl: File | string): Promise<string> {
  try {
    if (typeof fileOrDataUrl === "string") {
      const res = await apiRequest(`${API_BASE_URL}/upload`, {
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
      const res = await apiRequest(`${API_BASE_URL}/upload`, {
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



