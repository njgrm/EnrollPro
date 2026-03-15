import { Router } from 'express';
import {
  listAcademicYears,
  getAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  transitionAcademicYear,
  deleteAcademicYear,
  getNextDefaults,
  toggleOverride,
  updateDates,
} from '../controllers/academicYearController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router: Router = Router();

// TEACHER needs list to see the AYSwitcher, SYSTEM_ADMIN needs access to manage
router.get('/', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN', 'TEACHER'), listAcademicYears);
router.get('/next-defaults', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), getNextDefaults);
router.get('/:id', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), getAcademicYear);
router.post('/activate', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), createAcademicYear);
router.put('/:id', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), updateAcademicYear);
router.patch('/:id/status', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), transitionAcademicYear);
router.patch('/:id/override', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), toggleOverride);
router.patch('/:id/dates', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), updateDates);
router.delete('/:id', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), deleteAcademicYear);

export default router;
