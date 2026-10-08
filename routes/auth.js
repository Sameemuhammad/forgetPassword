const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');
const sendEmail = require('../utils/sendEmail');
const protect = require('../middleware/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const isEmail = (s) => /^\S+@\S+\.\S+$/.test(s);

/* ---------- SIGN UP ---------- */
router.post('/signup', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!name) return res.status(400).json({ message: 'Name zaroori hai' });
    if (!isEmail(email)) return res.status(400).json({ message: 'Valid email likhein' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password kam az kam 6 characters ka ho' });

    const { data: exists } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (exists) return res.status(400).json({ message: 'Ye email pehle se registered hai' });

    const hashed = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashed })
      .select('id, name, email')
      .single();
    if (error) throw error;

    res.status(201).json({
      message: 'Account ban gaya',
      token: signToken(user.id),
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------- LOGIN ---------- */
router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    if (!email || !password)
      return res.status(400).json({ message: 'Email aur password dono likhein' });

    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Email ya password ghalat hai' });

    res.json({
      message: 'Login kamyab',
      token: signToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------- FORGOT PASSWORD ---------- */
router.post('/forgot-password', async (req, res) => {
  const genericMsg = 'Agar ye email registered hai to reset link bhej diya gaya hai';
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { data: user } = await supabase.from('users').select('id, name, email').eq('email', email).maybeSingle();
    if (!user) return res.json({ message: genericMsg }); // email enumeration se bachao

    // Random token banao; DB mein sirf uska hash save hota hai
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expire = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minute

    const { error: upErr } = await supabase
      .from('users')
      .update({ reset_password_token: hashedToken, reset_password_expire: expire })
      .eq('id', user.id);
    if (upErr) throw upErr;

    const resetUrl = `${process.env.CLIENT_URL}/reset.html?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h3>Salam ${user.name},</h3>
          <p>Aap ne password reset karne ki request ki hai.</p>
          <p><a href="${resetUrl}">Yahan click karke naya password set karein</a></p>
          <p>Ye link <b>15 minute</b> tak valid hai. Agar ye request aap ne nahi ki to is email ko ignore karein.</p>
        `,
      });
      res.json({ message: genericMsg });
    } catch (mailErr) {
      await supabase
        .from('users')
        .update({ reset_password_token: null, reset_password_expire: null })
        .eq('id', user.id);
      console.error('Email error:', mailErr.message);
      res.status(500).json({ message: 'Email nahi bhej saka, dobara koshish karein' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------- RESET PASSWORD ---------- */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('reset_password_token', hashedToken)
      .gt('reset_password_expire', new Date().toISOString())
      .maybeSingle();
    if (!user) return res.status(400).json({ message: 'Link invalid ya expire ho chuka hai' });

    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Password kam az kam 6 characters ka ho' });

    const hashed = await bcrypt.hash(password, 10);
    const { error } = await supabase
      .from('users')
      .update({ password: hashed, reset_password_token: null, reset_password_expire: null })
      .eq('id', user.id);
    if (error) throw error;

    res.json({ message: 'Password change ho gaya, ab login karein' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------- PROTECTED ROUTE (test ke liye) ---------- */
router.get('/me', protect, (req, res) => {
  const { id, name, email } = req.user;
  res.json({ user: { id, name, email } });
});

module.exports = router;
