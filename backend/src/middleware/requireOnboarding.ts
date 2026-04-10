import { Request, Response, NextFunction } from "express";
import { User } from "../models/User"; // adjust path if needed

export async function requireOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.hasAcceptedTerms || !user.companyName?.trim()) {
      return res.status(403).json({
        error: "User has not completed onboarding",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
