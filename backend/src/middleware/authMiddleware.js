import { db, isUsingMockDb } from "../config/db.js";

/**
 * Authentication Middleware
 * Validates Bearer token from the Authorization header.
 * Attaches decoded user to req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing or invalid format (Bearer token required)",
      });
    }

    const token = authHeader.split("Bearer ")[1].trim();

    if (!isUsingMockDb) {
      const adminModule = await import("firebase-admin");
      const admin = adminModule.default;
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      return next();
    }

    // Local / Token verification mode
    // Support either UID direct token or JSON session token
    let uid = token;
    try {
      const parsed = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
      if (parsed && parsed.uid) uid = parsed.uid;
    } catch (e) {
      // Direct UID token
    }

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. User not found.",
      });
    }

    req.user = { uid, ...userDoc.data() };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
}

/**
 * Optional Auth Middleware
 * Attaches user to req.user if present, but allows unauthenticated access.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1].trim();
      let uid = token;
      try {
        const parsed = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
        if (parsed && parsed.uid) uid = parsed.uid;
      } catch (e) {}

      const userDoc = await db.collection("users").doc(uid).get();
      if (userDoc.exists) {
        req.user = { uid, ...userDoc.data() };
      }
    }
  } catch (e) {
    // Ignore optional auth error
  }
  next();
}
