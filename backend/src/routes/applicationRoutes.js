import { Router } from "express";
import {
  getApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/applicationController.js";

const router = Router();

router.get("/", getApplications);
router.post("/", createApplication);
router.patch("/:id/status", updateApplicationStatus);
router.delete("/:id", deleteApplication);

export default router;
