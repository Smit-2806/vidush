import { Router } from "express";
import {
  seedDatabase,
  getDatabaseStatus,
} from "../controllers/databaseController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/seed", requireAuth, requireRole("admin"), seedDatabase);
router.get("/status", requireAuth, requireRole("admin"), getDatabaseStatus);

export default router;
