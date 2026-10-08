import { Router } from "express";
import {
  getAlumni,
  getAlumniById,
  createAlumni,
} from "../controllers/alumniController.js";

const router = Router();

router.get("/", getAlumni);
router.get("/:id", getAlumniById);
router.post("/", createAlumni);

export default router;
