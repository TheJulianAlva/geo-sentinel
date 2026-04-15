/**
 * @fileoverview Socket.io server module — singleton pattern.
 * Manages the WebSocket server for real-time bidirectional communication
 * with connected Rescue Dashboard clients.
 *
 * Uses a singleton `_io` instance initialized once by `index.js` and then
 * referenced by other modules (e.g., the Dead Man's Switch worker) via
 * `broadcastEmergency()`. This avoids circular dependencies and allows
 * workers to emit events without importing the HTTP server directly.
 *
 * Implements requirement REQ-3.1 (Real-time Dashboard alerts) from the SRS.
 * @module lib/socketServer
 */

'use strict';

const { Server } = require('socket.io');

/**
 * Internal Socket.io server instance.
 * Set once by `init()` and used by all broadcast functions.
 * @type {import('socket.io').Server | null}
 */
let _io = null;

/**
 * Initializes the Socket.io server and attaches it to an existing HTTP server.
 * Must be called once during application startup, before any events are emitted.
 *
 * @param {import('http').Server} httpServer - The Node.js HTTP server created from the Express app.
 * @returns {import('socket.io').Server} The initialized Socket.io server instance.
 */
function init(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      // In production, replace '*' with the specific frontend domain.
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  _io.on('connection', (socket) => {
    console.log(`[SOCKET] Rescue Dashboard client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Client ${socket.id} disconnected — reason: ${reason}`);
    });
  });

  console.log('[SOCKET] Socket.io server initialized.');
  return _io;
}

/**
 * Broadcasts an `EMERGENCY_ALERT` event to all connected Rescue Dashboard clients.
 * Called by the Dead Man's Switch worker (REQ-2.3) when an expedition becomes CRITICAL.
 *
 * @param {string} expeditionId - UUID of the expedition that triggered the alert.
 * @returns {void}
 */
function broadcastEmergency(expeditionId) {
  if (!_io) {
    console.error('[SOCKET] Cannot broadcast — Socket.io server is not initialized.');
    return;
  }

  /** @type {{ expeditionId: string, status: string, triggeredAt: string }} */
  const payload = {
    expeditionId,
    status: 'critical',
    triggeredAt: new Date().toISOString(),
  };

  _io.emit('EMERGENCY_ALERT', payload);

  console.log(`[SOCKET] 📡 EMERGENCY_ALERT emitted to all dashboard clients for expedition ${expeditionId}`);
}

/**
 * Returns the active Socket.io server instance.
 * Useful for advanced use cases where direct access to `_io` is needed.
 *
 * @returns {import('socket.io').Server | null} The active Socket.io instance, or null if not initialized.
 */
function getIO() {
  return _io;
}

module.exports = { init, broadcastEmergency, getIO };
