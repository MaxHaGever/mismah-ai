import express from 'express';
import { register, login, loginWithGoogle, updatePassword, updateProfile, forgotPassword, resetPassword, changedPassword, acceptedTerms, getCurrentUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { body } from 'express-validator';

const router = express.Router();

router.post('/register', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validateRequest
], register);
router.post('/login', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
], login);
router.post('/google', [
    body('credential').notEmpty().withMessage('Google credential is required'),
    validateRequest
], loginWithGoogle);
router.patch('/update-password', protect, [
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
    validateRequest
], updatePassword);
router.patch(
  '/update-profile',
  protect,
  updateProfile
);
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Invalid email'),
    validateRequest
], forgotPassword);
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    validateRequest
  ],
  resetPassword
);
router.post('/changed-password', protect, changedPassword);
router.post('/accepted-terms', protect, acceptedTerms);
router.get('/me', protect, getCurrentUser);


export default router;
