import { Router } from 'express';
import * as certController from '../../controllers/certificate.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /certificates/issue:
 *   post:
 *     tags: [Certificates]
 *     summary: Issue a new certificate
 *     description: (Program Manager, SuperAdmin) Issues a certificate of completion to a trainee for a specific program.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               programId: { type: string, example: "6543210abcdef123456789" }
 *               traineeId: { type: string, example: "9876543fedcba0123456789" }
 *     responses:
 *       201: { description: 'Certificate issued successfully.' }
 *       400: { description: 'Bad request (missing fields, trainee not enrolled).' }
 *       403: { description: 'Forbidden (not program manager).' }
 *       404: { description: 'Program not found.' }
 *       409: { description: 'Certificate already exists for this user and program.' }
 */
router.route('/issue').post(checkRole(['Program Manager', 'SuperAdmin']), certController.issueCertificate);

/**
 * @openapi
 * /certificates:
 *   get:
 *     tags: [Certificates]
 *     summary: Get all certificates (Program Manager, SuperAdmin)
 *     description: (Program Manager, SuperAdmin) Retrieves a list of all certificates. Program Managers see only certificates for programs they manage.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of all certificates.' }
 */
router.route('/').get(checkRole(['Program Manager', 'SuperAdmin']), certController.getAllCertificates);

/**
 * @openapi
 * /certificates/me:
 *   get:
 *     tags: [Certificates]
 *     summary: Get my certificates (Trainee)
 *     description: (Trainee only) Retrieves a list of all certificates earned by the currently logged-in trainee.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of earned certificates.' }
 */
router.route('/my-certificates').get(checkRole(['Trainee']), certController.getMyCertificates);

/**
 * @openapi
 * /certificates/eligible-students:
 *   get:
 *     tags: [Certificates]
 *     summary: Get students eligible for certificates
 *     description: (Program Manager, SuperAdmin) Retrieves a list of students who have completed programs and meet eligibility criteria (e.g., score, attendance).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of eligible students.' }
 */
router.route('/eligible-students').get(checkRole(['Program Manager', 'SuperAdmin']), certController.getStudentsEligibility);


router.route('/:id/download').get(checkRole(['Trainee', 'Program Manager', 'SuperAdmin']), certController.downloadCertificate);
router.route('/:id/resend-notification').post(checkRole(['Program Manager', 'SuperAdmin']), certController.resendCertificateNotification);

/**
 * @openapi
 * /certificates/templates:
 *   get:
 *     tags: [Certificates]
 *     summary: Get all certificate templates
 *     description: (Program Manager, SuperAdmin) Retrieves a list of available certificate templates.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of certificate templates.' }
 *   post:
 *     tags: [Certificates]
 *     summary: Create a new certificate template
 *     description: (Program Manager, SuperAdmin) Creates a new customizable certificate template.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Professional Achievement" }
 *               description: { type: string, example: "A template for general program completion." }
 *               style: { type: string, enum: [professional, modern, classic, minimalist], example: "professional" }
 *               colorScheme: { type: string, enum: [blue, gray, black, green, purple, red], example: "blue" }
 *               isDefault: { type: boolean, example: false }
 *               htmlContent: { type: string, example: "<div><h1>Certificate</h1>...</div>" }
 *     responses:
 *       201: { description: 'Template created successfully.' }
 *       400: { description: 'Bad request (missing fields).' }
 *       409: { description: 'Template name already exists.' }
 */
router.route('/templates')
    .get(checkRole(['Program Manager', 'SuperAdmin']), certController.getCertificateTemplates)
    .post(checkRole(['Program Manager', 'SuperAdmin']), certController.createCertificateTemplate);

/**
 * @openapi
 * /certificates/templates/:id
 *   patch:
 *     tags: [Certificates]
 *     summary: Update a certificate template
 *     description: (Program Manager, SuperAdmin) Updates an existing certificate template.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, description: 'ID of the template to update.' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               style: { type: string, enum: [professional, modern, classic, minimalist] }
 *               colorScheme: { type: string, enum: [blue, gray, black, green, purple, red] }
 *               isDefault: { type: boolean }
 *               htmlContent: { type: string }
 *     responses:
 *       200: { description: 'Template updated successfully.' }
 *       404: { description: 'Template not found.' }
 *       409: { description: 'Template name already exists.' }
 *   delete:
 *     tags: [Certificates]
 *     summary: Delete a certificate template
 *     description: (Program Manager, SuperAdmin) Deletes a certificate template. Cannot delete the default template.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, description: 'ID of the template to delete.' }
 *     responses:
 *       200: { description: 'Template deleted successfully.' }
 *       400: { description: 'Cannot delete default template.' }
 *       404: { description: 'Template not found.' }
 */
router.route('/templates/:id')
    .patch(checkRole(['Program Manager', 'SuperAdmin']), certController.updateCertificateTemplate)
    .delete(checkRole(['Program Manager', 'SuperAdmin']), certController.deleteCertificateTemplate);

export default router;