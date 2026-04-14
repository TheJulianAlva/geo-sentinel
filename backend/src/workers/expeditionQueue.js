/**
 * @fileoverview Shared BullMQ Queue instance for expedition-related background jobs.
 * This module exports a single Queue connected to Redis that is used by both
 * the expedition service (to enqueue jobs) and the Dead Man's Switch worker
 * (to consume them).
 * @module workers/expeditionQueue
 */

'use strict';

const { Queue } = require('bullmq');
const { redisConnection } = require('../lib/redisClient');

/**
 * Name of the BullMQ queue used for expedition timeout jobs.
 * @constant {string}
 */
const QUEUE_NAME = 'expeditionTasks';

/**
 * Shared BullMQ Queue for scheduling expedition safety checks.
 * Jobs are added by the expedition service when a new expedition starts.
 * @type {import('bullmq').Queue}
 */
const expeditionQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,   // Keeps Redis memory clean after a job succeeds.
    removeOnFail: 50,         // Retain the last 50 failed jobs for debugging.
    attempts: 2,              // Retry once if the worker crashes.
    backoff: { type: 'fixed', delay: 5000 }, // Wait 5s before retrying.
  },
});

module.exports = { expeditionQueue, QUEUE_NAME };
