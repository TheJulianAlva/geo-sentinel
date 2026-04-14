/**
 * @fileoverview HTTP controllers for the Checkpoint resource.
 * Validates incoming requests and delegates business logic to the
 * checkpoint service layer. Supports both single and batch submissions.
 * Corresponds to REQ-1.1 and REQ-1.3 of the SRS.
 * @module controllers/checkpointController
 */

'use strict';

const checkpointService = require('../services/checkpointService');

/**
 * Handles POST /api/checkpoints
 * Creates one or more checkpoint records. If the body is an array of checkpoints,
 * it is treated as a batch offline sync. Otherwise, a single checkpoint is created.
 *
 * @async
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 *
 * @example
 * // Single checkpoint
 * {
 *   "expedition_id": "uuid-of-expedition",
 *   "latitude": 19.4326,
 *   "longitude": -99.1332,
 *   "device_timestamp": "2026-04-13T15:30:00Z",
 *   "is_panic_button": false
 * }
 *
 * @example
 * // Batch
 * [
 *   { "expedition_id": "...", "latitude": 19.43, "longitude": -99.13, "device_timestamp": "..." },
 *   { "expedition_id": "...", "latitude": 19.44, "longitude": -99.14, "device_timestamp": "..." }
 * ]
 */
async function create(req, res) {
  const body = req.body;

  if (!body || (Array.isArray(body) && body.length === 0)) {
    return res.status(400).json({ error: 'Request body is empty or invalid.' });
  }

  try {
    if (Array.isArray(body)) {
      // Batch mode (COO / Offline Sync) — REQ-1.3
      const checkpoints = await checkpointService.createCheckpointBatch(body);
      return res.status(201).json({
        message: `${checkpoints.length} checkpoint(s) synced successfully.`,
        data: checkpoints,
      });
    }

    // Single checkpoint mode — REQ-1.1
    const { expedition_id, latitude, longitude, device_timestamp } = body;

    if (!expedition_id || latitude == null || longitude == null || !device_timestamp) {
      return res.status(400).json({
        error: 'Missing required fields: expedition_id, latitude, longitude, device_timestamp.',
      });
    }

    const checkpoint = await checkpointService.createCheckpoint(body);
    return res.status(201).json(checkpoint);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { create };
