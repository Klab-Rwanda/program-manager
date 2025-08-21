import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { sendRegistrationEmail, sendPasswordResetEmail, sendPasswordChangeConfirmationEmail } from "../../services/email.service.js";
import { createLog } from "../../services/log.service.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import { createNotification } from "../../services/notification.service.js";
import xlsx from 'xlsx'; // NEW: Import xlsx
import fs from 'fs/promises'; // NEW: Import fs.promises for file cleanup

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

    const superAdmins = await User.find({ role: 'SuperAdmin' });
    for (const admin of superAdmins) {
        if (admin._id.toString() !== req.user._id.toString()) {
            await createNotification({
                recipient: admin._id,
                sender: req.user._id,
                title: "New User Registered",
                message: `${req.user.name} created a new ${user.role} account for ${user.name}.`,
                link: `/dashboard/SuperAdmin/user-management`,
                type: 'info'
            });
        }
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


// NEW: Bulk Register Users from Excel/CSV
const bulkRegisterUsers = asyncHandler(async (req, res) => {
    // Ensure file is present
    if (!req.file) {
        throw new ApiError(400, "Excel/CSV file is required for bulk registration.");
    }

    const { targetRole = 'Trainee' } = req.body; // Default to Trainee if not specified in form/body

    // Ensure only Program Managers can register Trainees
    if (req.user.role === "Program Manager" && targetRole !== "Trainee") {
        throw new ApiError(403, "Forbidden: Program Managers can only bulk register Trainees.");
    }
    // Only SuperAdmins can register other roles via bulk upload (if you want to support bulk Fac/PM upload)
    if (req.user.role !== "SuperAdmin" && req.user.role !== "Program Manager") {
         throw new ApiError(403, "Forbidden: Only Program Managers or Super Admins can bulk register users.");
    }

    const filePath = req.file.path;
    let workbook;
    try {
        workbook = xlsx.readFile(filePath);
    } catch (readError) {
        console.error("Error reading file:", readError);
        throw new ApiError(400, "Could not read file. Ensure it's a valid Excel/CSV format.");
    } finally {
        // Clean up the uploaded file
        await fs.unlink(filePath).catch(err => console.error("Failed to delete temp file:", err));
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to JSON, starting from 2nd row (skipping headers)
    const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false }); // raw: false to keep string values

    if (jsonData.length < 2) { // Only header row or empty file
        throw new ApiError(400, "File is empty or contains only headers. Please provide data.");
    }

    const headers = jsonData[0]; // Assuming first row is headers
    const usersToRegister = jsonData.slice(1); // Actual data starts from second row

    const results = {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        errors: []
    };

    const registrationPromises = usersToRegister.map(async (row, index) => {
        results.totalProcessed++;
        // Assuming columns are Name, Email. You might need to adjust indices.
        // Example: If headers are ['Full Name', 'Email Address', 'Gender', 'Phone']
        const nameIndex = headers.indexOf('Name') !== -1 ? headers.indexOf('Name') : headers.indexOf('Full Name');
        const emailIndex = headers.indexOf('Email') !== -1 ? headers.indexOf('Email') : headers.indexOf('Email Address');
        const genderIndex = headers.indexOf('Gender'); // Optional
        const phoneIndex = headers.indexOf('Phone'); // Optional

        const name = row[nameIndex]?.trim();
        const email = row[emailIndex]?.trim()?.toLowerCase();

        // Validate basic fields from the spreadsheet
        if (!name || !email) {
            results.failed++;
            results.errors.push({ row: index + 2, message: "Missing Name or Email.", data: row });
            return null;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            results.failed++;
            results.errors.push({ row: index + 2, message: `Invalid email format: ${email}.`, data: row });
            return null;
        }

        const generatedPassword = Math.random().toString(36).slice(-8);

        try {
            const existedUser = await User.findOne({ email });
            if (existedUser) {
                results.failed++;
                results.errors.push({ row: index + 2, message: `User with email ${email} already exists.`, data: row });
                return null;
            }

            const newUser = await User.create({
                name,
                email,
                password: generatedPassword,
                role: targetRole, // Assign the role from input or default
                // You can map other fields like gender, phone if present in your User model
                ...(genderIndex !== -1 && { gender: row[genderIndex]?.trim() }),
                ...(phoneIndex !== -1 && { phone: row[phoneIndex]?.trim() })
            });

            // Send registration email
            sendRegistrationEmail(email, name, generatedPassword).catch((err) =>
                console.error(`Email failed for ${email} during bulk registration:`, err)
            );

            // Create notification for SuperAdmins (similar to single registration)
            const superAdmins = await User.find({ role: 'SuperAdmin' });
            for (const admin of superAdmins) {
                // Don't notify the admin if they are creating the user themselves
                if (admin._id.toString() !== req.user._id.toString()) {
                    await createNotification({
                        recipient: admin._id,
                        sender: req.user._id,
                        title: "New User Registered (Bulk)",
                        message: `${req.user.name} bulk registered a new ${targetRole} account for ${name}.`,
                        link: `/dashboard/SuperAdmin/user-management`,
                        type: 'info'
                    });
                }
            }
            
            // Log the action for each successful user
            await createLog({
                user: req.user._id,
                action: "USER_CREATED_BULK",
                details: `Bulk registered user: ${name} (${email}) with role ${targetRole}.`,
                entity: { id: newUser._id, model: "User" },
            });

            results.successful++;
            return newUser;
        } catch (innerError) {
            results.failed++;
            console.error(`Error processing row ${index + 2} (${email}):`, innerError);
            results.errors.push({
                row: index + 2,
                message: `Registration failed: ${innerError.message || 'Unknown error.'}`,
                data: row
            });
            return null;
        }
    });

    await Promise.allSettled(registrationPromises); // Wait for all promises to settle

    let message = `Bulk registration complete: ${results.successful} successful, ${results.failed} failed.`;
    if (results.errors.length > 0) {
        message += ` Check errors for details.`;
    }

    return res.status(results.failed > 0 ? 202 : 201).json(
        new ApiResponse(
            results.failed > 0 ? 202 : 201, // 202 Accepted for partial success
            results,
            message
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


   await createNotification({
        recipient: user._id,
        sender: user._id, // Self-notification
        title: "Password Changed",
        message: "Your account password has been successfully updated.",
        link: "/dashboard/profile", // Link to their profile/settings
        type: 'success'
    });
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
  logoutUser,
  bulkRegisterUsers // NEW: Export bulkRegisterUsers
};