/**
 * @fileoverview Dead Man's Switch background worker.
 * Listens to the `expeditionTasks` BullMQ queue and processes safety timeout
 * checks when an expedition's Maximum Estimated Time (TME) expires.
 *
 * Implements requirements REQ-2.2 and REQ-2.3 from the SRS:
 * - REQ-2.2: The backend must register a Worker triggered at the TME.
 * - REQ-2.3: If the expedition has not been marked as 'finished', the Worker
 *            must set its status to 'critical' and emit an emergency event.
 *
 * @module workers/deadMansSwitchWorker
 */

'use strict';

const { Worker } = require('bullmq');
const supabase = require('../lib/supabaseClient');
const { redisConnection } = require('../lib/redisClient');
const { QUEUE_NAME } = require('./expeditionQueue');
const { broadcastEmergency } = require('../lib/socketServer');

/**
 * @typedef {Object} ExpeditionJobData
 * @property {string} expeditionId - UUID of the expedition to check.
 */

/**
 * Core processor function for the Dead Man's Switch job.
 * Called automatically by BullMQ when a delayed job becomes ready.
 *
 * @async
 * @param {import('bullmq').Job<ExpeditionJobData>} job - The BullMQ job instance.
 * @returns {Promise<void>}
 * @throws {Error} If the database query or update fails (triggers a retry).
 */
async function processExpeditionTimeout(job) {
  const { expeditionId } = job.data;

  console.log(`[DMS] ⏰ Checking expedition ${expeditionId}...`);

  // 1. Fetch the current state of the expedition.
  const { data: expedition, error: fetchError } = await supabase
    .from('expeditions')
    .select('id, status, expected_end_time')
    .eq('id', expeditionId)
    .single();

  if (fetchError) {
    throw new Error(`[DMS] Failed to fetch expedition ${expeditionId}: ${fetchError.message}`);
  }

  if (!expedition) {
    console.warn(`[DMS] Expedition ${expeditionId} not found. Skipping.`);
    return;
  }

  // 2. Check if the expedition is already concluded. If so, do nothing.
  if (expedition.status === 'finished') {
    console.log(`[DMS] ✅ Expedition ${expeditionId} already finished safely. No action needed.`);
    return;
  }

  // 3. Expedition is still active or delayed — mark it as CRITICAL (REQ-2.3).
  const { data: updatedExpedition, error: updateError } = await supabase
    .from('expeditions')
    .update({ status: 'critical' })
    .eq('id', expeditionId)
    .select('id, status')
    .single();

  if (updateError) {
    throw new Error(`[DMS] Failed to update expedition ${expeditionId} to critical: ${updateError.message}`);
  }

  if (!updatedExpedition) {
    throw new Error(`[DMS] Update was silently rejected for expedition ${expeditionId}. Check RLS UPDATE policies.`);
  }

  // 4. Emit the EMERGENCY_ALERT event to all connected Rescue Dashboard clients (REQ-2.3 / REQ-3.1).
  broadcastEmergency(expeditionId);
}

// --- Worker Initialization ---

/**
 * BullMQ Worker instance that processes `expeditionTasks` jobs.
 * Starts listening for jobs automatically upon module import.
 * @type {import('bullmq').Worker}
 */
const deadMansSwitchWorker = new Worker(QUEUE_NAME, processExpeditionTimeout, {
  connection: redisConnection,
  concurrency: 5, // Process up to 5 timeout checks in parallel.
});

// --- Event Listeners ---

deadMansSwitchWorker.on('completed', (job) => {
  console.log(`[DMS] Job ${job.id} (expedition: ${job.data.expeditionId}) processed successfully.`);
});

deadMansSwitchWorker.on('failed', (job, err) => {
  console.error(`[DMS] Job ${job?.id} failed: ${err.message}`);
});

deadMansSwitchWorker.on('error', (err) => {
  console.error(`[DMS] Worker encountered an error: ${err.message}`);
});

module.exports = deadMansSwitchWorker;
