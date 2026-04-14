/**
 * @fileoverview HTTP controllers for the Expedition resource.
 * Validates incoming requests and delegates business logic to the
 * expedition service layer. Returns standardized JSON responses.
 * @module controllers/expeditionController
 */

'use strict';

const expeditionService = require('../services/expeditionService');

/**
 * Handles POST /api/expeditions/start
 * Starts a new expedition for an explorer, registering the TME (Tiempo Máximo Estimado).
 *
 * @async
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 *
 * @example
 * // Request body
 * {
 *   "user_id": "uuid-of-the-explorer",
 *   "expected_end_time": "2026-04-13T18:00:00Z"
 * }
 */
async function start(req, res) {
  const { user_id, expected_end_time } = req.body;

  if (!user_id || !expected_end_time) {
    return res.status(400).json({
      error: 'Missing required fields: user_id and expected_end_time.',
    });
  }

  try {
    const expedition = await expeditionService.startExpedition({ user_id, expected_end_time });
    return res.status(201).json(expedition);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Handles POST /api/expeditions/:id/finish
 * Marks an active expedition as finished. Requires user_id in the body for ownership validation.
 *
 * @async
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
async function finish(req, res) {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing required field: user_id.' });
  }

  try {
    const expedition = await expeditionService.finishExpedition(id, user_id);
    return res.status(200).json(expedition);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { start, finish };
