const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply auth + admin role check to all admin routes
router.use(verifyToken, requireRole('admin'));

// Helper for local today date string
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/admin/live-dashboard
 * Real-time attendance state: who is checked in, late arrivals, absences, and KPI counts
 */
router.get('/live-dashboard', (req, res) => {
  try {
    const today = getTodayDateString();

    // 1. All active employees
    const employees = db.all(
      `SELECT id, name, email, department, employee_code, profile_photo_url 
       FROM users 
       WHERE role = 'employee' AND is_active = 1 
       ORDER BY name ASC`
    );

    // 2. All records for today
    const todayRecords = db.all(
      `SELECT r.*, u.name as user_name, u.email as user_email, u.department as user_department, u.profile_photo_url as user_avatar, u.employee_code
       FROM attendance_records r
       JOIN users u ON r.user_id = u.id
       WHERE date(r.timestamp) = date(?)
       ORDER BY r.timestamp ASC`,
      [today]
    );

    // Group today's records by user
    const recordsByUser = {};
    for (const rec of todayRecords) {
      if (!recordsByUser[rec.user_id]) {
        recordsByUser[rec.user_id] = [];
      }
      recordsByUser[rec.user_id].push(rec);
    }

    const currentlyCheckedIn = [];
    const checkedOutToday = [];
    const absentToday = [];
    const lateArrivals = [];

    // Consider check-in after 09:30 as "late"
    const LATE_THRESHOLD_HOUR = 9;
    const LATE_THRESHOLD_MINUTE = 30;

    for (const emp of employees) {
      const userRecs = recordsByUser[emp.id] || [];

      if (userRecs.length === 0) {
        absentToday.push({
          ...emp,
          status: 'ABSENT'
        });
      } else {
        const lastRec = userRecs[userRecs.length - 1];
        const firstIn = userRecs.find(r => r.type === 'check_in');

        // Check if late
        if (firstIn) {
          const inDate = new Date(firstIn.timestamp);
          const hour = inDate.getHours();
          const minute = inDate.getMinutes();
          if (hour > LATE_THRESHOLD_HOUR || (hour === LATE_THRESHOLD_HOUR && minute > LATE_THRESHOLD_MINUTE)) {
            lateArrivals.push({
              ...emp,
              checkInRecord: firstIn,
              checkInTime: firstIn.timestamp,
              timeFormatted: inDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
        }

        if (lastRec.type === 'check_in') {
          // Calculate active session duration
          const inTime = new Date(lastRec.timestamp).getTime();
          const durationSec = Math.max(0, Math.floor((Date.now() - inTime) / 1000));

          currentlyCheckedIn.push({
            ...emp,
            status: 'CHECKED_IN',
            activeCheckIn: lastRec,
            checkInTime: lastRec.timestamp,
            photoUrl: lastRec.photo_url,
            latitude: lastRec.latitude,
            longitude: lastRec.longitude,
            durationSeconds: durationSec
          });
        } else {
          checkedOutToday.push({
            ...emp,
            status: 'CHECKED_OUT',
            lastRecord: lastRec,
            checkOutTime: lastRec.timestamp,
            photoUrl: lastRec.photo_url
          });
        }
      }
    }

    res.json({
      today,
      metrics: {
        totalEmployees: employees.length,
        checkedInNow: currentlyCheckedIn.length,
        checkedOutToday: checkedOutToday.length,
        absentToday: absentToday.length,
        lateToday: lateArrivals.length
      },
      currentlyCheckedIn,
      checkedOutToday,
      absentToday,
      lateArrivals,
      recentActivity: todayRecords.slice(-10).reverse()
    });
  } catch (err) {
    console.error('Error fetching admin live dashboard:', err);
    res.status(500).json({ error: 'Failed to retrieve live dashboard statistics.' });
  }
});

/**
 * GET /api/admin/records
 * Filterable list of attendance records with user profile metadata
 */
router.get('/records', (req, res) => {
  try {
    const {
      user_id,
      department,
      start_date,
      end_date,
      type,
      flagged,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT r.*, 
             u.name as user_name, 
             u.email as user_email, 
             u.department as user_department, 
             u.employee_code,
             u.profile_photo_url as user_avatar
      FROM attendance_records r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      query += ` AND r.user_id = ?`;
      params.push(user_id);
    }
    if (department) {
      query += ` AND u.department = ?`;
      params.push(department);
    }
    if (start_date) {
      query += ` AND date(r.timestamp) >= date(?)`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND date(r.timestamp) <= date(?)`;
      params.push(end_date);
    }
    if (type) {
      query += ` AND r.type = ?`;
      params.push(type);
    }
    if (flagged !== undefined && flagged !== '') {
      query += ` AND r.flagged = ?`;
      params.push(flagged === 'true' || flagged === '1' ? 1 : 0);
    }

    query += ` ORDER BY r.timestamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const records = db.all(query, params);

    // Total count query for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM attendance_records r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const countParams = params.slice(0, -2);
    if (user_id) countQuery += ` AND r.user_id = ?`;
    if (department) countQuery += ` AND u.department = ?`;
    if (start_date) countQuery += ` AND date(r.timestamp) >= date(?)`;
    if (end_date) countQuery += ` AND date(r.timestamp) <= date(?)`;
    if (type) countQuery += ` AND r.type = ?`;
    if (flagged !== undefined && flagged !== '') countQuery += ` AND r.flagged = ?`;

    const countResult = db.get(countQuery, countParams);

    res.json({
      total: countResult ? countResult.total : records.length,
      records
    });
  } catch (err) {
    console.error('Error fetching admin records:', err);
    res.status(500).json({ error: 'Failed to retrieve attendance records.' });
  }
});

/**
 * PATCH /api/admin/records/:id/flag
 * Flags or unflags a check-in/out record as suspicious
 */
router.patch('/records/:id/flag', (req, res) => {
  try {
    const { id } = req.params;
    const { flagged, flag_reason } = req.body;

    const existing = db.get('SELECT * FROM attendance_records WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }

    const flagVal = flagged ? 1 : 0;
    const reasonVal = flagged ? (flag_reason || 'Marked suspicious for manual review') : null;

    db.run(
      'UPDATE attendance_records SET flagged = ?, flag_reason = ? WHERE id = ?',
      [flagVal, reasonVal, id]
    );

    const updated = db.get(
      `SELECT r.*, u.name as user_name, u.email as user_email, u.department as user_department, u.employee_code
       FROM attendance_records r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    res.json({
      message: flagVal ? 'Record marked as suspicious.' : 'Record verified and unflagged.',
      record: updated
    });
  } catch (err) {
    console.error('Error updating flag status:', err);
    res.status(500).json({ error: 'Failed to update record flag status.' });
  }
});

/**
 * GET /api/admin/export-csv
 * Exports filtered records as a CSV download
 */
router.get('/export-csv', (req, res) => {
  try {
    const { user_id, department, start_date, end_date, flagged } = req.query;

    let query = `
      SELECT r.id, r.timestamp, r.type, r.photo_url, r.latitude, r.longitude, r.location_name, r.flagged, r.flag_reason,
             u.name as user_name, u.email as user_email, u.employee_code, u.department
      FROM attendance_records r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      query += ` AND r.user_id = ?`;
      params.push(user_id);
    }
    if (department) {
      query += ` AND u.department = ?`;
      params.push(department);
    }
    if (start_date) {
      query += ` AND date(r.timestamp) >= date(?)`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND date(r.timestamp) <= date(?)`;
      params.push(end_date);
    }
    if (flagged !== undefined && flagged !== '') {
      query += ` AND r.flagged = ?`;
      params.push(flagged === 'true' || flagged === '1' ? 1 : 0);
    }

    query += ` ORDER BY r.timestamp DESC`;

    const records = db.all(query, params);

    // Build CSV content
    const headers = [
      'Record ID',
      'Date & Time',
      'Employee Code',
      'Employee Name',
      'Email',
      'Department',
      'Event Type',
      'Latitude',
      'Longitude',
      'Location / Note',
      'Photo URL',
      'Is Flagged',
      'Flag Reason'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map(r => [
      r.id,
      r.timestamp,
      r.employee_code || '',
      r.user_name,
      r.user_email,
      r.department,
      r.type === 'check_in' ? 'Check In' : 'Check Out',
      r.latitude || '',
      r.longitude || '',
      r.location_name || '',
      r.photo_url,
      r.flagged ? 'YES (Suspicious)' : 'NO (Verified)',
      r.flag_reason || ''
    ].map(escapeCsv).join(','));

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-records-${getTodayDateString()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error generating CSV export:', err);
    res.status(500).json({ error: 'Failed to generate CSV export.' });
  }
});

/**
 * GET /api/admin/reports
 * Aggregated attendance summary per employee (total days present, hours worked, late count, flags)
 */
router.get('/reports', (req, res) => {
  try {
    const { start_date, end_date, department } = req.query;

    let userQuery = `SELECT id, name, email, department, employee_code FROM users WHERE role = 'employee' AND is_active = 1`;
    const userParams = [];
    if (department) {
      userQuery += ` AND department = ?`;
      userParams.push(department);
    }
    const employees = db.all(userQuery, userParams);

    let recQuery = `SELECT * FROM attendance_records WHERE 1=1`;
    const recParams = [];
    if (start_date) {
      recQuery += ` AND date(timestamp) >= date(?)`;
      recParams.push(start_date);
    }
    if (end_date) {
      recQuery += ` AND date(timestamp) <= date(?)`;
      recParams.push(end_date);
    }
    recQuery += ` ORDER BY timestamp ASC`;

    const records = db.all(recQuery, recParams);

    // Group records by user_id -> date
    const userRecordsMap = {};
    for (const r of records) {
      if (!userRecordsMap[r.user_id]) userRecordsMap[r.user_id] = {};
      const dateKey = r.timestamp.split('T')[0] || r.timestamp.split(' ')[0];
      if (!userRecordsMap[r.user_id][dateKey]) userRecordsMap[r.user_id][dateKey] = [];
      userRecordsMap[r.user_id][dateKey].push(r);
    }

    const summaries = employees.map(emp => {
      const datesObj = userRecordsMap[emp.id] || {};
      const datesWorked = Object.keys(datesObj);
      const totalDaysPresent = datesWorked.length;

      let totalSecondsWorked = 0;
      let lateArrivalCount = 0;
      let flaggedEventsCount = 0;

      for (const dateKey of datesWorked) {
        const dayRecs = datesObj[dateKey];
        const firstIn = dayRecs.find(r => r.type === 'check_in');

        // Check late (after 09:30)
        if (firstIn) {
          const inDate = new Date(firstIn.timestamp);
          if (inDate.getHours() > 9 || (inDate.getHours() === 9 && inDate.getMinutes() > 30)) {
            lateArrivalCount++;
          }
        }

        // Pair in & out
        let lastInTime = null;
        for (const r of dayRecs) {
          if (r.flagged) flaggedEventsCount++;
          if (r.type === 'check_in') {
            lastInTime = new Date(r.timestamp).getTime();
          } else if (r.type === 'check_out' && lastInTime) {
            const outT = new Date(r.timestamp).getTime();
            totalSecondsWorked += Math.max(0, Math.floor((outT - lastInTime) / 1000));
            lastInTime = null;
          }
        }
      }

      const totalHours = (totalSecondsWorked / 3600).toFixed(1);
      const avgHoursPerDay = totalDaysPresent > 0 ? (totalHours / totalDaysPresent).toFixed(1) : '0.0';

      return {
        ...emp,
        totalDaysPresent,
        totalHours: parseFloat(totalHours),
        avgHoursPerDay: parseFloat(avgHoursPerDay),
        lateArrivalCount,
        flaggedEventsCount
      };
    });

    res.json({
      startDate: start_date || 'All time',
      endDate: end_date || 'Today',
      summaries
    });
  } catch (err) {
    console.error('Error compiling reports:', err);
    res.status(500).json({ error: 'Failed to generate attendance reports.' });
  }
});

module.exports = router;
