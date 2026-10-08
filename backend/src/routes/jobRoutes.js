import { Router } from "express";
import {
  getJobs,
  getJobById,
  createJob,
  deleteJob,
} from "../controllers/jobController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/", requireAuth, requireRole("alumni"), createJob);
router.delete("/:id", requireAuth, requireRole("admin"), deleteJob);

export default router;
