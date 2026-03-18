import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import * as teachersCtrl from '../controllers/teachersController.js';

const router: Router = Router();

// All teacher routes require SYSTEM_ADMIN role
router.use(authenticate, authorize('SYSTEM_ADMIN'));

router.get('/', teachersCtrl.index);
router.get('/:id', teachersCtrl.show);
router.post('/', teachersCtrl.store);
router.put('/:id', teachersCtrl.update);
router.patch('/:id/deactivate', teachersCtrl.deactivate);
router.patch('/:id/reactivate', teachersCtrl.reactivate);

export default router;
