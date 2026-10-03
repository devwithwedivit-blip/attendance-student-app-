const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Allow access to Dean Academics and Admin
router.use(verifyToken, requireRole('dean'));

// Helper to compute attendance percentage
function calculatePercentage(present, total) {
  if (!total || total <= 0) return 0;
  return Math.round((present / total) * 1000) / 10;
}

/**
 * GET /api/dean/dashboard
 * Summary statistics for Dean Academics
 */
router.get('/dashboard', (req, res) => {
  try {
    const students = db.all('SELECT * FROM students');
    
    let compliantCount = 0;
    let belowCriteriaCount = 0;
    let criticalCount = 0;

    const deptStats = {};

    for (const s of students) {
      const pct = calculatePercentage(s.days_present, s.total_working_days);
      if (pct >= 75) {
        compliantCount++;
      } else {
        belowCriteriaCount++;
        if (pct < 60) criticalCount++;
      }

      if (!deptStats[s.department]) {
        deptStats[s.department] = { total: 0, belowCriteria: 0 };
      }
      deptStats[s.department].total++;
      if (pct < 75) {
        deptStats[s.department].belowCriteria++;
      }
    }

    const noticesTotal = db.get('SELECT COUNT(*) as count FROM attendance_notices');
    const noticesPending = db.get('SELECT COUNT(*) as count FROM attendance_notices WHERE acknowledged = 0');
    const noticesAcknowledged = db.get('SELECT COUNT(*) as count FROM attendance_notices WHERE acknowledged = 1');

    res.json({
      institution: "Rajshree Institutions",
      portal: 'Dean Academics',
      totalStudents: students.length,
      compliantCount,
      belowCriteriaCount,
      criticalCount,
      complianceRate: students.length > 0 ? Math.round((compliantCount / students.length) * 100) : 100,
      totalNoticesSent: noticesTotal?.count || 0,
      pendingAcknowledgements: noticesPending?.count || 0,
      acknowledgedNotices: noticesAcknowledged?.count || 0,
      deptStats
    });
  } catch (err) {
    console.error('Error fetching dean dashboard:', err);
    res.status(500).json({ error: 'Failed to retrieve Dean dashboard metrics.' });
  }
});

/**
 * GET /api/dean/students
 * Filterable student roster with live attendance percentage & compliance status
 */
