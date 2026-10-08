import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { Job, EventItem, Alumni, Application } from "@/data/mockData";

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
  currentPassword?: string;
  createdAt?: any;
  updatedAt?: any;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA_N9CzEMa7tmvM8m7_otIVCRPXQE5ORdA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "alunimi-947f0.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "alunimi-947f0",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "alunimi-947f0.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "753336162087",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:753336162087:web:9b0212862458e77a48bb02",
};

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

// Fetch All Users from Firestore
export async function getAllUsersFromFirestore(): Promise<UserProfileData[]> {
  try {
    const q = query(collection(db, "users"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })) as UserProfileData[];
    }
    return [];
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

// Delete User Profile from Firestore
export async function deleteUserFromFirestore(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    console.error("Error deleting user from Firestore:", error);
    throw error;
  }
}

// Admin enroll new student or alumnus with real Firebase Auth credentials
export async function adminRegisterMember(params: {
  email: string;
  password: string;
  displayName: string;
  role: "student" | "alumni";
  department?: string;
  classYear?: string;
  company?: string;
  bio?: string;
}): Promise<UserProfileData> {
  const secondaryAppName = `SecondaryEnrollmentApp-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      params.email,
      params.password
    );
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    const newProfile: UserProfileData = {
      uid,
      email: params.email,
      displayName: params.displayName,
      role: params.role,
      department: params.department || "",
      classYear: params.classYear || "",
      company: params.company || "",
      bio: params.bio || (params.role === "student" ? "Enrolled Student" : "Proud Alumnus"),
      photoURL: "",
      currentPassword: params.password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", uid), newProfile);

    // If role is alumni, also populate alumni collection
    if (params.role === "alumni") {
      try {
        const alumnusRecord: Alumni = {
          id: uid,
          name: params.displayName,
          email: params.email,
          classYear: params.classYear || "Alumni",
          department: params.department || "General",
          company: params.company || "Alumni Community",
          role: params.company ? `Member at ${params.company}` : "Alumni Member",
          skills: ["Alumni Community", "Mentorship"],
          avatarUrl: "",
          isVerified: true,
          isMentor: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "alumni", uid), alumnusRecord);
      } catch (alumniErr) {
        console.warn("Notice: Syncing to alumni collection:", alumniErr);
      }
    }

    return newProfile;
  } catch (err: any) {
    try {
      await deleteApp(secondaryApp);
    } catch (e) {}
    throw err;
  }
}

// Admin update member password in Firebase Auth and Firestore
export async function adminUpdateMemberPassword(params: {
  email: string;
  uid: string;
  newPassword: string;
  currentPassword?: string;
}): Promise<void> {
  // If we have the current password, update Firebase Auth directly via secondary instance
  if (params.currentPassword) {
    try {
      const secondaryAppName = `SecondaryPassUpdateApp-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      const userCred = await signInWithEmailAndPassword(
        secondaryAuth,
        params.email,
        params.currentPassword
      );
      await updatePassword(userCred.user, params.newPassword);
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
    } catch (authErr) {
      console.warn("Direct Firebase Auth credential update notice:", authErr);
    }
  }

  // Update in Firestore
  await setDoc(
    doc(db, "users", params.uid),
    {
      currentPassword: params.newPassword,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
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
      return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Job[];
    }
    return [];
  } catch (error) {
    console.warn("Firestore jobs fetch notice:", error);
    return [];
  }
}

// Add a Job to Firestore
export async function addJobToFirestore(job: Omit<Job, "id">): Promise<Job> {
  try {
    const docRef = await addDoc(collection(db, "jobs"), {
      ...job,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...job };
  } catch (error) {
    console.error("Error adding job to Firestore:", error);
    throw error;
  }
}

// Fetch Events from Firestore (starts clean, no demo fallback)
export async function getEventsFromFirestore(): Promise<EventItem[]> {
  try {
    const q = query(collection(db, "events"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as EventItem[];
    }
    return [];
  } catch (error) {
    console.warn("Firestore events fetch notice:", error);
    return [];
  }
}

// Add an Event to Firestore
export async function addEventToFirestore(event: Omit<EventItem, "id">): Promise<EventItem> {
  try {
    const docRef = await addDoc(collection(db, "events"), {
      ...event,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...event };
  } catch (error) {
    console.error("Error adding event to Firestore:", error);
    throw error;
  }
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
        alumniMap.set(d.id, { id: d.id, ...(d.data() as any) });
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

// Add an Alumni to Firestore
export async function addAlumniToFirestore(alumnus: Omit<Alumni, "id">): Promise<Alumni> {
  try {
    const docRef = await addDoc(collection(db, "alumni"), {
      ...alumnus,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...alumnus };
  } catch (error) {
    console.error("Error adding alumnus to Firestore:", error);
    throw error;
  }
}

// ==========================================
// JOB APPLICATIONS
// ==========================================

// Add a Job Application to Firestore
export async function addApplicationToFirestore(
  application: Application | (Omit<Application, "id"> & { id?: string })
): Promise<Application> {
  try {
    const appId = application.id || doc(collection(db, "applications")).id;
    const finalApp: Application = {
      id: appId,
      jobId: application.jobId,
      jobTitle: application.jobTitle,
      company: application.company,
      posterId: application.posterId,
      posterEmail: application.posterEmail,
      applicantId: application.applicantId,
      applicantName: application.applicantName,
      applicantEmail: application.applicantEmail,
      applicantRole: application.applicantRole,
      resumeName: application.resumeName,
      coverLetter: application.coverLetter,
      appliedDate: application.appliedDate,
      status: application.status || "Under Review",
    };

    await setDoc(doc(db, "applications", appId), {
      ...finalApp,
      createdAt: serverTimestamp(),
    });
    return finalApp;
  } catch (error) {
    console.error("Error adding application to Firestore:", error);
    throw error;
  }
}

// Fetch all Job Applications from Firestore
export async function getApplicationsFromFirestore(): Promise<Application[]> {
  try {
    const q = query(collection(db, "applications"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Application[];
    }
    return [];
  } catch (error) {
    console.warn("Firestore applications fetch notice:", error);
    return [];
  }
}

// Fetch Job Applications submitted by an applicant
export async function getApplicationsForApplicantFromFirestore(
  applicantId: string,
  applicantEmail?: string
): Promise<Application[]> {
  try {
    const all = await getApplicationsFromFirestore();
    return all.filter(
      (a) =>
        (applicantId && a.applicantId === applicantId) ||
        (applicantEmail &&
          a.applicantEmail &&
          a.applicantEmail.toLowerCase() === applicantEmail.toLowerCase())
    );
  } catch (error) {
    console.error("Error getting applications for applicant:", error);
    return [];
  }
}

// Fetch Job Applications for jobs posted by a specific alumnus
export async function getApplicationsForPosterFromFirestore(
  posterId: string,
  posterEmail?: string
): Promise<Application[]> {
  try {
    const all = await getApplicationsFromFirestore();
    return all.filter(
      (a) =>
        (posterId && a.posterId === posterId) ||
        (posterEmail && a.posterEmail && a.posterEmail.toLowerCase() === posterEmail.toLowerCase())
    );
  } catch (error) {
    console.error("Error getting applications for poster:", error);
    return [];
  }
}

// Update Application Status in Firestore (e.g. Selected, Rejected, Under Review)
export async function updateApplicationStatusInFirestore(
  applicationId: string,
  status: "Under Review" | "Selected" | "Rejected"
): Promise<void> {
  try {
    const appRef = doc(db, "applications", applicationId);
    await setDoc(
      appRef,
      {
        status,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating application status in Firestore:", error);
    throw error;
  }
}

