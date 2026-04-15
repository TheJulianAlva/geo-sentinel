/**
 * @fileoverview Route definitions for the Checkpoint resource.
 * @module routes/checkpointRoutes
 */

'use strict';

const { Router } = require('express');
const checkpointController = require('../controllers/checkpointController');

const router = Router();

/**
 * @route   POST /api/checkpoints
 * @desc    Creates a single checkpoint or a batch of checkpoints (offline/COO sync).
 *          If the request body is a JSON array, batch mode is activated automatically.
 * @access  Public (future: Protected via Supabase Auth JWT)
 */
router.post('/', checkpointController.create);

module.exports = router;
