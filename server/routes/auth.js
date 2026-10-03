const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      employee_code: user.employee_code,
      profile_photo_url: user.profile_photo_url,
      created_at: user.created_at
    };

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, department = 'Engineering', employee_code, invite_code } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existing = db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    let assignedRole = 'employee';
    let assignedDept = department;

    // Handle invite code if provided
    if (invite_code) {
      const invite = db.get('SELECT * FROM invites WHERE code = ? AND used = 0', [invite_code.trim()]);
      if (!invite) {
        return res.status(400).json({ error: 'Invalid or already used invite code.' });
      }
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return res.status(400).json({ error: 'This invite code has expired.' });
      }
      assignedRole = invite.role || 'employee';
      assignedDept = invite.department || assignedDept;

      // Mark invite as used
      db.run('UPDATE invites SET used = 1 WHERE id = ?', [invite.id]);
    }

    // Generate employee code if not provided
    const code = employee_code?.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = db.run(
      `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        password_hash,
        assignedRole,
        assignedDept,
        code,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`
      ]
    );

    const newUser = db.get(
      'SELECT id, name, email, role, department, employee_code, profile_photo_url, created_at FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

/**
 * GET /api/auth/verify-invite/:code
 */
router.get('/verify-invite/:code', (req, res) => {
  const { code } = req.params;
  const invite = db.get('SELECT * FROM invites WHERE code = ? AND used = 0', [code.trim()]);
  if (!invite) {
    return res.status(404).json({ valid: false, error: 'Invite code not found or already redeemed.' });
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return res.status(400).json({ valid: false, error: 'Invite code has expired.' });
  }
  res.json({
    valid: true,
    invite: {
      email: invite.email,
      department: invite.department,
      role: invite.role
    }
  });
});

module.exports = router;
