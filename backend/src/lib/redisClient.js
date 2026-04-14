/**
 * @fileoverview Shared Redis connection configuration for BullMQ.
 * Parses the REDIS_URL environment variable into a BullMQ-compatible
 * connection options object. This avoids duplicating connection setup
 * across multiple queues and workers.
 * @module lib/redisClient
 */

'use strict';

require('dotenv').config();

/**
 * @typedef {Object} RedisConnectionOptions
 * @property {string} host - Redis server hostname.
 * @property {number} port - Redis server port.
 * @property {number} maxRetriesPerRequest - Limits queued retries to avoid infinite loops.
 */

/**
 * Parses a Redis connection URL into a BullMQ connection options object.
 *
 * @param {string} url - A Redis URL in the format `redis://host:port`.
 * @returns {RedisConnectionOptions} Parsed host and port.
 * @throws {Error} If the URL is malformed or missing.
 */
function parseRedisUrl(url) {
  if (!url) {
    throw new Error('Missing REDIS_URL in environment variables.');
  }

  const parsed = new URL(url);

  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port, 10) || 6379,
    maxRetriesPerRequest: null, // Required by BullMQ — it manages its own retry and reconnection logic.
  };
}

/**
 * BullMQ-compatible Redis connection options derived from REDIS_URL.
 * @type {RedisConnectionOptions}
 */
const redisConnection = parseRedisUrl(process.env.REDIS_URL);

module.exports = { redisConnection };
