import { Router } from "express";
import {
  getAllUsers,
  getUserProfile,
  saveUserProfile,
  enrollMember,
  deleteUser,
  updateUserPassword,
} from "../controllers/userController.js";
import { requireAuth, requireFirebaseAuth, requireRole, requireSelfOrAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), getAllUsers);
router.get("/:uid", requireAuth, requireSelfOrAdmin, getUserProfile);
router.post("/enroll", requireAuth, requireRole("admin"), enrollMember);
router.post("/", requireFirebaseAuth, saveUserProfile);
router.post("/:uid/password", requireAuth, requireRole("admin"), updateUserPassword);
router.delete("/:uid", requireAuth, requireRole("admin"), deleteUser);

export default router;
