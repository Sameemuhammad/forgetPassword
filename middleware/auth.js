const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');

// Protected routes ke liye: Authorization: Bearer <token>
module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
    if (!token) return res.status(401).json({ message: 'Login zaroori hai' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', decoded.id)
      .maybeSingle();
    if (!user) return res.status(401).json({ message: 'User nahi mila' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid ya expire ho gaya' });
  }
};
