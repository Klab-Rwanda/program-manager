import { Router } from 'express';
import * as exportController from '../../controllers/export.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT, checkRole(['SuperAdmin', 'Program Manager']));

/**
 * @openapi
 * /export/programs/pdf:
 *   get:
 *     tags: [Export]
 *     summary: Export all programs as PDF
 *     description: (SuperAdmin or Program Manager) Exports all accessible programs as a PDF report.
 *     security: { bearerAuth: [] }
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.route('/programs/pdf').get(exportController.exportProgramsPDF);

/**
 * @openapi
 * /export/programs/excel:
 *   get:
 *     tags: [Export]
 *     summary: Export all programs as Excel
 *     description: (SuperAdmin or Program Manager) Exports all accessible programs as an Excel file.
 *     security: { bearerAuth: [] }
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.route('/programs/excel').get(exportController.exportProgramsExcel);

/**
 * @openapi
 * /export/archived/pdf:
 *   get:
 *     tags: [Export]
 *     summary: Export archived programs as PDF
 *     description: (SuperAdmin or Program Manager) Exports all archived programs as a PDF report.
 *     security: { bearerAuth: [] }
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.route('/archived/pdf').get(exportController.exportArchivedPDF);

/**
 * @openapi
 * /export/archived/excel:
 *   get:
 *     tags: [Export]
 *     summary: Export archived programs as Excel
 *     description: (SuperAdmin or Program Manager) Exports all archived programs as an Excel file.
 *     security: { bearerAuth: [] }
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.route('/archived/excel').get(exportController.exportArchivedExcel);

/**
 * @openapi
 * /export/programs/{id}/pdf:
 *   get:
 *     tags: [Export]
 *     summary: Export single program as PDF
 *     description: (SuperAdmin or Program Manager) Exports a single program as a PDF report.
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Program not found
 */
router.route('/programs/:id/pdf').get(exportController.exportSingleProgramPDF);

/**
 * @openapi
 * /export/bulk:
 *   post:
 *     tags: [Export]
 *     summary: Bulk export with filters
 *     description: (SuperAdmin or Program Manager) Exports programs with custom filters in PDF or Excel format.
 *     security: { bearerAuth: [] }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [pdf, excel]
 *                 default: excel
 *               filters:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *                   includeArchived:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: File download (PDF or Excel)
 *       400:
 *         description: Invalid filter parameters
 */
router.route('/bulk').post(exportController.bulkExport);

/**
 * @openapi
 * /export/custom:
 *   post:
 *     tags: [Export]
 *     summary: Custom export with template
 *     description: (SuperAdmin or Program Manager) Exports data using a custom template in PDF or Excel format.
 *     security: { bearerAuth: [] }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [pdf, excel]
 *                 default: excel
 *               template:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   name:
 *                     type: string
 *                   columns:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         header:
 *                           type: string
 *                         key:
 *                           type: string
 *                         width:
 *                           type: number
 *               dataType:
 *                 type: string
 *                 enum: [programs, archived]
 *                 default: programs
 *     responses:
 *       200:
 *         description: File download (PDF or Excel)
 *       400:
 *         description: Invalid template parameters
 */
router.route('/custom').post(exportController.customExport);

router.route('/logs')
    .post(checkRole(['SuperAdmin']), exportController.exportLogs);

    router.route('/attendance/program/:programId').get(exportController.exportProgramAttendance);

export default router; 