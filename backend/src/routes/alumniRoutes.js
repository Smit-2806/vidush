import { Router } from "express";
import {
  getAlumni,
  getAlumniById,
  createAlumni,
} from "../controllers/alumniController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getAlumni);
router.get("/:id", getAlumniById);
router.post("/", requireAuth, requireRole("alumni", "admin"), createAlumni);

export default router;
