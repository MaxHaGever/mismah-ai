import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  const user = await User.findById(userId);
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  next();
}
