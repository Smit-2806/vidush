import { Router } from "express";
import {
  register,
  login,
  getMe,
  verifyToken,
  logout,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/verify", requireAuth, verifyToken);
router.post("/logout", requireAuth, logout);

export default router;
