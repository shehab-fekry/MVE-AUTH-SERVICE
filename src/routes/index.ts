import express from 'express';
import { signin, signup } from '../controllers/index.js';

const router = express.Router();

router.get('/signin', signin);
router.get('/signup', signup);

export default router;
