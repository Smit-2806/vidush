import { db, inMemoryDb } from "../config/db.js";

// Helper to generate a session token
function generateToken(user) {
  const payload = {
    uid: user.uid,
    email: user.email,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { email, password, displayName, role, department, classYear } = req.body;

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

    // Check if user already exists
    const usersSnapshot = await db.collection("users").get();
    const existing = usersSnapshot.docs.find(
      (d) => d.data()?.email?.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const uid = `usr-${Date.now()}`;
    const newUser = {
      uid,
      email: email.toLowerCase(),
      displayName: displayName || email.split("@")[0],
      role: role || "student",
      department: department || "",
      classYear: classYear || "",
      photoURL: "",
      bio: "Member of the VSITR Alumni Community.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("users").doc(uid).set(newUser);
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({
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

    const usersSnapshot = await db.collection("users").get();
    const foundDoc = usersSnapshot.docs.find(
      (d) => d.data()?.email?.toLowerCase() === email.toLowerCase()
    );

    if (!foundDoc) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const userData = foundDoc.data();
    const token = generateToken(userData);

    res.json({
      success: true,
      message: "Signed in successfully",
      token,
      user: userData,
    });
  } catch (error) {
    res.status(500).json({
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
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required for verification",
      });
    }

    let uid = token;
    try {
      const parsed = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
      if (parsed?.uid) uid = parsed.uid;
    } catch (e) {}

    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: "Token is invalid or expired",
      });
    }

    res.json({
      success: true,
      valid: true,
      user: doc.data(),
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
