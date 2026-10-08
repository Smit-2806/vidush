import { db } from "../config/db.js";

// GET /api/users/:uid
export async function getUserProfile(req, res) {
  try {
    const { uid } = req.params;
    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
}

// POST /api/users
export async function saveUserProfile(req, res) {
  try {
    const { uid, email, displayName, role, classYear, department, company, photoURL, bio } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "UID is required",
      });
    }

    const userData = {
      uid,
      ...(email ? { email } : {}),
      ...(displayName !== undefined ? { displayName } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(classYear !== undefined ? { classYear } : {}),
      ...(department !== undefined ? { department } : {}),
      ...(company !== undefined ? { company } : {}),
      ...(photoURL !== undefined ? { photoURL } : {}),
      ...(bio !== undefined ? { bio } : {}),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("users").doc(uid).set(userData, { merge: true });

    res.json({
      success: true,
      message: "User profile saved successfully",
      data: userData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save user profile",
      error: error.message,
    });
  }
}

// GET /api/users
export async function getAllUsers(req, res) {
  try {
    const { role } = req.query;
    const snapshot = await db.collection("users").get();
    let users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));

    if (role) {
      users = users.filter((u) => u.role?.toLowerCase() === role.toLowerCase());
    }

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
}

// DELETE /api/users/:uid
export async function deleteUser(req, res) {
  try {
    const { uid } = req.params;
    await db.collection("users").doc(uid).delete();

    res.json({
      success: true,
      message: "User deleted successfully",
      uid,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
}

// POST /api/users/:uid/password
export async function updateUserPassword(req, res) {
  try {
    const { uid } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    await db.collection("users").doc(uid).set({
      currentPassword: newPassword,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    res.json({
      success: true,
      message: "Password updated successfully in database store",
      uid,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
    });
  }
}


