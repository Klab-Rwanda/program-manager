import { Router } from 'express';
import { 
  loginUser, 
  registerUser, 
  forgotPassword, 
  updatePassword, 
  changePassword, 
  logoutUser, 
  bulkRegisterUsers
} from '../../controllers/auth.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Allows a logged-in SuperAdmin or Program Manager to create a new user. The password is auto-generated and sent via email. Program Managers can only create Trainees and Facilitators.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'New Trainee'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'trainee.new@klab.com'
 *               role:
 *                 type: string
 *                 enum: [Trainee, Facilitator, "Program Manager", SuperAdmin]
 *                 example: 'Trainee'
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Bad request, missing required fields.
 *       403:
 *         description: Forbidden, user does not have permission to register this role.
 *       409:
 *         description: Conflict, a user with this email already exists.
 */
router.route('/register').post(verifyJWT, checkRole(['SuperAdmin', 'Program Manager']), registerUser);

router.route('/bulk-register').post(verifyJWT, checkRole(['SuperAdmin', 'Program Manager']), upload.single('file'), bulkRegisterUsers);
router.route('/login').post(loginUser);


router.post("/forgot-password", forgotPassword);

/**
 * @openapi
 * /auth/reset-password/{token}:
 *   put:
 *     tags: [Authentication]
 *     summary: Reset password using token
 *     description: Resets the user's password using a valid reset token received via email.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The password reset token from the email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: 'newSecurePassword123'
 *                 description: The new password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully. You can now log in with your new password."
 *       400:
 *         description: Bad request - invalid token, expired token, or password requirements not met.
 *       404:
 *         description: User not found or has been deactivated.
 */
router.put("/reset-password/:token", updatePassword);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Change password for authenticated user
 *     description: Allows an authenticated user to change their current password by providing their current password and a new password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: 'currentPassword123'
 *                 description: The user's current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: 'newSecurePassword123'
 *                 description: The new password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully. A confirmation email has been sent."
 *       400:
 *         description: Bad request - missing fields or password requirements not met.
 *       401:
 *         description: Current password is incorrect or user not authenticated.
 *       404:
 *         description: User not found.
 */
router.post("/change-password", verifyJWT, changePassword);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Log out user
 *     description: Logs out the authenticated user and records the logout action in the system logs.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User logged out successfully"
 *       401:
 *         description: User not authenticated.
 */
router.post("/logout", verifyJWT, logoutUser);

export default router;