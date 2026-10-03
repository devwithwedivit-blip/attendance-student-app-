const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Initialize adjustments table for student petitions
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_attendance_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      original_arrival_time TEXT,
      new_arrival_time TEXT NOT NULL,
      original_status TEXT,
      new_status TEXT NOT NULL,
      petition_reason TEXT NOT NULL,
      approved_by TEXT NOT NULL DEFAULT 'Prof. Sarah Chen (CSE)',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
} catch (e) {
  console.warn('Adjustments table check:', e.message);
}

function generateStudentDays(studentObj) {
  const student = studentObj || {
    id: 1,
    name: 'Saatwik Gosain',
    roll_number: 'FU-2024-CSE20',
    days_present: 54,
    total_working_days: 60
  };

  const studentId = student.id || 1;
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const totalDays = student.total_working_days || 60;
  const targetPresent = student.days_present !== undefined ? student.days_present : 54;
  const targetAbsent = totalDays - targetPresent;

  // Generate deterministic absent days for this student
  const absentDays = new Set();
  const seedMultiplier = (studentId * 7) % 11 + 3;
  for (let i = 1; i <= targetAbsent; i++) {
    const dayIndex = ((i * seedMultiplier + studentId * 5) % totalDays) + 1;
    absentDays.add(dayIndex);
  }

  // Generate deterministic late days (usually 4 to 8 days)
  const lateDays = new Map();
  const lateCount = Math.min(8, Math.max(3, Math.floor((60 - targetAbsent) * 0.15)));
  for (let i = 1; i <= lateCount; i++) {
    const dayIndex = ((i * 13 + studentId * 3) % totalDays) + 1;
    if (!absentDays.has(dayIndex)) {
      const lateMins = ((i * 3 + studentId * 2) % 25) + 2; // 2 to 26 mins late
      lateDays.set(dayIndex, lateMins);
    }
  }

  // Load existing petition adjustments for this student
  let adjustmentsMap = new Map();
  try {
    const adjs = db.all("SELECT * FROM student_attendance_adjustments WHERE student_id = ?", [studentId]);
    for (const a of adjs) {
      adjustmentsMap.set(a.date, a);
    }
  } catch (err) {
    console.warn('Could not query adjustments:', err.message);
  }

  const days = [];
  let d = new Date(2024, 6, 15); // Start mid-July
  const now = new Date(2024, 9, 3);
  let workingDay = 0;

  while (d <= now && workingDay < totalDays) {
    const dow = d.getDay();
    if (dow !== 0) { // Mon-Sat (6 days a week)
      workingDay++;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const isAbsent = absentDays.has(workingDay);
      const isLate = !isAbsent && lateDays.has(workingDay);
      const lateMins = isLate ? lateDays.get(workingDay) : 0;

      let arrivalTime = null;
      let departureTime = null;
      let hours = '0.0h';
      let status = 'Absent';

      if (!isAbsent) {
        if (isLate) {
          status = 'Late Comer';
          const arrHour = 10;
          const arrMin = String(lateMins).padStart(2, '0');
          arrivalTime = `${arrHour}:${arrMin} AM`;
          departureTime = '04:30 PM';
          const durationTotalMinutes = (16 * 60 + 30) - (10 * 60 + lateMins);
          const h = Math.floor(durationTotalMinutes / 60);
          const m = durationTotalMinutes % 60;
          hours = `${h}h ${m}m`;
        } else {
          status = 'On Time';
          const min = 30 + ((workingDay * 7 + studentId) % 28);
          arrivalTime = `09:${String(min).padStart(2, '0')} AM`;
          departureTime = '04:30 PM';
          const durationTotalMinutes = (16 * 60 + 30) - (9 * 60 + min);
          const h = Math.floor(durationTotalMinutes / 60);
          const m = durationTotalMinutes % 60;
          hours = `${h}h ${m}m`;
        }
      }

      // Check if an approved petition adjustment exists for this date
      const adj = adjustmentsMap.get(dateStr);
      let petitionApproved = false;
      let petitionReason = null;
      let approvedBy = null;

      if (adj) {
        arrivalTime = adj.new_arrival_time;
        status = adj.new_status;
        petitionApproved = true;
        petitionReason = adj.petition_reason;
        approvedBy = adj.approved_by;
        if (!departureTime) departureTime = '04:30 PM';
        hours = '7h 0m';
      }

      days.push({
        id: workingDay,
        student_id: studentId,
        date: dateStr,
        day: daysOfWeek[dow],
        status,
        cutoff_time: '10:00 AM',
        arrival_time: arrivalTime,
        departure_time: departureTime,
        late_minutes: isLate && !petitionApproved ? lateMins : null,
        hours,
        petition_approved: petitionApproved,
        petition_reason: petitionReason,
        approved_by: approvedBy
      });
    }
    d.setDate(d.getDate() + 1);
  }

  return days.reverse();
}

/**
 * GET /api/student/my-attendance
 * Returns the student's personal daily attendance register
 */
