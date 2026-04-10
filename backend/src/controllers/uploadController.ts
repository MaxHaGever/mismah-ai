import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { User } from '../models/User';
import { AuthenticateRequest } from '../middleware/authMiddleware';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only PNG, JPG, and WEBP are allowed.'));
  }
};  

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = file.fieldname === 'logo' ? 'logos' : 'images';
    const uploadPath = path.resolve(process.cwd(), 'uploads', folderName);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

export const upload = multer({ storage, fileFilter });

export const uploadLogo = async (req: AuthenticateRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const url = `/uploads/logos/${req.file.filename}`;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.companyLogo = url;
  await user.save();

  res.status(201).json({ url });
};

export const uploadImages = async (req: AuthenticateRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  let descriptions: string[] = [];
  if (req.body.descriptions) {
    try {
      descriptions = JSON.parse(req.body.descriptions);
      if (!Array.isArray(descriptions)) descriptions = [];
    } catch {
      descriptions = [];
    }
  }

  const images = files.map((file, idx) => ({
    url: `/uploads/images/${file.filename}`,
    description: descriptions[idx] || ''
  }));

  res.status(201).json({ images });
};