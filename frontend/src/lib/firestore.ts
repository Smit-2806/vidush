import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Job, EventItem, Alumni, EventRegistration } from "@/data/mockData";

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  role: "student" | "alumni" | "admin";
  classYear?: string;
  department?: string;
  company?: string;
  photoURL?: string;
  bio?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Save or Update User Profile in Firestore
export async function saveUserProfile(userProfile: Partial<UserProfileData> & { uid: string }) {
  try {
    const userRef = doc(db, "users", userProfile.uid);
    await setDoc(
      userRef,
      {
        ...userProfile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
}

// Fetch User Profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfileData | null> {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

// Send official password reset email to member
export async function adminSendPasswordResetEmail(email: string): Promise<void> {
  const authInstance = getAuth();
  await sendPasswordResetEmail(authInstance, email);
}

// Fetch Jobs from Firestore (starts clean, no demo fallback)
export async function getJobsFromFirestore(): Promise<Job[]> {
  try {
    const q = query(collection(db, "jobs"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Job));
    }
    return [];
  } catch (error) {
    console.warn("Firestore jobs fetch notice:", error);
    return [];
  }
}

// Fetch Events from Firestore (starts clean, no demo fallback)
export async function getEventsFromFirestore(): Promise<EventItem[]> {
  try {
    const q = query(collection(db, "events"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as EventItem));
    }
    return [];
  } catch (error) {
    console.warn("Firestore events fetch notice:", error);
    return [];
  }
}

export async function getEventRegistrationsForStudent(studentUid: string): Promise<EventRegistration[]> {
  const registrationsQuery = query(
    collection(db, "eventApplications"),
    where("studentUid", "==", studentUid)
  );
  const snapshot = await getDocs(registrationsQuery);
  return snapshot.docs.map((registration) => ({
    id: registration.id,
    ...(registration.data() as Omit<EventRegistration, "id">),
  }));
}

export async function saveEventRegistration(
  registration: Omit<EventRegistration, "id" | "createdAt">
): Promise<EventRegistration> {
  const id = encodeURIComponent(`${registration.eventId}_${registration.studentUid}`);
  const eventRegistration: EventRegistration = { id, ...registration };
  await setDoc(doc(db, "eventApplications", id), {
    ...eventRegistration,
    createdAt: serverTimestamp(),
  });
  return eventRegistration;
}

// Fetch Alumni from Firestore (queries alumni collection + registered alumni users)
export async function getAlumniFromFirestore(): Promise<Alumni[]> {
  const alumniMap = new Map<string, Alumni>();

  // 1. Fetch from alumni collection
  try {
    const q = query(collection(db, "alumni"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      snapshot.docs.forEach((d) => {
        alumniMap.set(d.id, { ...d.data(), id: d.id } as Alumni);
      });
    }
  } catch (error) {
    console.warn("Firestore alumni collection notice:", error);
  }

  // 2. Fetch from users collection for registered members with role === "alumni"
  try {
    const usersSnapshot = await getDocs(query(collection(db, "users")));
    if (!usersSnapshot.empty) {
      usersSnapshot.docs.forEach((d) => {
        const u = d.data() as UserProfileData;
        if (u.role === "alumni") {
          const uid = u.uid || d.id;
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
        }
      });
    }
  } catch (userErr) {
    console.warn("Firestore registered alumni users notice:", userErr);
  }

  return Array.from(alumniMap.values());
}