router.get('/my-attendance', verifyToken, (req, res) => {
  try {
    let student = null;
    try {
      student = db.get("SELECT * FROM students WHERE roll_number LIKE '%CSE20%' OR name LIKE '%Saatwik%' LIMIT 1");
    } catch {
      student = null;
    }

    if (!student) {
      student = {
        id: 1,
        name: 'Saatwik Gosain',
        roll_number: 'CSE20',
        department: 'Computer Science & Engineering',
        semester: 'Sem 4',
        total_working_days: 60,
        days_present: 54
      };
    }

    const days = generateStudentDays(student);
    const onTimeCount = days.filter(d => d.status.includes('On Time')).length;
    const lateCount = days.filter(d => d.status === 'Late Comer').length;
    const absentCount = days.filter(d => d.status === 'Absent').length;
    const presentCount = days.length - absentCount;
    const pct = Math.round((presentCount / days.length) * 1000) / 10;

    res.json({
      student: {
        id: student.id || 1,
        name: student.name,
        roll_number: 'CSE20',
        official_roll: student.roll_number,
        department: student.department,
        semester: student.semester,
        total_working_days: days.length,
        days_present: presentCount,
        on_time_days: onTimeCount,
        late_days: lateCount,
        days_absent: absentCount,
        attendance_percent: pct,
        is_compliant: pct >= 75
      },
      days
    });
  } catch (err) {
    console.error('Error fetching student attendance:', err);
    res.status(500).json({ error: 'Failed to fetch student attendance.' });
  }
});

/**
 * GET /api/student/department-students
 * Allows Faculty of CSE (e.g. Prof. Sarah Chen) to view all students in CSE department
 * and inspect their detailed 6-day week punctuality register
 */
router.get('/department-students', verifyToken, (req, res) => {
  try {
    const dept = req.query.department || req.user?.department || 'Computer Science & Engineering';
    const selectedStudentId = req.query.student_id ? parseInt(req.query.student_id, 10) : null;

    let students = [];
    try {
      students = db.all("SELECT * FROM students WHERE department LIKE ? ORDER BY name ASC", [`%${dept}%`]);
    } catch (e) {
      console.warn('Could not query students by department:', e.message);
    }

    if (!students || students.length === 0) {
      // Fallback if table is empty
      students = [
        { id: 1, name: 'Saatwik Gosain', roll_number: 'FU-2024-CSE20', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 54 },
        { id: 2, name: 'Aarav Mehta', roll_number: 'FU-2024-CS01', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 55 },
        { id: 3, name: 'Ishita Verma', roll_number: 'FU-2024-CS02', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 51 },
        { id: 4, name: 'Rohan Gupta', roll_number: 'FU-2024-CS03', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 46 },
        { id: 5, name: 'Ananya Singh', roll_number: 'FU-2024-CS04', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 43 },
        { id: 6, name: 'Kabir Sen', roll_number: 'FU-2024-CS05', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 38 },
        { id: 7, name: 'Diya Nair', roll_number: 'FU-2024-CS06', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 28 }
      ];
    }

    // Determine target student
    let activeStudent = null;
    if (selectedStudentId) {
      activeStudent = students.find(s => s.id === selectedStudentId);
    }
    if (!activeStudent) {
      activeStudent = students.find(s => s.roll_number.includes('CSE20') || s.name.includes('Saatwik')) || students[0];
    }

    // Generate days for active student
    const days = generateStudentDays(activeStudent);
    const onTimeCount = days.filter(d => d.status.includes('On Time')).length;
    const lateCount = days.filter(d => d.status === 'Late Comer').length;
    const absentCount = days.filter(d => d.status === 'Absent').length;
    const presentCount = days.length - absentCount;
    const pct = Math.round((presentCount / days.length) * 1000) / 10;

    // Department summary statistics
    let compliantCount = 0;
    let belowCriteriaCount = 0;
    for (const s of students) {
      const p = (s.days_present / s.total_working_days) * 100;
      if (p >= 75) compliantCount++;
      else belowCriteriaCount++;
    }

    res.json({
      department: dept,
      faculty_in_charge: req.user?.name || 'Prof. Sarah Chen',
      students: students.map(s => {
        const attPct = Math.round((s.days_present / s.total_working_days) * 1000) / 10;
        return {
          ...s,
          attendance_percent: attPct,
          is_compliant: attPct >= 75
        };
      }),
      selectedStudent: {
        ...activeStudent,
        on_time_days: onTimeCount,
        late_days: lateCount,
        days_absent: absentCount,
        days_present: presentCount,
        attendance_percent: pct,
        is_compliant: pct >= 75
      },
      days,
      summary: {
        total_students: students.length,
        compliant_students: compliantCount,
        below_criteria_students: belowCriteriaCount,
        compliance_rate: Math.round((compliantCount / students.length) * 100)
      }
    });
  } catch (err) {
    console.error('Error fetching department students:', err);
    res.status(500).json({ error: 'Failed to fetch department students.' });
  }
});

/**
 * POST /api/student/adjust-timing
 * Allows CSE Faculty (Prof. Sarah Chen) to change/adjust arrival timing on student petition
 */
