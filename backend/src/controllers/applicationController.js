import { db } from "../config/db.js";

// GET /api/applications
export async function getApplications(req, res) {
  try {
    const { applicantId, applicantEmail, posterId, posterEmail, jobId } = req.query;
    const snapshot = await db.collection("applications").get();
    let applications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (applicantId || applicantEmail) {
      applications = applications.filter((app) => {
        const matchId = applicantId && app.applicantId === applicantId;
        const matchEmail =
          applicantEmail &&
          app.applicantEmail?.toLowerCase() === applicantEmail.toLowerCase();
        return matchId || matchEmail;
      });
    }

    if (posterId || posterEmail) {
      applications = applications.filter((app) => {
        const matchId = posterId && app.posterId === posterId;
        const matchEmail =
          posterEmail &&
          app.posterEmail?.toLowerCase() === posterEmail.toLowerCase();
        return matchId || matchEmail;
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
      jobTitle,
      company,
      posterId,
      posterEmail,
      applicantId,
      applicantName,
      applicantEmail,
      applicantRole,
      resumeName,
      coverLetter,
      appliedDate,
    } = req.body;

    if (!jobId || !applicantId || !resumeName) {
      return res.status(400).json({
        success: false,
        message: "Job ID, applicant information, and resume are required",
      });
    }

    const appId = req.body.id || `app-${Date.now()}`;
    const newApp = {
      id: appId,
      jobId,
      jobTitle: jobTitle || "Role",
      company: company || "Company",
      posterId: posterId || "",
      posterEmail: posterEmail || "",
      applicantId,
      applicantName: applicantName || "Candidate",
      applicantEmail: applicantEmail || "",
      applicantRole: applicantRole || "student",
      resumeName,
      coverLetter: coverLetter || "",
      appliedDate: appliedDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      status: req.body.status || "Under Review",
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
