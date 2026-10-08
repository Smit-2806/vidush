import { Router } from "express";
import {
  getAllUsers,
  getUserProfile,
  saveUserProfile,
  deleteUser,
  updateUserPassword,
} from "../controllers/userController.js";

const router = Router();

router.get("/", getAllUsers);
router.get("/:uid", getUserProfile);
router.post("/", saveUserProfile);
router.post("/:uid/password", updateUserPassword);
router.delete("/:uid", deleteUser);

export default router;