router.post('/adjust-timing', verifyToken, (req, res) => {
  try {
    const {
      student_id,
      date,
      new_arrival_time,
      new_status = 'On Time (Petition Approved)',
      petition_reason
    } = req.body;

    if (!student_id || !date || !new_arrival_time) {
      return res.status(400).json({ error: 'student_id, date, and new_arrival_time are required.' });
    }

    const approvedBy = req.user?.name ? `${req.user.name} (Faculty)` : 'Prof. Sarah Chen (CSE)';
    const reason = petition_reason?.trim() || 'Student petition approved by CSE Faculty In-Charge';

    // Insert or replace adjustment record
    db.run(`
      INSERT INTO student_attendance_adjustments
        (student_id, date, new_arrival_time, new_status, petition_reason, approved_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [student_id, date, new_arrival_time, new_status, reason, approvedBy]);

    // Fetch student info
    const student = db.get("SELECT * FROM students WHERE id = ?", [student_id]);
    const updatedDays = generateStudentDays(student);

    res.json({
      success: true,
      message: `Timing updated to ${new_arrival_time} for ${date} on approved student petition.`,
      adjusted_date: date,
      new_status,
      petition_reason: reason,
      approved_by: approvedBy,
      updated_days: updatedDays
    });
  } catch (err) {
    console.error('Error adjusting student timing:', err);
    res.status(500).json({ error: 'Failed to adjust student attendance timing.' });
  }
});

/**
 * GET /api/student/department-export-csv
 * Exports CSE students attendance register in CSV format
 */
router.get('/department-export-csv', verifyToken, (req, res) => {
  try {
    const dept = req.query.department || 'Computer Science & Engineering';
    const studentId = req.query.student_id ? parseInt(req.query.student_id, 10) : null;

    let students = db.all("SELECT * FROM students WHERE department LIKE ?", [`%${dept}%`]);
    if (!students || students.length === 0) {
      students = [
        { id: 1, name: 'Saatwik Gosain', roll_number: 'FU-2024-CSE20', department: 'Computer Science & Engineering' }
      ];
    }

    let csv = "Student Roll,Student Name,Department,Date,Day of Week,Campus Arrival Time,University Cutoff,Punctuality Status,Late Duration,Petition Remarks,Campus Departure Time,Hours Logged\n";

    if (studentId) {
      const targetStudent = students.find(s => s.id === studentId) || students[0];
      const days = generateStudentDays(targetStudent);
      for (const d of days) {
        const lateDuration = d.late_minutes ? `${d.late_minutes} mins late` : d.status.includes('On Time') ? 'On Time (<= 10:00 AM)' : 'N/A';
        const remarks = d.petition_approved ? `Petition Approved: ${d.petition_reason} (by ${d.approved_by})` : 'Standard Biometric Log';
        csv += `"${targetStudent.roll_number}","${targetStudent.name}","${targetStudent.department}","${d.date}","${d.day}","${d.arrival_time || 'N/A'}","10:00 AM","${d.status}","${lateDuration}","${remarks}","${d.departure_time || 'N/A'}","${d.hours || 'N/A'}"\n`;
      }
    } else {
      for (const s of students) {
        const days = generateStudentDays(s);
        for (const d of days) {
          const lateDuration = d.late_minutes ? `${d.late_minutes} mins late` : d.status.includes('On Time') ? 'On Time (<= 10:00 AM)' : 'N/A';
          const remarks = d.petition_approved ? `Petition Approved: ${d.petition_reason} (by ${d.approved_by})` : 'Standard Biometric Log';
          csv += `"${s.roll_number}","${s.name}","${s.department}","${d.date}","${d.day}","${d.arrival_time || 'N/A'}","10:00 AM","${d.status}","${lateDuration}","${remarks}","${d.departure_time || 'N/A'}","${d.hours || 'N/A'}"\n`;
        }
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Future_University_CSE_Student_Attendance_Register.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Error exporting department CSV:', err);
    res.status(500).json({ error: 'Failed to generate department CSV.' });
  }
});

/**
 * GET /api/student/export-csv
 * Exports student attendance register in CSV format
 */
router.get('/export-csv', verifyToken, (req, res) => {
  try {
    const student = db.get("SELECT * FROM students WHERE roll_number LIKE '%CSE20%' OR name LIKE '%Saatwik%' LIMIT 1") || {
      id: 1,
      name: 'Saatwik Gosain',
      roll_number: 'FU-2024-CSE20',
      days_present: 54,
      total_working_days: 60
    };
    const days = generateStudentDays(student);
    let csv = "Date,Day of Week,Campus Arrival Time,University Cutoff,Punctuality Status,Late Duration,Campus Departure Time,Duration Logged\n";
    for (const d of days) {
      const lateDuration = d.late_minutes ? `${d.late_minutes} mins late` : d.status.includes('On Time') ? 'On Time (<= 10:00 AM)' : 'N/A';
      csv += `"${d.date}","${d.day}","${d.arrival_time || 'N/A'}","10:00 AM","${d.status}","${lateDuration}","${d.departure_time || 'N/A'}","${d.hours || 'N/A'}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Future_University_Attendance_Saatwik_Gosain_CSE20.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to generate CSV.' });
  }
});

module.exports = router;
