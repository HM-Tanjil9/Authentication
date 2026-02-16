import express from 'express';
import { loginUser, registerUser, verifyEmail, verifyOtp } from '../controllers/user.js';

const router = express.Router();


// @route   POST /api/v1/register
// @desc    Register a new user & send verification email
// @access  Public
router.post('/register', registerUser);
router.post('/verify/:token', verifyEmail);

// @route   POST /api/v1/login
// @desc    Login user & verify with otp
// @access  Public
router.post('/login', loginUser);
router.post('/verify', verifyOtp); 

export default router;