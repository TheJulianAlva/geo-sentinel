/**
 * @fileoverview Service layer for Expedition business logic.
 * Responsible for creating and updating expeditions in the database.
 * Corresponds to the requirements REQ-2.1 and REQ-2.2 of the SRS.
 * @module services/expeditionService
 */

'use strict';

const supabase = require('../lib/supabaseClient');

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
 * Creates a new expedition in the database.
 *
 * @async
 * @param {ExpeditionPayload} payload - The expedition data submitted by the explorer.
 * @returns {Promise<Expedition>} The newly created expedition record.
 * @throws {Error} If the database insertion fails.
 */
async function startExpedition(payload) {
  const { user_id, expected_end_time } = payload;

  const { data, error } = await supabase
    .from('expeditions')
    .insert({ user_id, expected_end_time, status: 'active' })
    .select()
    .single();

  if (error) throw new Error(`Failed to start expedition: ${error.message}`);

  return data;
}

/**
 * Marks an active expedition as 'finished'.
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
