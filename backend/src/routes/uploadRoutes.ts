import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { upload, uploadLogo, uploadImages } from '../controllers/uploadController';

const router = Router();

router.post(
  '/logo',
  protect,
  upload.single('logo'),
  uploadLogo
);

router.post(
  '/images',
  protect,
  upload.array('images', 5),
  uploadImages
);

export default router;