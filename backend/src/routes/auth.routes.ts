import { Router } from 'express';
import { 
  register, 
  login, 
  googleAuth,
  verifyOtp, 
  resendOtp, 
  getProfile, 
  updateProfile, 
  changePassword, 
  requestPasswordOtp,
  verifyPasswordOtp,
  resetPasswordWithOtp,
  logout,
  requestDeleteAccountOtp,
  confirmDeleteAccount
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);
router.post('/request-password-otp', requireAuth, requestPasswordOtp);
router.post('/verify-password-otp', requireAuth, verifyPasswordOtp);
router.put('/reset-password-with-otp', requireAuth, resetPasswordWithOtp);
router.post('/request-delete-account-otp', requireAuth, requestDeleteAccountOtp);
router.post('/confirm-delete-account', requireAuth, confirmDeleteAccount);
router.post('/logout', logout);

export default router;

