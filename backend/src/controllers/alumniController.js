import { db } from "../config/db.js";

// GET /api/alumni
export async function getAlumni(req, res) {
  try {
    const { search, mentor, department } = req.query;
    
    // 1. Fetch from alumni collection
    const snapshot = await db.collection("alumni").get();
    let alumni = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 2. Fetch from users collection for any registered user with role === "alumni"
    try {
      const usersSnapshot = await db.collection("users").get();
      const registeredAlumniUsers = usersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => u.role === "alumni");

      for (const u of registeredAlumniUsers) {
        const uid = u.uid || u.id;
        const exists = alumni.some(
          (a) => a.id === uid || (a.email && a.email.toLowerCase() === u.email?.toLowerCase())
        );
        if (!exists) {
          alumni.push({
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
    } catch (usersErr) {
      console.warn("Notice: users collection lookup in getAlumni:", usersErr.message);
    }

    if (search) {
      const q = search.toLowerCase();
      alumni = alumni.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.company?.toLowerCase().includes(q) ||
          a.role?.toLowerCase().includes(q) ||
          a.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (mentor !== undefined) {
      const isMentor = mentor === "true";
      alumni = alumni.filter((a) => Boolean(a.isMentor) === isMentor);
    }

    if (department) {
      alumni = alumni.filter(
        (a) => a.department?.toLowerCase() === department.toLowerCase()
      );
    }

    res.json({
      success: true,
      count: alumni.length,
      data: alumni,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alumni directory",
      error: error.message,
    });
  }
}

// GET /api/alumni/:id
export async function getAlumniById(req, res) {
  try {
    const { id } = req.params;
    const doc = await db.collection("alumni").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Alumnus not found",
      });
    }

    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alumnus",
      error: error.message,
    });
  }
}

// POST /api/alumni
export async function createAlumni(req, res) {
  try {
    const { name, classYear, department, company, role, skills, avatarUrl, isMentor, isVerified } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Alumnus name is required",
      });
    }

    const newAlumnus = {
      name,
      classYear: classYear || "",
      department: department || "",
      company: company || "",
      role: role || "",
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map(s => s.trim()) : []),
      avatarUrl: avatarUrl || "",
      isVerified: Boolean(isVerified ?? true),
      isMentor: Boolean(isMentor ?? false),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("alumni").add(newAlumnus);

    res.status(201).json({
      success: true,
      message: "Alumnus added successfully",
      data: { id: docRef.id, ...newAlumnus },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create alumnus",
      error: error.message,
    });
  }
}

