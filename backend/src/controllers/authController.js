import { db } from "../config/db.js";
import { config } from "../config/env.js";

async function firebaseIdentity(action, payload) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${config.firebaseWebApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, returnSecureToken: true }),
    }
  );
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error?.message || "Firebase Authentication failed");
    error.status = response.status;
    throw error;
  }
  return result;
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { email, password, displayName, role = "student", department, classYear } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }
    if (!["student", "alumni"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Admin accounts can only be created by an existing administrator",
      });
    }

    const identity = await firebaseIdentity("signUp", { email, password });
    const uid = identity.localId;
    const newUser = {
      uid,
      email: email.toLowerCase(),
      displayName: displayName || email.split("@")[0],
      role,
      department: department || "",
      classYear: classYear || "",
      photoURL: "",
      bio: "Member of the VSITR Alumni Community.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("users").doc(uid).set(newUser);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: identity.idToken,
      user: newUser,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const identity = await firebaseIdentity("signInWithPassword", { email, password });
    const profile = await db.collection("users").doc(identity.localId).get();
    if (!profile.exists) {
      return res.status(403).json({ success: false, message: "Account profile is not registered" });
    }
    const userData = profile.data();

    res.json({
      success: true,
      message: "Signed in successfully",
      token: identity.idToken,
      user: userData,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: "Sign in failed",
      error: error.message,
    });
  }
}

// GET /api/auth/me (Protected)
export async function getMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user session",
      error: error.message,
    });
  }
}

// POST /api/auth/verify
export async function verifyToken(req, res) {
  try {
    res.json({
      success: true,
      valid: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      valid: false,
      message: "Token verification failed",
      error: error.message,
    });
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.json({
    success: true,
    message: "Signed out successfully",
  });
}
