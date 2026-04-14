/**
 * @fileoverview Route definitions for the Expedition resource.
 * @module routes/expeditionRoutes
 */

'use strict';

const { Router } = require('express');
const expeditionController = require('../controllers/expeditionController');

const router = Router();

/**
 * @route   POST /api/expeditions/start
 * @desc    Starts a new expedition for an explorer.
 * @access  Public (future: Protected via Supabase Auth JWT)
 */
router.post('/start', expeditionController.start);

/**
 * @route   POST /api/expeditions/:id/finish
 * @desc    Marks an active expedition as finished.
 * @access  Public (future: Protected via Supabase Auth JWT)
 */
router.post('/:id/finish', expeditionController.finish);

module.exports = router;
