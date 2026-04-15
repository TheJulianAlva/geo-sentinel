/**
 * @fileoverview Main entry point for the GeoSentinel API server.
 * Initializes the Express application, mounts all route modules,
 * starts the Dead Man's Switch background worker, and begins
 * listening for incoming HTTP and WebSocket connections.
 *
 * Uses `http.createServer()` instead of `app.listen()` to allow
 * Socket.io to share the same port as the REST API.
 * @module src/index
 */

'use strict';

const http = require('http');
const express = require('express');
const cors = require('cors');
const supabase = require('./lib/supabaseClient');
const socketServer = require('./lib/socketServer');

// Route modules
const expeditionRoutes = require('./routes/expeditionRoutes');
const checkpointRoutes = require('./routes/checkpointRoutes');

// Background Workers — importing starts the worker process automatically.
const deadMansSwitchWorker = require('./workers/deadMansSwitchWorker');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Allow all origins in development.
app.use(express.json());

// --- Routes ---
app.use('/api/expeditions', expeditionRoutes);
app.use('/api/checkpoints', checkpointRoutes);

/**
 * @route   GET /health
 * @desc    Health check endpoint. Verifies the server, database, and real-time services.
 * @access  Public
 */
app.get('/health', async (req, res) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) throw error;

    const io = socketServer.getIO();

    res.json({
      status: 'OK',
      database: 'Connected',
      worker: deadMansSwitchWorker.isRunning() ? 'Running' : 'Stopped',
      websockets: io ? `Active (${io.engine.clientsCount} clients connected)` : 'Not initialized',
      message: 'GeoSentinel API is running.',
    });
  } catch (err) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      error: err.message,
    });
  }
});

// --- HTTP + WebSocket Server ---

/**
 * Shared HTTP server used by both Express and Socket.io.
 * @type {import('http').Server}
 */
const httpServer = http.createServer(app);

// Initialize Socket.io — must happen before httpServer.listen().
socketServer.init(httpServer);

httpServer.listen(port, () => {
  console.log(`GeoSentinel Backend running at http://localhost:${port}`);
  console.log(`[SOCKET] WebSocket server ready at ws://localhost:${port}`);
  console.log(`[DMS] Dead Man's Switch worker is active.`);
});
