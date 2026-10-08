import { db, isUsingMockDb } from "../config/db.js";

function publicUser(user) {
  if (!user) return user;
  const { currentPassword, password, ...safeUser } = user;
  return safeUser;
}

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
      data: publicUser(doc.data()),
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

    const isSelf = uid === req.user.uid;
    if (!isSelf && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You can only update your own profile" });
    }

    const currentSnapshot = await db.collection("users").doc(uid).get();
    const currentProfile = currentSnapshot.exists ? currentSnapshot.data() : null;
    if (role !== undefined && !["student", "alumni", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Unsupported account role" });
    }
    if (isSelf && role && currentProfile?.role && role !== currentProfile.role && !req.user.isProvisionedAdmin) {
      return res.status(403).json({ success: false, message: "You cannot change your own account role" });
    }
    if (role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Administrator roles can only be assigned by an administrator" });
    }
    if (!currentProfile && role === "admin" && !req.user.isProvisionedAdmin) {
      return res.status(403).json({ success: false, message: "New accounts cannot register as administrators" });
    }

    const userData = {
      uid,
      ...(isSelf ? { email: req.user.email || email || "" } : email ? { email } : {}),
      ...(displayName !== undefined ? { displayName } : {}),
      ...((!currentProfile || req.user.role === "admin") && role !== undefined ? { role } : {}),
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
      data: publicUser(userData),
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
    let users = snapshot.docs.map((doc) => publicUser({ uid: doc.id, ...doc.data() }));

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

export async function enrollMember(req, res) {
  try {
    const { email, password, displayName, role, department, classYear, company, bio } = req.body;
    if (!email || !password || !displayName || !["student", "alumni"].includes(role)) {
      return res.status(400).json({ success: false, message: "Name, email, password, and a student/alumni role are required" });
    }
    if (isUsingMockDb) {
      return res.status(503).json({
        success: false,
        message: "Account enrollment requires Firebase Admin credentials. Configure the service account to use this feature.",
      });
    }

    const adminModule = await import("firebase-admin");
    const admin = adminModule.default;
    const identity = await admin.auth().createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: displayName.trim(),
    });
    const profile = {
      uid: identity.uid,
      email: identity.email,
      displayName: identity.displayName,
      role,
      department: department || "",
      classYear: classYear || "",
      company: company || "",
      bio: bio || "",
      photoURL: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await db.collection("users").doc(identity.uid).set(profile);
    } catch (profileError) {
      await admin.auth().deleteUser(identity.uid);
      throw profileError;
    }
    return res.status(201).json({ success: true, data: publicUser(profile) });
  } catch (error) {
    return res.status(error.code === "auth/email-already-exists" ? 409 : 500).json({
      success: false,
      message: error.code === "auth/email-already-exists" ? "This email is already registered" : "Failed to enroll member",
    });
  }
}

// DELETE /api/users/:uid
export async function deleteUser(req, res) {
  try {
    const { uid } = req.params;
    if (uid === req.user.uid) {
      return res.status(400).json({ success: false, message: "You cannot delete your own administrator account" });
    }
    if (isUsingMockDb) {
      return res.status(503).json({
        success: false,
        message: "Account deletion requires Firebase Admin credentials so the authentication account can be removed safely.",
      });
    }
    const adminModule = await import("firebase-admin");
    const admin = adminModule.default;
    await admin.auth().deleteUser(uid);
    await db.collection("users").doc(uid).delete();
    await db.collection("alumni").doc(uid).delete();

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

    if (isUsingMockDb) {
      return res.status(503).json({
        success: false,
        message: "Direct password updates require Firebase Admin credentials. Use the password reset email instead.",
      });
    }

    const adminModule = await import("firebase-admin");
    const admin = adminModule.default;
    await admin.auth().updateUser(uid, { password: newPassword });

    await db.collection("users").doc(uid).set({ updatedAt: new Date().toISOString() }, { merge: true });

    res.json({
      success: true,
      message: "Password updated successfully",
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


