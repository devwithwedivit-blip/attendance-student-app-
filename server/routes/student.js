const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function generateStudentDays() {
  const subjects = [
    'CS401: Design & Analysis of Algorithms',
    'CS402: Operating Systems & Architecture',
    'CS403: Database Management Systems & SQL',
    'CS404: Computer Networks & Communications',
    'CS405: Software Engineering & Agile Dev'
  ];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const absentDays = new Set([9, 19, 28, 38, 47, 56]); // 6 absences = 54/60 = 90.0%

  const days = [];
  let d = new Date(2024, 6, 15); // Start mid-July
  const now = new Date(2024, 9, 3);
  let workingDay = 0;

  while (d <= now && workingDay < 60) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) { // Mon-Fri
      workingDay++;
      const isAbsent = absentDays.has(workingDay);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      days.push({
        id: workingDay,
        date: `${yyyy}-${mm}-${dd}`,
        day: daysOfWeek[dow],
        subject: subjects[(workingDay - 1) % subjects.length],
        status: isAbsent ? 'Absent' : 'Present',
        in_time: isAbsent ? null : '09:15 AM',
        out_time: isAbsent ? null : '04:30 PM',
        hours: isAbsent ? '0.0h' : '7h 15m',
        credit: isAbsent ? '0.0' : '1.0'
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
        name: 'Saatwik Gosain',
        roll_number: 'CSE20',
        department: 'Computer Science & Engineering',
        semester: 'Sem 4',
        total_working_days: 60,
        days_present: 54
      };
    }

    const totalDays = student.total_working_days || 60;
    const presentDays = student.days_present || 54;
    const absentDays = totalDays - presentDays;
    const pct = Math.round((presentDays / totalDays) * 1000) / 10;

    const days = generateStudentDays();

    res.json({
      student: {
        id: student.id || 15,
        name: student.name,
        roll_number: 'CSE20',
        official_roll: student.roll_number,
        department: student.department,
        semester: student.semester,
        total_working_days: totalDays,
        days_present: presentDays,
        days_absent: absentDays,
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
 * GET /api/student/export-csv
 * Exports student attendance register in CSV format
 */
router.get('/export-csv', verifyToken, (req, res) => {
  try {
    const days = generateStudentDays();
    let csv = "Date,Day,Course / Subject,Status,In-Time,Out-Time,Duration,Credit\n";
    for (const d of days) {
      csv += `"${d.date}","${d.day}","${d.subject}","${d.status}","${d.in_time || 'N/A'}","${d.out_time || 'N/A'}","${d.hours || 'N/A'}","${d.credit}"\n`;
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
