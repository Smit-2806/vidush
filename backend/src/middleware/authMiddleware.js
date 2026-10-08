import { db, isUsingMockDb } from "../config/db.js";
import { config } from "../config/env.js";

function decodeFirestoreFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => {
    if ("stringValue" in value) return [key, value.stringValue];
    if ("booleanValue" in value) return [key, value.booleanValue];
    if ("integerValue" in value) return [key, Number(value.integerValue)];
    if ("doubleValue" in value) return [key, value.doubleValue];
    if ("timestampValue" in value) return [key, value.timestampValue];
    if ("nullValue" in value) return [key, null];
    return [key, undefined];
  }));
}

async function fetchProfileFromFirestore(uid, token) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${config.firebaseProjectId}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) return null;
  const document = await response.json();
  return { uid, ...decodeFirestoreFields(document.fields) };
}

function authenticate(requireProfile) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "A valid Firebase bearer token is required",
        });
      }

      const token = authHeader.slice("Bearer ".length).trim();
      let identity;

      if (isUsingMockDb) {
        const lookup = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.firebaseWebApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          }
        );
        const result = await lookup.json();
        if (!lookup.ok || !result.users?.[0]?.localId) {
          return res.status(401).json({ success: false, message: "Invalid or expired Firebase token" });
        }
        identity = {
          uid: result.users[0].localId,
          email: result.users[0].email || "",
        };
      } else {
        const adminModule = await import("firebase-admin");
        const admin = adminModule.default;
        const decodedToken = await admin.auth().verifyIdToken(token);
        identity = { uid: decodedToken.uid, email: decodedToken.email || "" };
      }

      const profileSnapshot = await db.collection("users").doc(identity.uid).get();
      let profile = profileSnapshot.exists ? profileSnapshot.data() : null;
      let firestoreProfile = null;
      if (isUsingMockDb) {
        try {
          firestoreProfile = await fetchProfileFromFirestore(identity.uid, token);
          profile = firestoreProfile || profile;
        } catch (error) {
          console.warn("Verified Firestore profile lookup unavailable:", error.message);
        }
      }
      const { currentPassword, password, ...safeProfile } = profile || {};
      const isProvisionedAdmin = firestoreProfile?.role === "admin" || (!profile && (
        config.adminUids.includes(identity.uid) ||
        config.adminEmails.includes(identity.email.toLowerCase())
      ));
      req.user = {
        ...identity,
        ...safeProfile,
        ...(isProvisionedAdmin ? { role: "admin", isProvisionedAdmin: true } : {}),
      };

      if (requireProfile && !profile?.role) {
        return res.status(403).json({ success: false, message: "Account profile is not registered" });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: error.message,
      });
    }
  };
}

/**
 * Authentication Middleware
 * Validates Bearer token from the Authorization header.
 * Attaches decoded user to req.user.
 */
export const requireFirebaseAuth = authenticate(false);
export const requireAuth = authenticate(true);

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(403).json({ success: false, message: "Account role is not assigned" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You do not have permission to perform this action" });
    }
    return next();
  };
}

export function requireSelfOrAdmin(req, res, next) {
  if (req.user?.role === "admin" || req.params.uid === req.user?.uid) {
    return next();
  }
  return res.status(403).json({ success: false, message: "You can only access your own account" });
}

/**
 * Optional Auth Middleware
 * Attaches user to req.user if present, but allows unauthenticated access.
 */
export async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return authenticate(false)(req, res, () => next());
}
