import express from 'express';
import {
  userVerification,
  userRegisteration,
  userLogin,
  forgotUserPassword,
  verifyForgotUserPassword,
  resetUserPassword,
  refreshToken,
  userInfo,
} from '../controllers/index.js';
import isAuthenticated from '../utils/middlewares/is-authenticated.js';

const router = express.Router();

router.post('/user-registeration', userRegisteration);
router.post('/user-verification', userVerification);
router.post('/user-login', userLogin);
router.post('/forgot-user-password', forgotUserPassword);
router.post('/verify-forgot-user-password', verifyForgotUserPassword);
router.post('/reset-user-password', resetUserPassword);
router.get('/refresh-token', refreshToken);
router.get('/user-info', isAuthenticated, userInfo);

export default router;
