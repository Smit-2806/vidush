import { db } from "../config/db.js";

// GET /api/jobs
export async function getJobs(req, res) {
  try {
    const { search, type, level } = req.query;
    const snapshot = await db.collection("jobs").get();
    let jobs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.company?.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q)
      );
    }

    if (type) {
      jobs = jobs.filter((j) => j.type?.toLowerCase() === type.toLowerCase());
    }

    if (level) {
      jobs = jobs.filter((j) => j.level?.toLowerCase() === level.toLowerCase());
    }

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
}

// GET /api/jobs/:id
export async function getJobById(req, res) {
  try {
    const { id } = req.params;
    const doc = await db.collection("jobs").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch job",
      error: error.message,
    });
  }
}

// POST /api/jobs
export async function createJob(req, res) {
  try {
    const { title, company, location, type, level, referral, featured, deadline } = req.body;

    if (!title || !company || !location) {
      return res.status(400).json({
        success: false,
        message: "Title, company, and location are required fields",
      });
    }

    const newJob = {
      title,
      company,
      location,
      type: type || "Full-time",
      level: level || "Entry Level",
      referral: Boolean(referral),
      featured: Boolean(featured),
      deadline: deadline || "Open",
      postedDate: "Just now",
      logoColorClass: "bg-surface-container",
      logoText: company.slice(0, 2).toUpperCase(),
      postedBy: req.user.uid,
      postedByName: req.user.displayName || "Alumni Member",
      postedByEmail: req.user.email || "",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("jobs").add(newJob);

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: { id: docRef.id, ...newJob },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create job",
      error: error.message,
    });
  }
}

// DELETE /api/jobs/:id
export async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    await db.collection("jobs").doc(id).delete();

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete job",
      error: error.message,
    });
  }
}
