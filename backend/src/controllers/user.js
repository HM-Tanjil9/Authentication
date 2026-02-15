import { registerUserSchema } from "../config/zod.js";
import { redisClient } from "../index.js";
import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";
import User  from "../models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { getVerifyEmailHtml } from "../config/emailTemplates.js";

const registerUser = TryCatch(async (req, res) => {
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


export {
  registerUser
}