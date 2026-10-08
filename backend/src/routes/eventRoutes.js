import { Router } from "express";
import {
  getEvents,
  getEventById,
  createEvent,
} from "../controllers/eventController.js";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", createEvent);

export default router;
