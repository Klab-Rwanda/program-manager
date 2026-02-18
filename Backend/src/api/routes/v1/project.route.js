import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    removeProjectFile,
    getMyProjects,
    createProjectUpdate,
    editProjectUpdate,
    getMyProjectUpdates,
    getTodayProjectUpdate,
    getProjectUpdates,
    reviewProjectUpdate
} from '../../controllers/project.controller.js';
import {
    createTask,
    getProjectTasks,
    getMyTasks,
    updateTaskCompletion,
    updateTask,
    deleteTask
} from '../../controllers/projectTask.controller.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// ---- Trainee routes (must come before :id routes) ----
router.get('/my-projects', checkRole(['Trainee']), getMyProjects);

// ---- Project update edit/review (must come before :id routes) ----
router.put('/updates/:updateId', checkRole(['Trainee']), editProjectUpdate);
router.patch('/updates/:updateId/review', checkRole(['Facilitator', 'Program Manager']), reviewProjectUpdate);

// ---- Task routes (must come before :id routes) ----
router.put('/tasks/:taskId', checkRole(['Facilitator', 'Program Manager', 'Trainee']), updateTask);
router.delete('/tasks/:taskId', checkRole(['Facilitator', 'Program Manager', 'Trainee']), deleteTask);
router.patch('/tasks/:taskId/completion', checkRole(['Trainee', 'Facilitator', 'Program Manager']), updateTaskCompletion);

// ---- Facilitator/PM project CRUD ----
router.post('/', checkRole(['Facilitator', 'Program Manager']), upload.array('files', 5), createProject);
router.get('/', checkRole(['Facilitator', 'Program Manager']), getProjects);

// ---- Single project routes ----
router.get('/:id', checkRole(['Facilitator', 'Program Manager', 'Trainee']), getProjectById);
router.put('/:id', checkRole(['Facilitator', 'Program Manager']), upload.array('files', 5), updateProject);
router.delete('/:id', checkRole(['Facilitator', 'Program Manager']), deleteProject);
router.delete('/:id/files/:fileIndex', checkRole(['Facilitator', 'Program Manager']), removeProjectFile);

// ---- Project tasks ----
router.post('/:id/tasks', checkRole(['Facilitator', 'Program Manager', 'Trainee']), createTask);
router.get('/:id/tasks', checkRole(['Facilitator', 'Program Manager', 'Trainee']), getProjectTasks);
router.get('/:id/my-tasks', checkRole(['Trainee']), getMyTasks);

// ---- Project updates (trainee daily progress) ----
router.post('/:id/updates', checkRole(['Trainee']), createProjectUpdate);
router.get('/:id/updates', checkRole(['Facilitator', 'Program Manager']), getProjectUpdates);
router.get('/:id/my-updates', checkRole(['Trainee']), getMyProjectUpdates);
router.get('/:id/today-update', checkRole(['Trainee']), getTodayProjectUpdate);

export default router;
