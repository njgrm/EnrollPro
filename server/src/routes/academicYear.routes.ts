import { Router } from 'express';
import {
  listAcademicYears,
  getAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  transitionAcademicYear,
  deleteAcademicYear,
} from '../controllers/academicYearController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.get('/', authenticate, authorize('REGISTRAR'), listAcademicYears);
router.get('/:id', authenticate, authorize('REGISTRAR'), getAcademicYear);
router.post('/', authenticate, authorize('REGISTRAR'), createAcademicYear);
router.put('/:id', authenticate, authorize('REGISTRAR'), updateAcademicYear);
router.patch('/:id/status', authenticate, authorize('REGISTRAR'), transitionAcademicYear);
router.delete('/:id', authenticate, authorize('REGISTRAR'), deleteAcademicYear);

export default router;
