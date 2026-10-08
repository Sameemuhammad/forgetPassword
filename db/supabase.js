const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_URL ya SUPABASE_SERVICE_KEY .env mein nahi mili');
  process.exit(1);
}

// Service key sirf server par rehti hai, frontend ko kabhi nahi deni
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

module.exports = supabase;