router.get('/students', (req, res) => {
  try {
    const { department, semester, attendance_range, search } = req.query;

    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }
    if (semester) {
      query += ' AND semester = ?';
      params.push(semester);
    }
    if (search) {
      query += ' AND (LOWER(name) LIKE ? OR LOWER(roll_number) LIKE ? OR LOWER(email) LIKE ?)';
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY department ASC, roll_number ASC';

    const rawStudents = db.all(query, params);

    // Compute percentage and filter by attendance range if specified
    const enriched = rawStudents.map(s => {
      const pct = calculatePercentage(s.days_present, s.total_working_days);
      const isCompliant = pct >= 75;

      // Check latest notice
      const latestNotice = db.get(
        `SELECT id, sent_at, deadline_date, acknowledged, acknowledged_at 
         FROM attendance_notices 
         WHERE student_id = ? 
         ORDER BY sent_at DESC LIMIT 1`,
        [s.id]
      );

      return {
        ...s,
        attendance_percent: pct,
        is_compliant: isCompliant,
        compliance_status: isCompliant ? 'Compliant' : 'Below Criteria',
        latest_notice: latestNotice || null
      };
    });

    let filtered = enriched;
    if (attendance_range === 'below_75') {
      filtered = enriched.filter(s => s.attendance_percent < 75);
    } else if (attendance_range === 'below_60') {
      filtered = enriched.filter(s => s.attendance_percent < 60);
    } else if (attendance_range === 'compliant') {
      filtered = enriched.filter(s => s.attendance_percent >= 75);
    }

    res.json({
      total: filtered.length,
      students: filtered
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to retrieve students roster.' });
  }
});

/**
 * POST /api/dean/notices/send
 * Generate & dispatch a low attendance notice to an individual student
 */
router.post('/notices/send', (req, res) => {
  try {
    const { student_id, deadline_days = 7, custom_message } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required.' });
    }

    const student = db.get('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const pct = calculatePercentage(student.days_present, student.total_working_days);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + parseInt(deadline_days, 10));
    const deadlineStr = deadline.toISOString().split('T')[0];

    const title = `OFFICIAL NOTICE: Low Attendance Warning (<75% Criteria) - ${student.roll_number}`;
    const defaultMsg = `Dear ${student.name} (${student.roll_number}), your current cumulative attendance in ${student.department} (${student.semester}) stands at ${pct}%, which is strictly below the mandatory 75% institutional compliance requirement of Rajshree Institutions. Failure to improve your attendance or submit medical / approved justification by ${deadlineStr} may result in debarment from semester final examinations. Please report immediately to the Academic Head / Dean Office.`;

    const message = custom_message || defaultMsg;

    const result = db.run(
      `INSERT INTO attendance_notices (student_id, attendance_percent_at_time, notice_title, notice_message, deadline_date, email_sent)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [student.id, pct, title, message, deadlineStr]
    );

    const notice = db.get('SELECT * FROM attendance_notices WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({
      message: `Low Attendance Notice successfully dispatched to ${student.name} (${student.email})`,
      notice: {
        ...notice,
        student_name: student.name,
        roll_number: student.roll_number,
        student_email: student.email
      }
    });
  } catch (err) {
    console.error('Error dispatching notice:', err);
    res.status(500).json({ error: 'Failed to dispatch low attendance notice.' });
  }
});

/**
 * POST /api/dean/notices/auto-generate
 * Bulk action: Auto-generates notices for all students whose attendance is < 75%
 */
router.post('/notices/auto-generate', (req, res) => {
  try {
    const students = db.all('SELECT * FROM students');
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    const deadlineStr = deadline.toISOString().split('T')[0];

    let generatedCount = 0;
    const generatedList = [];

    for (const student of students) {
      const pct = calculatePercentage(student.days_present, student.total_working_days);
      if (pct < 75) {
        // Check if notice already issued within the last 7 days
        const recent = db.get(
          `SELECT id FROM attendance_notices 
           WHERE student_id = ? AND date(sent_at) >= date('now', '-7 days')`,
          [student.id]
        );

        if (!recent) {
          const title = `OFFICIAL NOTICE: Low Attendance Warning (<75% Criteria) - ${student.roll_number}`;
          const message = `Dear ${student.name} (${student.roll_number}), your current cumulative attendance in ${student.department} (${student.semester}) stands at ${pct}%, which is below the mandatory 75% institutional compliance requirement of Rajshree Institutions. Submit justification or report to the Academic Head / Dean Office by ${deadlineStr}.`;

          const r = db.run(
            `INSERT INTO attendance_notices (student_id, attendance_percent_at_time, notice_title, notice_message, deadline_date, email_sent)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [student.id, pct, title, message, deadlineStr]
          );

          generatedCount++;
          generatedList.push({
            id: r.lastInsertRowid,
            student_id: student.id,
            name: student.name,
            roll_number: student.roll_number,
            department: student.department,
            attendance_percent: pct
          });
        }
      }
    }

    res.json({
      message: `Auto-generated ${generatedCount} Low Attendance Notices for students below 75% criteria.`,
      generatedCount,
      notices: generatedList
    });
  } catch (err) {
    console.error('Error auto-generating notices:', err);
    res.status(500).json({ error: 'Failed to auto-generate attendance notices.' });
  }
});

/**
 * GET /api/dean/notices
 * Notice audit log: view all notices issued, status, and acknowledgement
 */
