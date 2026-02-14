import { registerUserSchema } from "../config/zod.js";
import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";

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

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      name,
      email,
      password
    },
  });
});


export {
  registerUser
}