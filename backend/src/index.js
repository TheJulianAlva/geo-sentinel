const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) throw error;

    res.json({
      status: 'OK',
      database: 'Connected',
      message: 'GeoSentinel API is running and connected to Supabase.'
    });
  } catch (err) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      error: err.message
    });
  }
});

app.listen(port, () => {
  console.log(`GeoSentinel Backend running at http://localhost:${port}`);
});
