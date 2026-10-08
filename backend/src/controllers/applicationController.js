import { db } from "../config/db.js";

// GET /api/applications
export async function getApplications(req, res) {
  try {
    const { jobId } = req.query;
    const snapshot = await db.collection("applications").get();
    let applications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (req.user.role === "student") {
      applications = applications.filter((app) => {
        return app.applicantId === req.user.uid;
      });
    } else if (req.user.role === "alumni") {
      const jobsSnapshot = await db.collection("jobs").get();
      const ownedJobIds = new Set(
        jobsSnapshot.docs
          .filter((job) => job.data().postedBy === req.user.uid)
          .map((job) => job.id)
      );
      applications = applications.filter((app) => {
        return app.posterId === req.user.uid || ownedJobIds.has(app.jobId);
      });
    }

    if (jobId) {
      applications = applications.filter((app) => app.jobId === jobId);
    }

    res.json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
}

// POST /api/applications
export async function createApplication(req, res) {
  try {
    const {
      jobId,
      resumeName,
      coverLetter,
    } = req.body;

    if (!jobId || !resumeName) {
      return res.status(400).json({
        success: false,
        message: "Job ID, applicant information, and resume are required",
      });
    }

    const jobSnapshot = await db.collection("jobs").doc(jobId).get();
    if (!jobSnapshot.exists) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    const job = jobSnapshot.data();

    const appId = req.body.id || `app-${Date.now()}`;
    const newApp = {
      id: appId,
      jobId,
      jobTitle: job.title || "Role",
      company: job.company || "Company",
      posterId: job.postedBy || "",
      posterEmail: job.postedByEmail || "",
      applicantId: req.user.uid,
      applicantName: req.user.displayName || "Candidate",
      applicantEmail: req.user.email || "",
      applicantRole: req.user.role,
      resumeName,
      coverLetter: coverLetter || "",
      appliedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Under Review",
      createdAt: new Date().toISOString(),
    };

    await db.collection("applications").doc(appId).set(newApp);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: newApp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: error.message,
    });
  }
}

// PATCH /api/applications/:id/status
export async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Under Review", "Selected", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Under Review', 'Selected', or 'Rejected'",
      });
    }

    const appRef = db.collection("applications").doc(id);
    const doc = await appRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (req.user.role !== "admin") {
      const application = doc.data();
      const job = application.jobId ? await db.collection("jobs").doc(application.jobId).get() : null;
      if (application.posterId !== req.user.uid && (!job?.exists || job.data().postedBy !== req.user.uid)) {
        return res.status(403).json({ success: false, message: "You can only review applicants for your own jobs" });
      }
    }

    if (typeof appRef.update === "function") {
      await appRef.update({
        status,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await appRef.set(
        {
          status,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    res.json({
      success: true,
      message: `Application marked as ${status}`,
      data: { id, status },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update application status",
      error: error.message,
    });
  }
}

// DELETE /api/applications/:id
export async function deleteApplication(req, res) {
  try {
    const { id } = req.params;
    await db.collection("applications").doc(id).delete();

    res.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: error.message,
    });
  }
}
