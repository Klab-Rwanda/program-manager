import { Router } from 'express';
import * as courseController from '../../controllers/course.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /courses:
 *   post:
 *     tags: [Courses]
 *     summary: Create a new course
 *     description: (Facilitator only) Creates a new course associated with a program and uploads its content document. The course starts in 'PendingApproval' status.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: "Module 1: Introduction to Node.js" }
 *               description: { type: string, example: "Covering the basics of Node.js, NPM, and async programming." }
 *               programId: { type: string }
 *               courseDocument:
 *                 type: string
 *                 format: binary
 *                 description: The PDF or document file for the course content.
 *     responses:
 *       201: { description: 'Course created and pending approval.' }
 *       400: { description: 'Bad request, document is required.' }
 */
router.route('/').post(
    checkRole(['Facilitator']), 
    upload.single('courseDocument'), 
    courseController.createCourse
);

/**
 * @openapi
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: Get all courses (curriculum files)
 *     description: Retrieves a list of all courses (curriculum files) for facilitators and program managers.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of courses.' }
 */
router.route('/').get(
    checkRole(['Facilitator', 'Program Manager']),
    courseController.getAllCourses
);

/**
 * @openapi
 * /courses/{courseId}/approve:
 *   patch:
 *     tags: [Courses]
 *     summary: Approve a course
 *     description: (Program Manager only) Approves a course, changing its status from 'PendingApproval' to 'Approved', making it visible to trainees.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: courseId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Course has been approved.' }
 *       404: { description: 'Course not found.' }
 */
router.route('/:courseId/approve').patch(
    checkRole(['Program Manager']), 
    courseController.approveCourse
);

/**
 * @openapi
 * /courses/program/{programId}:
 *   get:
 *     tags: [Courses]
 *     summary: Get all courses for a specific program
 *     description: Retrieves a list of all approved courses for a given program. Accessible to any user enrolled in the program.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: programId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'A list of courses.' }
 */
router.route('/program/:programId').get(courseController.getCoursesForProgram);

/**
 * @openapi
 * /courses/{courseId}/request-approval:
 *   patch:
 *     tags: [Courses]
 *     summary: Request course approval
 *     description: (Facilitator only) Submits a 'Draft' course for review, changing its status to 'PendingApproval'.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: courseId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Course submitted successfully.' }
 *       403: { description: 'Forbidden, user is not the facilitator of this course.' }
 *       404: { description: 'Course not found.' }
 */

/**
 * @openapi
 * /courses/program/{programId}:
 *   get:
 *     tags: [Courses]
 *     summary: Get all courses for a specific program
 *     description: Retrieves a list of all approved courses for a given program. Accessible to any user enrolled in the program.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: programId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'A list of courses.' }
 */
router.route('/program/:programId').get(
    // You might want to add a role check here, e.g.,
    // checkRole(['Trainee', 'Facilitator', 'Program Manager', 'SuperAdmin']),
    // but the controller itself (getCoursesForProgram) does not enforce it.
    // If you need strict enrollment-based access, add middleware to verify user is in program.
    courseController.getCoursesForProgram
);
router.route('/:courseId/request-approval').patch(
    checkRole(['Facilitator']),
    courseController.requestCourseApproval
);

/**
 * @openapi
 * /courses/{courseId}/download:
 *   get:
 *     tags: [Courses]
 *     summary: Download a course file
 *     description: Download the uploaded document for a course (facilitator or program manager only).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: courseId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'File downloaded.' }
 *       404: { description: 'Course or file not found.' }
 */
router.route('/:courseId/download').get(
    checkRole(['Facilitator', 'Program Manager']),
    courseController.downloadCourseFile
);

/**
 * @openapi
 * /courses/{courseId}:
 *   put:
 *     tags: [Courses]
 *     summary: Update course metadata or replace file
 *     description: Facilitator can update their own course (not approved).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: courseId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               courseDocument: { type: string, format: binary }
 *     responses:
 *       200: { description: 'Course updated.' }
 *       403: { description: 'Forbidden.' }
 *       404: { description: 'Course not found.' }
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a course
 *     description: Facilitator can delete their own course (not approved).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: courseId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Course deleted.' }
 *       403: { description: 'Forbidden.' }
 *       404: { description: 'Course not found.' }
 */
router.route('/:courseId')
    .put(
        checkRole(['Facilitator']),
        upload.single('courseDocument'),
        courseController.updateCourse
    )
    .delete(
        checkRole(['Facilitator']),
        courseController.deleteCourse
    );

    router.route('/my-courses').get(
    checkRole(['Trainee', 'Facilitator']), 
    courseController.getMyCourses
);


router.route('/:courseId')
    .patch(checkRole(['Facilitator']), upload.single('courseDocument'), courseController.updateCourse)
    .delete(checkRole(['Facilitator']), courseController.deleteCourse);
export default router;