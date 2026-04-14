/**
 * @fileoverview Service layer for Expedition business logic.
 * Responsible for creating, updating, and scheduling safety timeouts for expeditions.
 * Corresponds to requirements REQ-2.1, REQ-2.2, and REQ-2.3 of the SRS.
 * @module services/expeditionService
 */

'use strict';

const supabase = require('../lib/supabaseClient');
const { expeditionQueue } = require('../workers/expeditionQueue');

/**
 * Grace period added on top of the TME before triggering the Dead Man's Switch.
 * Avoids false positives due to minor network delays on the hiker's device.
 * @constant {number}
 */
const GRACE_PERIOD_MS = 60 * 1000; // 1 minute

/**
 * @typedef {Object} ExpeditionPayload
 * @property {string} user_id - UUID of the explorer (must match a profiles.id).
 * @property {string} expected_end_time - ISO 8601 datetime string of the maximum planned time (TME).
 */

/**
 * @typedef {Object} Expedition
 * @property {string} id - UUID of the created expedition.
 * @property {string} user_id - UUID of the owner explorer.
 * @property {string} expected_end_time - The planned finish time.
 * @property {'active'|'delayed'|'critical'|'finished'} status - Current expedition status.
 * @property {string} created_at - ISO creation timestamp.
 */

/**
 * Creates a new expedition in the database and schedules a Dead Man's Switch
 * timeout job that will trigger an alert if the expedition is not finished in time.
 *
 * @async
 * @param {ExpeditionPayload} payload - The expedition data submitted by the explorer.
 * @returns {Promise<Expedition>} The newly created expedition record.
 * @throws {Error} If the database insertion or job scheduling fails.
 */
async function startExpedition(payload) {
  const { user_id, expected_end_time } = payload;

  // 1. Insert the expedition record.
  const { data, error } = await supabase
    .from('expeditions')
    .insert({ user_id, expected_end_time, status: 'active' })
    .select()
    .single();

  if (error) throw new Error(`Failed to start expedition: ${error.message}`);

  // 2. Calculate the delay for the Dead Man's Switch job.
  const expectedEndMs = new Date(data.expected_end_time).getTime();
  const nowMs = Date.now();
  const delayMs = Math.max(expectedEndMs - nowMs + GRACE_PERIOD_MS, 0);

  // 3. Schedule the timeout job with a unique ID to prevent duplicates.
  await expeditionQueue.add(
    'checkExpeditionTimeout',
    { expeditionId: data.id },
    {
      delay: delayMs,
      jobId: `dms-${data.id}`, // Idempotent: prevents double-scheduling the same expedition.
    }
  );

  const delayMinutes = Math.round(delayMs / 60_000);
  console.log(`[DMS] Scheduled Dead Man's Switch for expedition ${data.id} in ~${delayMinutes} min.`);

  return data;
}

/**
 * Marks an active expedition as 'finished', preventing the Dead Man's Switch
 * from triggering a false alarm.
 *
 * @async
 * @param {string} expeditionId - The UUID of the expedition to finalize.
 * @param {string} userId - The UUID of the requesting user (for ownership validation).
 * @returns {Promise<Expedition>} The updated expedition record.
 * @throws {Error} If the expedition is not found, already finished, or update fails.
 */
async function finishExpedition(expeditionId, userId) {
  const { data, error } = await supabase
    .from('expeditions')
    .update({ status: 'finished', actual_end_time: new Date().toISOString() })
    .eq('id', expeditionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to finish expedition: ${error.message}`);
  if (!data) throw new Error('Expedition not found or access denied.');

  return data;
}

module.exports = { startExpedition, finishExpedition };
