/**
 * @fileoverview Singleton client for the Supabase connection.
 * Centralizes credential loading and provides a shared instance
 * to all services in the application.
 * @module lib/supabaseClient
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.');
}

/**
 * Shared Supabase client instance.
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