router.get('/notices', (req, res) => {
  try {
    const { acknowledged, department } = req.query;

    let query = `
      SELECT n.*, s.name as student_name, s.roll_number, s.email as student_email, s.department, s.semester
      FROM attendance_notices n
      JOIN students s ON n.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (acknowledged !== undefined && acknowledged !== '') {
      query += ' AND n.acknowledged = ?';
      params.push(acknowledged === '1' || acknowledged === 'true' ? 1 : 0);
    }
    if (department) {
      query += ' AND s.department = ?';
      params.push(department);
    }

    query += ' ORDER BY n.sent_at DESC';

    const notices = db.all(query, params);

    res.json({
      total: notices.length,
      notices
    });
  } catch (err) {
    console.error('Error fetching notices:', err);
    res.status(500).json({ error: 'Failed to retrieve attendance notice log.' });
  }
});

/**
 * PATCH /api/dean/notices/:id/acknowledge
 * Acknowledges a notice by student or test toggle
 */
router.patch('/notices/:id/acknowledge', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT * FROM attendance_notices WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Notice record not found.' });
    }

    const newAcknowledged = existing.acknowledged ? 0 : 1;
    const ackAt = newAcknowledged ? new Date().toISOString() : null;

    db.run(
      'UPDATE attendance_notices SET acknowledged = ?, acknowledged_at = ? WHERE id = ?',
      [newAcknowledged, ackAt, id]
    );

    const updated = db.get(
      `SELECT n.*, s.name as student_name, s.roll_number 
       FROM attendance_notices n
       JOIN students s ON n.student_id = s.id
       WHERE n.id = ?`,
      [id]
    );

    res.json({
      message: newAcknowledged ? 'Notice acknowledged by student.' : 'Notice status reset to pending.',
      notice: updated
    });
  } catch (err) {
    console.error('Error acknowledging notice:', err);
    res.status(500).json({ error: 'Failed to update notice acknowledgement status.' });
  }
});

/**
 * GET /api/dean/export-csv
 * Download Below-75% Student List or filtered list as CSV for Academic Committee
 */
router.get('/export-csv', (req, res) => {
  try {
    const { department, semester, attendance_range = 'below_75' } = req.query;

    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }
    if (semester) {
      query += ' AND semester = ?';
      params.push(semester);
    }

    query += ' ORDER BY department ASC, roll_number ASC';
    const students = db.all(query, params);

    const enriched = students.map(s => {
      const pct = calculatePercentage(s.days_present, s.total_working_days);
      const isCompliant = pct >= 75;

      const notice = db.get(
        `SELECT sent_at, acknowledged FROM attendance_notices WHERE student_id = ? ORDER BY sent_at DESC LIMIT 1`,
        [s.id]
      );

      return {
        ...s,
        pct,
        isCompliant,
        noticeSent: notice ? 'YES' : 'NO',
        noticeAck: notice?.acknowledged ? 'ACKNOWLEDGED' : (notice ? 'PENDING' : 'N/A')
      };
    });

    let filtered = enriched;
    if (attendance_range === 'below_75') {
      filtered = enriched.filter(s => s.pct < 75);
    } else if (attendance_range === 'below_60') {
      filtered = enriched.filter(s => s.pct < 60);
    } else if (attendance_range === 'compliant') {
      filtered = enriched.filter(s => s.pct >= 75);
    }

    const headers = [
      'Roll Number',
      'Student Name',
      'Department',
      'Semester',
      'Days Present',
      'Total Working Days',
      'Attendance Percentage',
      'Compliance Status (<75%)',
      'Notice Issued',
      'Student Acknowledgement'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filtered.map(s => [
      s.roll_number,
      s.name,
      s.department,
      s.semester,
      s.days_present,
      s.total_working_days,
      `${s.pct}%`,
      s.isCompliant ? 'COMPLIANT' : 'BELOW CRITERIA (<75%)',
      s.noticeSent,
      s.noticeAck
    ].map(escapeCsv).join(','));

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Rajshree-Academic-Committee-Attendance-Below75-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error exporting dean CSV:', err);
    res.status(500).json({ error: 'Failed to generate academic committee CSV.' });
  }
});

module.exports = router;
