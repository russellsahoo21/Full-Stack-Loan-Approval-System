import express from 'express';
import { getSyntheticProfile, updateSyntheticProfile } from '../controllers/syntheticController.js';

const router = express.Router();

router.get('/:applicantId', getSyntheticProfile);
router.put('/:applicantId', updateSyntheticProfile);

export default router;
