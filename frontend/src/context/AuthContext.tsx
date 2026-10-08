"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { saveUserProfile, getUserProfile, UserProfileData } from "@/lib/firestore";
import { saveProfileToBackend } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role?: "student" | "alumni") => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfilePhoto: (photoURL: string) => Promise<void>;
  updateUserProfileDetails: (details: Partial<UserProfileData>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String(error.code);
  }
  return "";
}

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndSyncProfile = async (currentUser: User) => {
    try {
      const existing = await getUserProfile(currentUser.uid);
      if (!existing) {
        setUserProfile(null);
        return;
      }

      if (!existing.photoURL && currentUser.photoURL) {
        existing.photoURL = currentUser.photoURL;
        await saveUserProfile({ uid: currentUser.uid, photoURL: currentUser.photoURL });
      }
      await saveProfileToBackend(existing);
      setUserProfile(existing);
    } catch (err) {
      console.error("Profile sync notice:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchAndSyncProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      if (profile) setUserProfile(profile);
    }
  };

  const updateUserProfilePhoto = async (photoURL: string) => {
    if (!user) return;
    try {
      // Update Firebase Auth profile if URL conforms to HTTP/HTTPS or character limits
      if (photoURL.startsWith("http://") || photoURL.startsWith("https://")) {
        try {
          await updateProfile(user, { photoURL });
        } catch (authErr) {
          console.warn("Firebase Auth photoURL update notice:", authErr);
        }
      }
      // Update Firestore user document
      await saveUserProfile({ uid: user.uid, photoURL });
      // Sync to backend database
      await saveProfileToBackend({ uid: user.uid, photoURL });
      // Update local state immediately
      setUserProfile((prev) => (prev ? { ...prev, photoURL } : null));
    } catch (err) {
      console.error("Failed to update photo:", err);
      throw err;
    }
  };

  const updateUserProfileDetails = async (details: Partial<UserProfileData>) => {
    if (!user) return;
    try {
      if (details.displayName || details.photoURL) {
        await updateProfile(user, {
          ...(details.displayName ? { displayName: details.displayName } : {}),
          ...(details.photoURL ? { photoURL: details.photoURL } : {}),
        });
      }
      await saveUserProfile({ uid: user.uid, ...details });
      await saveProfileToBackend({ uid: user.uid, ...details });
      setUserProfile((prev) => (prev ? { ...prev, ...details } : null));
    } catch (err) {
      console.error("Failed to update profile details:", err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        const existingProfile = await getUserProfile(res.user.uid);
        if (!existingProfile) {
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          const profileMissingMsg = "We could not find a saved role for this account. Ask an administrator to restore the profile.";
          setError(profileMissingMsg);
          throw new Error(profileMissingMsg);
        }
        await saveProfileToBackend(existingProfile);
        await fetchAndSyncProfile(res.user);
      }
    } catch (err: unknown) {
      console.error("Login Error:", err);
      const code = getErrorCode(err);
      const message = getErrorMessage(err);
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Invalid email or password. Please check your details or register.");
      } else if (code === "auth/invalid-api-key" || code === "auth/api-key-not-valid") {
        setError("Authentication service is temporarily unavailable. Please try again later.");
      } else {
        setError(message || "Failed to sign in.");
      }
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, role: "student" | "alumni" = "student") => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        const newProfile: UserProfileData = {
          uid: userCredential.user.uid,
          email: email,
          displayName: name || email.split("@")[0],
          photoURL: "",
          role: role,
        };
        await saveUserProfile(newProfile);
        await saveProfileToBackend(newProfile);
        setUserProfile(newProfile);
      }
    } catch (err: unknown) {
      console.error("Register Error:", err);
      const code = getErrorCode(err);
      const message = getErrorMessage(err);
      if (code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in instead.");
      } else if (code === "auth/weak-password") {
        setError("Password should be at least 6 characters long.");
      } else {
        setError(message || "Failed to register account.");
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const existingProfile = await getUserProfile(res.user.uid);
        if (existingProfile) {
          await fetchAndSyncProfile(res.user);
        } else {
          const initialProfile: UserProfileData = {
            uid: res.user.uid,
            email: res.user.email || "",
            displayName: res.user.displayName || res.user.email?.split("@")[0] || "User",
            photoURL: res.user.photoURL || "",
            role: "student",
            classYear: "",
            department: "",
            company: "",
            bio: "",
          };
          await saveUserProfile(initialProfile);
          await saveProfileToBackend(initialProfile);
          setUserProfile(initialProfile);
        }
      }
    } catch (err: unknown) {
      console.error("Google Auth Error:", err);
      const code = getErrorCode(err);
      const message = getErrorMessage(err);
      if (code === "auth/popup-closed-by-user") {
        setError("Google sign-in window was closed before completion.");
      } else if (code === "auth/unauthorized-domain") {
        setError("Authentication domain is not authorized. Please check your settings.");
      } else {
        setError(message || "Failed to sign in with Google.");
      }
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: unknown) {
      console.error("Signout Error:", err);
      setError(getErrorMessage(err) || "Failed to sign out.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        updateUserProfilePhoto,
        updateUserProfileDetails,
        refreshUserProfile,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
