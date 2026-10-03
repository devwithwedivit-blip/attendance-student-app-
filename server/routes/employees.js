const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply auth + admin check
router.use(verifyToken, requireRole('admin'));

/**
 * GET /api/admin/employees
 * List all users with their statistics
 */
router.get('/', (req, res) => {
  try {
    const users = db.all(
      `SELECT id, name, email, role, department, employee_code, profile_photo_url, is_active, created_at
       FROM users
       ORDER BY role ASC, name ASC`
    );

    // Attach total records count to each user
    const usersWithStats = users.map(user => {
      const stats = db.get(
        `SELECT COUNT(*) as total_records, 
                SUM(CASE WHEN flagged = 1 THEN 1 ELSE 0 END) as flagged_records
         FROM attendance_records 
         WHERE user_id = ?`,
        [user.id]
      );
      return {
        ...user,
        totalRecords: stats ? stats.total_records : 0,
        flaggedRecords: stats ? stats.flagged_records : 0
      };
    });

    res.json({ employees: usersWithStats });
  } catch (err) {
    console.error('Error listing employees:', err);
    res.status(500).json({ error: 'Failed to retrieve employee directory.' });
  }
});

/**
 * POST /api/admin/employees
 * Add a new employee
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, password, department = 'Engineering', role = 'employee', employee_code } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const code = employee_code?.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const insertResult = db.run(
      `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        password_hash,
        role,
        department,
        code,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`
      ]
    );

    const newEmp = db.get('SELECT id, name, email, role, department, employee_code, profile_photo_url, is_active, created_at FROM users WHERE id = ?', [insertResult.lastInsertRowid]);

    res.status(201).json({
      message: 'Employee added successfully',
      employee: newEmp
    });
  } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ error: 'Failed to create employee account.' });
  }
});

/**
 * PATCH /api/admin/employees/:id
 * Update employee details or toggle active/inactive status
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, role, is_active, employee_code, password } = req.body;

    const user = db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Do not allow deactivating the main admin if they are the only admin
    if (is_active === 0 && user.role === 'admin') {
      const adminCount = db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin" AND is_active = 1');
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot deactivate the sole remaining admin account.' });
      }
    }

    const updatedName = name !== undefined ? name.trim() : user.name;
    const updatedDept = department !== undefined ? department : user.department;
    const updatedRole = role !== undefined ? role : user.role;
    const updatedStatus = is_active !== undefined ? (is_active ? 1 : 0) : user.is_active;
    const updatedCode = employee_code !== undefined ? employee_code.trim() : user.employee_code;

    let updatedHash = user.password_hash;
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updatedHash = await bcrypt.hash(password, salt);
    }

    db.run(
      `UPDATE users 
       SET name = ?, department = ?, role = ?, is_active = ?, employee_code = ?, password_hash = ?
       WHERE id = ?`,
      [updatedName, updatedDept, updatedRole, updatedStatus, updatedCode, updatedHash, id]
    );

    const updatedUser = db.get(
      'SELECT id, name, email, role, department, employee_code, profile_photo_url, is_active, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Employee updated successfully',
      employee: updatedUser
    });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ error: 'Failed to update employee.' });
  }
});

/**
 * POST /api/admin/invites
 * Generate a new signup invite code
 */
router.post('/invites', (req, res) => {
  try {
    const { email, department = 'Engineering', role = 'employee', days_valid = 7 } = req.body;
    const code = 'INV-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(days_valid, 10));

    db.run(
      `INSERT INTO invites (code, email, department, role, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [code, email ? email.trim().toLowerCase() : null, department, role, expiresAt.toISOString()]
    );

    const invite = db.get('SELECT * FROM invites WHERE code = ?', [code]);

    res.status(201).json({
      message: 'Invite code generated successfully',
      invite
    });
  } catch (err) {
    console.error('Error generating invite:', err);
    res.status(500).json({ error: 'Failed to generate invite code.' });
  }
});

/**
 * GET /api/admin/invites
 * List invites
 */
router.get('/invites', (req, res) => {
  try {
    const invites = db.all('SELECT * FROM invites ORDER BY created_at DESC LIMIT 50');
    res.json({ invites });
  } catch (err) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ error: 'Failed to fetch invite codes.' });
  }
});

module.exports = router;
