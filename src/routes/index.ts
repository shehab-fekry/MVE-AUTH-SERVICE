import express from 'express';
import {
  userVerification,
  userRegisteration,
  userLogin,
  forgotUserPassword,
  verifyForgotUserPassword,
  resetUserPassword,
} from '../controllers/index.js';

const router = express.Router();

router.post('/user-registeration', userRegisteration);
router.post('/user-verification', userVerification);
router.post('/user-login', userLogin);
router.post('/forgot-user-password', forgotUserPassword);
router.post('/verify-forgot-user-password', verifyForgotUserPassword);
router.post('/reset-user-password', resetUserPassword);

export default router;
