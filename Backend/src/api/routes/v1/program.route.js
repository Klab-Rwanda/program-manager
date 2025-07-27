import { Router } from 'express';
import * as programController from '../../controllers/program.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { getProgramStudentCount } from '../../controllers/program.controller.js';

const router = Router();
router.use(verifyJWT);



router.route('/')
    .get(programController.getAllPrograms)
    .post(verifyJWT, checkRole(['Program Manager', 'SuperAdmin']), programController.createProgram);
    


router.route('/archived').get(checkRole(['SuperAdmin', 'Program Manager']), programController.getArchivedPrograms);

router.route('/:id')
    .get(programController.getProgramById)
    .put(checkRole(['SuperAdmin', 'Program Manager']), programController.updateProgram)
    .delete(checkRole(['SuperAdmin', 'Program Manager']), programController.deleteProgram);


router.route('/:id/request-approval').patch(checkRole(['Program Manager']), programController.requestApproval);


router.route('/:id/approve').patch(checkRole(['SuperAdmin']), programController.approveProgram);


router.route('/:id/reject').patch(checkRole(['SuperAdmin']), programController.rejectProgram);
    

router.route('/:id/enroll-trainee').post(checkRole(['Program Manager']), programController.enrollTrainee);


router.route('/:id/enroll-facilitator').post(checkRole(['Program Manager']), programController.enrollFacilitator);


router.route('/:id/manage-managers').patch(checkRole(['SuperAdmin']), programController.updateProgramManagers);




router.route('/:id/assign-manager').patch(checkRole(['SuperAdmin']), programController.assignManager);




router.route('/:id/report/pdf').get(checkRole(['SuperAdmin', 'Program Manager']), programController.generateProgramReport);


router.route('/:id/stats').get(checkRole(['SuperAdmin', 'Program Manager']), programController.getProgramStats);

router.route('/:id/archive').patch(checkRole(['SuperAdmin', 'Program Manager']), programController.archiveProgram);

router.route('/:id/unarchive').patch(checkRole(['SuperAdmin', 'Program Manager']), programController.unarchiveProgram);

router.route('/:id/student-count').get(getProgramStudentCount);

export default router;