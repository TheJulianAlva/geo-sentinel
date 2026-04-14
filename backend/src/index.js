/**
 * @fileoverview Main entry point for the GeoSentinel API server.
 * Initializes the Express application, mounts all route modules,
 * and starts listening for incoming HTTP connections.
 * @module src/index
 */

'use strict';

const express = require('express');
const supabase = require('./lib/supabaseClient');

// Route modules
const expeditionRoutes = require('./routes/expeditionRoutes');
const checkpointRoutes = require('./routes/checkpointRoutes');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());

// --- Routes ---
app.use('/api/expeditions', expeditionRoutes);
app.use('/api/checkpoints', checkpointRoutes);

/**
 * @route   GET /health
 * @desc    Health check endpoint. Verifies the server is running and the database is reachable.
 * @access  Public
 */
app.get('/health', async (req, res) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) throw error;

    res.json({
      status: 'OK',
      database: 'Connected',
      message: 'GeoSentinel API is running and connected to Supabase.',
    });
  } catch (err) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      error: err.message,
    });
  }
});

// --- Server Init ---
app.listen(port, () => {
  console.log(`GeoSentinel Backend running at http://localhost:${port}`);
});
