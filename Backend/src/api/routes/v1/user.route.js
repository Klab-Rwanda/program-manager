import { Router } from 'express';
import * as userController from '../../controllers/user.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

// --- SELF-SERVICE ROUTES for the logged-in user ---
// These routes are checked first and are accessible to any authenticated user.

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [User (Self-Service)]
 *     summary: Get current user's profile
 *     description: Retrieves the profile details of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'Successfully retrieved user profile.' }
 *       401: { description: 'Unauthorized, token is missing or invalid.' }
 */
router.route('/me').get(verifyJWT, userController.getCurrentUser);

/**
 * @openapi
 * /users/update-account:
 *   patch:
 *     tags: [User (Self-Service)]
 *     summary: Update own account details
 *     description: Allows the currently authenticated user to update their own profile information, such as their name.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: { name: { type: string, example: 'John Doe Updated' } }
 *     responses:
 *       200: { description: 'Account updated successfully.' }
 */
router.route('/update-account').patch(verifyJWT, userController.updateAccountDetails);

/**
 * @openapi
 * /users/change-password:
 *   post:
 *     tags: [User (Self-Service)]
 *     summary: Change own password
 *     description: Allows the currently authenticated user to change their password by providing their old and new passwords.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200: { description: 'Password changed successfully.' }
 *       401: { description: 'Invalid old password.' }
 */
router.route('/change-password').post(verifyJWT, userController.changeCurrentPassword);


// --- ADMIN & MANAGER ROUTES ---
// All routes under /manage are grouped here.
const manageRouter = Router();
manageRouter.use(verifyJWT);

// --- MOST SPECIFIC '/manage' ROUTES COME FIRST ---

/**
 * @openapi
 * /users/manage/list-by-role:
 *   get:
 *     tags: [User Management (Admin)]
 *     summary: Get all users of a specific role
 *     description: (SuperAdmin only) Retrieves a list of ALL users (including pending/inactive) filtered by a specific role. Useful for populating admin dropdowns.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: role, in: query, required: true, schema: { type: string, example: 'Program Manager' } }
 *     responses:
 *       200: { description: 'A list of users matching the role.' }
 */
manageRouter.route('/list-by-role').get(checkRole(['SuperAdmin', 'Program Manager']), userController.getUserListByRole);

/**
 * @openapi
 * /users/manage/onboarded:
 *   get:
 *     tags: [User Management (Admin)]
 *     summary: Get onboarded users
 *     description: (SuperAdmin & Program Manager) Retrieves a paginated list of users who have logged in at least once.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: limit, in: query, schema: { type: integer, default: 10 } }
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *     responses:
 *       200: { description: 'A paginated list of onboarded users.' }
 */
manageRouter.route('/onboarded').get(checkRole(['SuperAdmin', 'Program Manager']), userController.getOnboardedUsers);

/**
 * @openapi
 * /users/manage/archived:
 *   get:
 *     tags: [User Management (Admin)]
 *     summary: Get all deactivated (archived) users
 *     description: (SuperAdmin only) Retrieves a list of all users who have been marked as inactive (`isActive: false`).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of archived users.' }
 */
manageRouter.route('/archived').get(checkRole(['SuperAdmin']), userController.getArchivedUsers);


// --- LESS SPECIFIC '/manage' ROUTE ---

/**
 * @openapi
 * /users/manage:
 *   get:
 *     tags: [User Management (Admin)]
 *     summary: Get all active users
 *     description: (SuperAdmin only) Retrieves a list of all active users in the system (`isActive: true`).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of active users.' }
 */
manageRouter.route('/').get(checkRole(['SuperAdmin', 'Program Manager']), userController.getAllUsers);


// --- GENERIC, PARAMETERIZED '/manage' ROUTES COME LAST ---

/**
 * @openapi
 * /users/manage/{id}:
 *   get:
 *     tags: [User Management (Admin)]
 *     summary: Get a single user by ID
 *     description: (SuperAdmin only) Retrieves the full details of a single user, including their assigned programs and recent activity feed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, description: 'The ID of the user.' }
 *     responses:
 *       200: { description: 'User details fetched successfully.' }
 *       404: { description: 'User not found.' }
 */
manageRouter.route('/:id').get(checkRole(['SuperAdmin']), userController.getUserById);

/**
 * @openapi
 * /users/manage/{id}/status:
 *   patch:
 *     tags: [User Management (Admin)]
 *     summary: Activate or deactivate a user
 *     description: (SuperAdmin only) Updates a user's `isActive` status. `false` prevents login, `true` re-enables login.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: { isActive: { type: boolean, example: false } }
 *     responses:
 *       200: { description: 'User status updated successfully.' }
 */
manageRouter.route('/:id/status').patch(checkRole(['SuperAdmin']), userController.updateUserStatus);

/**
 * @openapi
 * /users/manage/{id}/facilitator-profile:
 *   patch:
 *     tags: [User Management (Admin)]
 *     summary: Update facilitator profile details
 *     description: (SuperAdmin & Program Manager) Updates facilitator-specific profile information like phone, specialization, experience, rating, etc.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone: { type: string, example: '+1234567890' }
 *               specialization: { type: string, example: 'Web Development' }
 *               experience: { type: string, example: '5 years' }
 *               rating: { type: number, minimum: 0, maximum: 5, example: 4.5 }
 *               github: { type: string, example: 'https://github.com/username' }
 *               type: { type: string, enum: ['regular', 'promoted'], example: 'regular' }
 *               previousProgram: { type: string, example: 'Data Science Program' }
 *               promotionDate: { type: string, format: date, example: '2024-01-15' }
 *     responses:
 *       200: { description: 'Facilitator profile updated successfully.' }
 *       400: { description: 'Invalid data or user is not a facilitator.' }
 *       404: { description: 'User not found.' }
 */
manageRouter.route('/:id/facilitator-profile').patch(checkRole(['SuperAdmin', 'Program Manager']), userController.updateFacilitatorProfile);

// Mount all the management routes under the /manage path
router.use('/manage', manageRouter);
router.route('/managers').get(verifyJWT, checkRole(['SuperAdmin']), userController.getAllManagers);

export default router;