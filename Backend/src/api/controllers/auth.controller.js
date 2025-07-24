import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { sendRegistrationEmail, sendPasswordResetEmail, sendPasswordChangeConfirmationEmail } from "../../services/email.service.js";
import { createLog } from "../../services/log.service.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;

  const generatedPassword = Math.random().toString(36).slice(-8);

  if (!name || !email || !role) {
    throw new ApiError(400, "Name, email, and role are required fields.");
  }

  if (req.user) {
    if (req.user.role === "Program Manager") {
      if (role !== "Facilitator" && role !== "Trainee") {
        throw new ApiError(
          403,
          "Forbidden: Program Managers can only register Facilitators or Trainees."
        );
      }
    }
  } else {
    const userCount = await User.countDocuments();
    if (userCount > 0 && role !== "Trainee") {
      throw new ApiError(
        403,
        "Forbidden: Only an existing admin or manager can create new users."
      );
    }
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password: generatedPassword,
    role,
  });
  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  await createLog({
    user: req.user._id,
    action: "USER_CREATED",
    details: `Created new user: ${user.name} (${user.email}) with role ${user.role}.`,
    entity: { id: user._id, model: "User" },
  });

  sendRegistrationEmail(email, name, generatedPassword).catch((err) =>
    console.error("Email sending failed after user creation:", err)
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser,
        "User registered successfully. Login credentials have been sent to their email."
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    throw new ApiError(404, "User does not exist or has been deactivated.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const now = new Date();
  let needsSave = false;

  if (!user.firstLogin) {
    user.firstLogin = now;
    needsSave = true;
  }

  if (user.status === "Pending") {
    user.status = "Active";
    needsSave = true;
  }

  user.lastLogin = now;
  needsSave = true;

  if (needsSave) {
    await user.save({ validateBeforeSave: false });
  }

  const accessToken = user.generateAccessToken();
  const loggedInUser = await User.findById(user._id).select("-password");

  await createLog({
    user: user._id,
    action: "USER_LOGIN",
    details: `User ${user.name} logged into the system.`,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "User logged in successfully"
      )
    );
});

// FORGOT PASSWORD - Using asyncHandler for consistency
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Check if user exists and is active
  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    throw new ApiError(404, "User with this email does not exist or has been deactivated");
  }

  // Generate password reset token
  const resetToken = jwt.sign(
    { 
      email: user.email, 
      userId: user._id,
      type: 'password_reset'
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Send password reset email
  try {
    await sendPasswordResetEmail(email, user.name, resetToken);
    
    // Log the password reset request
    await createLog({
      user: user._id,
      action: "PASSWORD_RESET_REQUESTED",
      details: `Password reset requested for user: ${user.email}`,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "Password reset link has been sent to your email"
        )
      );
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new ApiError(500, "Failed to send password reset email");
  }
});

// UPDATE PASSWORD - Using asyncHandler for consistency
const updatePassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirm } = req.body;

  // Validate inputs
  if (!newPassword || !confirm) {
    throw new ApiError(400, "Both new password and confirm password are required");
  }

  if (newPassword !== confirm) {
    throw new ApiError(400, "Passwords do not match");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  try {
    // Verify the reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'password_reset') {
      throw new ApiError(400, "Invalid token type");
    }

    // Find the user
    const user = await User.findOne({ 
      email: decoded.email, 
      _id: decoded.userId,
      isActive: true 
    });

    if (!user) {
      throw new ApiError(404, "User not found or has been deactivated");
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save({ validateBeforeSave: false });

    // Log the password reset
    await createLog({
      user: user._id,
      action: "PASSWORD_RESET_COMPLETED",
      details: `Password successfully reset for user: ${user.email}`,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Password updated successfully. You can now log in with your new password."
      )
    );

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new ApiError(400, "Invalid or expired reset token");
    }
    throw error;
  }
});


// CHANGE PASSWORD (for authenticated users)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Verify current password
  const isCurrentPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Hash and update new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save({ validateBeforeSave: false });

  // Log password change
  await createLog({
    user: user._id,
    action: "PASSWORD_CHANGED",
    details: `Password changed by user: ${user.email}`,
  });

  // Send confirmation email (non-blocking)
  sendPasswordChangeConfirmationEmail(user.email, user.name).catch((err) =>
    console.error("Password change confirmation email failed:", err)
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password changed successfully. A confirmation email has been sent."
      )
    );
});

// LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
  // Log the logout action
  await createLog({
    user: req.user._id,
    action: "USER_LOGOUT",
    details: `User ${req.user.name} logged out of the system.`,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "User logged out successfully"
      )
    );
});

export { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  updatePassword, 
  changePassword,
  logoutUser 
};