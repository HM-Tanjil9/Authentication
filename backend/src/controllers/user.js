import { loginUserSchema, registerUserSchema } from "../config/zod.js";
import { redisClient } from "../index.js";
import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";
import User  from "../models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { getOtpHtml, getVerifyEmailHtml } from "../config/emailTemplates.js";
import { generateAccessToken, generateToken, revokeRefreshToken, verifyRefreshToken } from "../config/generateToken.js";
import { generateCSRFToken, refreshCSRFToken } from "../config/csrfMiddlewares.js";

export const registerUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = registerUserSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const zodError = validation.error;
    let firstErrorMessage = "Validation failed";
    let allErrorMessages = [];
    if(zodError?.issues && Array.isArray(zodError.issues)) {
      allErrorMessages = zodError.issues.map(issue => ({
        field: issue.path?.join(".") || "unknown",
        message: issue.message || "Validation error",
        code: issue.code || "zod_validation_error"
      }));
      firstErrorMessage = allErrorMessages[0]?.message || "Validation error";
    }
    return res.status(400).json({
      success: false,
      message: firstErrorMessage,
      errors: allErrorMessages
    });
  }

  const { name, email, password } = validation.data;

  const rateLimitKey = `register-rate-limit:${req.ip}:${email}`;
  if(await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      success: false,
      message: "Too many registration attempts. Please try again later."
    });
  }

  const existingUser = await User.findOne({ email });
  if(existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verifyToken = crypto.randomBytes(32).toString("hex");

  const verifyKey = `verify:${verifyToken}`;

  const newUser = JSON.stringify({
    name,
    email,
    password: hashedPassword
  });

  await redisClient.set(verifyKey, newUser, { EX: 300 }); // Expire in 5 minutes

  const subject = "Verify Your Email for Account Registration";
  const html = getVerifyEmailHtml({ email, token: verifyToken });
  await sendMail({
    email,
    subject,
    html
  });

  await redisClient.set(rateLimitKey, "true", { EX: 60 }); // Rate limit for 1 minute
  
  res.json({
    success: true,
    message: "A verification email has been sent to your email address. Please verify to complete registration. It will expire in 5 minutes.",
  });
});

export const verifyEmail = TryCatch(async (req, res) => {
  const { token } = req.params;
  if(!token) {
    return res.status(400).json({
      success: false,
      message: "Verification token is required"
    });
  }

  const verifyKey = `verify:${token}`;
  const userDataJson = await redisClient.get(verifyKey);
  
  if(!userDataJson) {
    return res.status(400).json({
      success: false,
      message: "Verification link has been expired or invalid token"
    });
  }
  await redisClient.del(verifyKey);

  const userData = JSON.parse(userDataJson);

  const existingUser = await User.findOne({ email: userData.email });
  if(existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists"
    });
  }

  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password
  });

  res.status(201).json({
    success: true,
    message: "Email verified and your account has been registered successfully",
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email
    }
  });
});


export const loginUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = loginUserSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const zodError = validation.error;
    let firstErrorMessage = "Validation failed";
    let allErrorMessages = [];
    if(zodError?.issues && Array.isArray(zodError.issues)) {
      allErrorMessages = zodError.issues.map(issue => ({
        field: issue.path?.join(".") || "unknown",
        message: issue.message || "Validation error",
        code: issue.code || "zod_validation_error"
      }));
      firstErrorMessage = allErrorMessages[0]?.message || "Validation error";
    }
    return res.status(400).json({
      success: false,
      message: firstErrorMessage,
      errors: allErrorMessages
    });
  }

  const { email, password } = validation.data;

  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;
  if(await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again later."
    });
  }

  const user = await User.findOne({ email });
  if(!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  const comparePassword = await bcrypt.compare(password, user.password);
  if(!comparePassword) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, JSON.stringify(otp), { EX: 300 }); // Expire in 5 minutes

  const subject = "Your OTP for verification";
  const html = getOtpHtml({email, otp});
  await sendMail({
    email,
    subject,
    html
  });
  
  await redisClient.set(rateLimitKey, "true", { EX: 60 }); // Rate limit for 1 minute

  res.json({
    success: true,
    message: "An OTP has been sent to your email address. Please verify to complete login. It will expire in 5 minutes.",
  })

});

export const verifyOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;
  
  if(!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
  }

  const otpKey = `otp:${email}`;
  const storedOtpString = await redisClient.get(otpKey);
  if(!storedOtpString) {
    return res.status(400).json({
      success: false,
      message: "OTP has been expired"
    });
  }
  
  const storedOtp = JSON.parse(storedOtpString);

  if(storedOtp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });
  }

  await redisClient.del(otpKey);

  let user = await User.findOne({ email });

  const tokenData = await generateToken(user._id, res);

  res.status(200).json({
    success: true,
    message: `Welcome back, ${user.name}! You have been logged in successfully.`,
    user
  });
});

export const myProfile = TryCatch(async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    user
  });
});

export const refreshToken = TryCatch(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if(!refreshToken) {
    return res.status(401).json({ message: 'Unauthorized: No refresh token provided' });
  }

  const decodedData = await verifyRefreshToken(refreshToken);
  
  if (!decodedData) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  generateAccessToken(decodedData.id, res);

  res.status(200).json({ message: 'Access token refreshed successfully' });

});

export const logoutUser = TryCatch(async (req, res) => {
  const userId = req.user._id;
  await revokeRefreshToken(userId);
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('csrfToken');
  await redisClient.del(`user:${userId}`);
  res.json({
    success: true,
    message: "You have been logged out successfully"
  });
});

export const refreshCSRF = TryCatch(async (req, res) => {
  const userId = req.user._id;
  const newCsrfToken = await generateCSRFToken(userId, res);
  res.json({
    success: true,
    message: "CSRF token refreshed successfully",
    csrfToken: newCsrfToken
  });
});

export const adminController = TryCatch(async (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the admin route, you have admin access"
  });
})