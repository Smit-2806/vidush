import { Router } from "express";
import {
  getApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/applicationController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getApplications);
router.post("/", requireAuth, requireRole("student"), createApplication);
router.patch("/:id/status", requireAuth, requireRole("alumni", "admin"), updateApplicationStatus);
router.delete("/:id", requireAuth, requireRole("admin"), deleteApplication);

export default router;
