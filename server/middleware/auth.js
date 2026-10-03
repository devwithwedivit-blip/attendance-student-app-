const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'photo-attendance-super-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user record from DB
    const user = db.get(
      'SELECT id, name, email, role, department, employee_code, profile_photo_url, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'This user account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    // Allow matching role, or admin access
    if (req.user.role !== role && req.user.role !== 'admin') {
      if (role === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access privileges required.' });
      }
      if (role === 'dean' && req.user.role !== 'dean' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Dean Academics privileges required.' });
      }
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  requireRole
};
