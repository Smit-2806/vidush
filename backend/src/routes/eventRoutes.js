import { Router } from "express";
import {
  getEvents,
  getEventById,
  createEvent,
} from "../controllers/eventController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", requireAuth, requireRole("admin"), createEvent);

export default router;
