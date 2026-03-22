import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { 
  getStudents, 
  getStudentById, 
  updateStudent,
  getHealthRecords,
  addHealthRecord,
  updateHealthRecord,
  resetPortalPin
} from '../controllers/students.controller.js';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// Get all students with search and filters
router.get('/', authorize('REGISTRAR', 'SYSTEM_ADMIN', 'TEACHER'), getStudents);

// Get single student by ID
router.get('/:id', authorize('REGISTRAR', 'SYSTEM_ADMIN', 'TEACHER'), getStudentById);

// Update student information
router.put('/:id', authorize('REGISTRAR', 'SYSTEM_ADMIN'), updateStudent);

// Health Records
router.get('/:id/health-records', authorize('REGISTRAR', 'SYSTEM_ADMIN', 'TEACHER'), getHealthRecords);
router.post('/:id/health-records', authorize('REGISTRAR', 'SYSTEM_ADMIN'), addHealthRecord);
router.put('/:id/health-records/:recId', authorize('REGISTRAR', 'SYSTEM_ADMIN'), updateHealthRecord);

// Portal PIN Reset
router.post('/:id/reset-portal-pin', authorize('REGISTRAR', 'SYSTEM_ADMIN'), resetPortalPin);

export default router;
