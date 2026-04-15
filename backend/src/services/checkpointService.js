/**
 * @fileoverview Service layer for Checkpoint business logic.
 * Handles the insertion of geolocation records into the database using
 * PostGIS spatial functions. Supports both single and batch (offline/COO)
 * checkpoint submissions.
 * Corresponds to requirements REQ-1.1, REQ-1.2, and REQ-1.3 of the SRS.
 * @module services/checkpointService
 */

'use strict';

const supabase = require('../lib/supabaseClient');

/**
 * @typedef {Object} CheckpointPayload
 * @property {string} expedition_id - UUID of the parent expedition.
 * @property {number} latitude - Geographic latitude coordinate (e.g. 19.4326).
 * @property {number} longitude - Geographic longitude coordinate (e.g. -99.1332).
 * @property {string} device_timestamp - ISO 8601 datetime from the device's local clock.
 * @property {boolean} [is_panic_button=false] - Whether this was triggered by the panic/SOS button.
 * @property {Object} [metadata] - Optional extra data (battery level, accuracy, etc.).
 */

/**
 * @typedef {Object} Checkpoint
 * @property {string} id - UUID of the checkpoint.
 * @property {string} expedition_id - UUID of the parent expedition.
 * @property {string} device_timestamp - ISO timestamp from the device.
 * @property {boolean} is_panic_button - Whether this is a panic event.
 * @property {string} created_at - ISO server-side insertion timestamp.
 */

/**
 * Builds the PostGIS geometry string for a lat/lon pair.
 * Uses SRID 4326 (WGS 84), which is the standard coordinate system for GPS.
 *
 * @param {number} longitude - The longitude value.
 * @param {number} latitude - The latitude value.
 * @returns {string} A PostGIS-compatible WKT geometry string.
 */
function buildGeomPoint(longitude, latitude) {
  return `SRID=4326;POINT(${longitude} ${latitude})`;
}

/**
 * Inserts a single checkpoint into the database.
 *
 * @async
 * @param {CheckpointPayload} payload - Checkpoint data from the mobile client.
 * @returns {Promise<Checkpoint>} The newly created checkpoint record.
 * @throws {Error} If the database insertion fails.
 */
async function createCheckpoint(payload) {
  const { expedition_id, latitude, longitude, device_timestamp, is_panic_button = false, metadata = null } = payload;

  const { data, error } = await supabase
    .from('checkpoints')
    .insert({
      expedition_id,
      geom: buildGeomPoint(longitude, latitude),
      device_timestamp,
      is_panic_button,
      metadata,
    })
    .select('id, expedition_id, device_timestamp, is_panic_button, created_at')
    .single();

  if (error) throw new Error(`Failed to create checkpoint: ${error.message}`);

  return data;
}

/**
 * Inserts a batch of checkpoints sorted chronologically by their device timestamp.
 * This implements the Offline/COO (Cobertura Operacional Offline) requirement:
 * events are ordered by when they occurred on the device, not when they were received.
 *
 * @async
 * @param {CheckpointPayload[]} payloads - Array of checkpoint data from an offline sync.
 * @returns {Promise<Checkpoint[]>} Array of newly created checkpoint records.
 * @throws {Error} If the batch database insertion fails.
 */
async function createCheckpointBatch(payloads) {
  const sorted = [...payloads].sort(
    (a, b) => new Date(a.device_timestamp) - new Date(b.device_timestamp)
  );

  const rows = sorted.map(({ expedition_id, latitude, longitude, device_timestamp, is_panic_button = false, metadata = null }) => ({
    expedition_id,
    geom: buildGeomPoint(longitude, latitude),
    device_timestamp,
    is_panic_button,
    metadata,
  }));

  const { data, error } = await supabase
    .from('checkpoints')
    .insert(rows)
    .select('id, expedition_id, device_timestamp, is_panic_button, created_at');

  if (error) throw new Error(`Failed to create checkpoint batch: ${error.message}`);

  return data;
}

module.exports = { createCheckpoint, createCheckpointBatch };
