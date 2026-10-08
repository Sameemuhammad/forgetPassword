require('dotenv').config();
const express = require('express');
const path = require('path');
const supabase = require('./db/supabase');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;

// Start se pehle check karo ke Supabase aur table theek hain
supabase
  .from('users')
  .select('id', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) {
      console.error('Supabase error:', error.message);
      console.error('Check karein: URL, service key, aur users table bani hai ya nahi (db/schema.sql)');
      process.exit(1);
    }
    console.log('Supabase connected');
    app.listen(PORT, () => console.log(`Server chal raha hai: http://localhost:${PORT}`));
  });
