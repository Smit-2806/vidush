import { Router } from "express";
import {
  seedDatabase,
  getDatabaseStatus,
} from "../controllers/databaseController.js";

const router = Router();

router.post("/seed", seedDatabase);
router.get("/status", getDatabaseStatus);

export default router;
