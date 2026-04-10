import { User } from '../models/User';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateToken } from '../utils/generateToken';
import { AuthenticateRequest } from '../middleware/authMiddleware'; 
import { error } from 'console';
import { sendEmail } from '../utils/mailer'
import { generateResetToken, verifyResetToken } from '../utils/generateResetToken';

function serializeUser(user: any) {
  return {
    id: user._id,
    email: user.email,
    companyName: user.companyName,
    companyLogo: user.companyLogo,
    companyAddress: user.companyAddress,
    companyPhone: user.companyPhone,
    companyPhone2: user.companyPhone2,
    companyEmail: user.companyEmail,
    companyWebsite: user.companyWebsite,
    companyId: user.companyId,
    monthlyDocumentLimit: user.monthlyDocumentLimit ?? 5,
    isAdmin: !!user.isAdmin,
    hasChangedPassword: user.hasChangedPassword,
    hasAcceptedTerms: user.hasAcceptedTerms,
    authProvider: user.authProvider || 'local',
  };
}

function shouldGrantAdminOnRegister(email: string, existingUserCount: number): boolean {
  if (existingUserCount === 0) {
    return true;
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const existingUserCount = await User.countDocuments();
    const newUser = new User({
      email,
      password,
      isAdmin: shouldGrantAdminOnRegister(email, existingUserCount),
    });
    await newUser.save();

    const token = generateToken(newUser._id.toString());
    res.status(201).json({
      token,
      user: serializeUser(newUser)
    });
  } catch (err) {
    next(err);
  }
};


export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ error: 'Invalid email or password' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({ error: 'Invalid email or password' });
            return;
        }
        const token = generateToken(user._id.toString());
        res.status(200).json({
            token,
            user: serializeUser(user)
        });
    } catch (error) {
        next(error);
    }
};

export const loginWithGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      res.status(500).json({ error: 'Google login is not configured' });
      return;
    }

    try {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );

      if (!verifyRes.ok) {
        res.status(401).json({ error: 'Invalid Google credential' });
        return;
      }

      const payload = (await verifyRes.json()) as {
        aud?: string;
        email?: string;
        sub?: string;
        email_verified?: string;
      };

      if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        res.status(401).json({ error: 'Google credential audience mismatch' });
        return;
      }

      const email = payload.email?.toLowerCase();
      const googleId = payload.sub;

      if (!email || !googleId) {
        res.status(400).json({ error: 'Google account is missing required profile data' });
        return;
      }

      let user = await User.findOne({ email });

      if (user && user.authProvider === 'local' && !user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      if (!user) {
        const existingUserCount = await User.countDocuments();
        user = new User({
          email,
          password: crypto.randomBytes(24).toString('hex'),
          authProvider: 'google',
          googleId,
          isAdmin: shouldGrantAdminOnRegister(email, existingUserCount),
          hasChangedPassword: true,
        });
        await user.save();
      }

      const token = generateToken(user._id.toString());
      res.status(200).json({
        token,
        user: serializeUser(user),
      });
    } catch (error) {
      next(error);
    }
};

export const updatePassword = async (req:AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
    const {oldPassword, newPassword} = req.body;
    const userId = req.userId;

    try {
        const user = await User.findById(userId);
        if(!user){
            res.status(404).json({error: 'User not found'});
            return;
        }
        const isMatch = await user?.comparePassword(oldPassword);
        if(!isMatch){
            res.status(400).json({error: 'Invalid old password'});
            return;
        }
        user.password = newPassword;
        user.markModified('password');
        await user?.save();

        res.status(200).json({message: 'Password updated'})
    } catch (error) {
        next(error);
    }
} 

export const getUserProfile = async (req: AuthenticateRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const getCurrentUser = async (
  req: AuthenticateRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticateRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const {
    companyName,
    companyLogo,
    companyAddress,
    companyPhone,
    companyPhone2,
    companyEmail,
    companyWebsite,
    companyId
  } = req.body;

  if (
    companyName === undefined &&
    companyLogo === undefined &&
    companyAddress === undefined &&
    companyPhone === undefined &&
    companyPhone2 === undefined &&
    companyEmail === undefined &&
    companyWebsite === undefined &&
    companyId === undefined
  ) {
    res.status(400).json({ error: 'No profile fields provided for update' });
    return;
  }

  try {
    const updates: Partial<{
      companyName: string;
      companyLogo: string;
      companyAddress: string;
      companyPhone: string;
      companyPhone2: string;
      companyEmail: string;
      companyWebsite: string;
      companyId: string;
    }> = {};

    if (companyName !== undefined) updates.companyName = companyName;
    if (companyLogo !== undefined) updates.companyLogo = companyLogo;
    if (companyAddress !== undefined) updates.companyAddress = companyAddress;
    if (companyPhone !== undefined) updates.companyPhone = companyPhone;
    if (companyPhone2 !== undefined) updates.companyPhone2 = companyPhone2;
    if (companyEmail !== undefined) updates.companyEmail = companyEmail;
    if (companyWebsite !== undefined) updates.companyWebsite = companyWebsite;
    if (companyId !== undefined) updates.companyId = companyId;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      token: null,
      user: serializeUser(user)
    });
  } catch (err) {
    next(err);
  }
};


export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const token = generateResetToken(user._id.toString());

    const frontEndUrl = process.env.FRONTEND_URL;
    if (!frontEndUrl) {
      throw new Error('FRONTEND_URL is not defined in env');
    }
    const resetUrl = `${frontEndUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `To reset your password, visit: ${resetUrl}`,
      html: `
        <p>שלום ${user.companyName || ''},</p>
        <p>לשינוי הסיסמה לחצ/י <a href="${resetUrl}">כאן</a>. הקישור פג תוקף ב‑15 דקות.</p>
        <p>אם הלחצן לא עובד, העתק/י והדבק/י את הקישור:</p>
        <pre>${resetUrl}</pre>
      `,
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {               
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }
  try {
    const { userId } = verifyResetToken(token);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password too short' });
    }
    user.password = password;
    await user.save();
    return res.status(200).json({ message: 'Password has been reset' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const changedPassword = async (
  req: AuthenticateRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.hasChangedPassword = true;
    await user.save();
    res.status(200).json({ message: 'Password change status updated' });
  } catch (err) {
    next(err);
  }
};

export const acceptedTerms = async (
  req: AuthenticateRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.hasAcceptedTerms = true;
    await user.save();
    res.status(200).json({ message: 'Terms accepted' });  
  } catch (err) {
    next(err);
  }
};
