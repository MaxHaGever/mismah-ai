import express from "express";
import { protect } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  getAllUsers,
  promoteToAdmin,
  deleteUser,
  inviteUser,
  updateUserQuota,
} from "../controllers/adminController";
import { ReportLog } from "../models/reportLog";

const router = express.Router();

router.get("/users", protect, requireAdmin, getAllUsers);

router.patch("/users/:id/promote", protect, requireAdmin, promoteToAdmin);

router.patch("/users/:id/quota", protect, requireAdmin, updateUserQuota);

router.delete("/users/:id", protect, requireAdmin, deleteUser);

router.post("/users/invite", protect, requireAdmin, inviteUser);

router.get("/reports", protect, requireAdmin, async (req, res) => {
  const logs = await ReportLog.find().populate("user", "email").sort({ createdAt: -1 });
  res.json({ reports: logs });
});

export default router;
