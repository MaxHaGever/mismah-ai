import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { isAdminEmail } from "../utils/adminAccess";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  const user = await User.findById(userId);
  
  if (!user || !isAdminEmail(user.email)) {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  next();
}
