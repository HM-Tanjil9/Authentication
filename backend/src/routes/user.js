import express from 'express';
import { adminController, loginUser, logoutUser, myProfile, refreshCSRF, refreshToken, registerUser, verifyEmail, verifyOtp } from '../controllers/user.js';
import { authorizedAdmin, isAuth } from '../middlewares/isAuth.js';
import { verifyCSRFToken } from '../config/csrfMiddlewares.js';

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

router.get('/me', isAuth, myProfile);

router.post('/refresh', refreshToken);

router.post('/logout', isAuth, verifyCSRFToken, logoutUser);

router.post('/refresh-csrf', isAuth, refreshCSRF);

router.get('/admin', isAuth, authorizedAdmin, adminController);

export default router;