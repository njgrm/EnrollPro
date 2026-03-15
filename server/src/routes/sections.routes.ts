import { Router } from 'express';
import {
  listSections,
  listTeachers,
  createSection,
  updateSection,
  deleteSection,
} from '../controllers/sectionsController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router: Router = Router();

router.get('/teachers', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), listTeachers);
router.get('/', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), listSections);
router.get('/:ayId', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), listSections);
router.post('/', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), createSection);
router.put('/:id', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), updateSection);
router.delete('/:id', authenticate, authorize('REGISTRAR', 'SYSTEM_ADMIN'), deleteSection);

export default router;
