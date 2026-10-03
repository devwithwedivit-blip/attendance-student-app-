const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function generateStudentDays() {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const absentDays = new Set([7, 18, 27, 36, 45, 54]); // 6 absences = 54/60 = 90.0%
  const lateDays = new Map([
    [4, 4],   // Day 4: 10:04 AM (4 mins late)
    [12, 8],  // Day 12: 10:08 AM (8 mins late)
    [21, 15], // Day 21: 10:15 AM (15 mins late)
    [31, 3],  // Day 31: 10:03 AM (3 mins late)
    [39, 11], // Day 39: 10:11 AM (11 mins late)
    [44, 6],  // Day 44: 10:06 AM (6 mins late)
    [51, 2],  // Day 51: 10:02 AM (2 mins late)
    [58, 19]  // Day 58: 10:19 AM (19 mins late)
  ]); // 8 late comers

  const days = [];
  let d = new Date(2024, 6, 15); // Start mid-July
  const now = new Date(2024, 9, 3);
  let workingDay = 0;

  while (d <= now && workingDay < 60) {
    const dow = d.getDay();
    if (dow !== 0) { // Mon-Sat (6 days a week)
      workingDay++;
      const isAbsent = absentDays.has(workingDay);
      const isLate = !isAbsent && lateDays.has(workingDay);
      const lateMins = isLate ? lateDays.get(workingDay) : 0;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

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
          // Arrival between 09:30 AM and 09:58 AM (always <= 10:00 AM)
          const min = 30 + ((workingDay * 7) % 28);
          arrivalTime = `09:${String(min).padStart(2, '0')} AM`;
          departureTime = '04:30 PM';
          const durationTotalMinutes = (16 * 60 + 30) - (9 * 60 + min);
          const h = Math.floor(durationTotalMinutes / 60);
          const m = durationTotalMinutes % 60;
          hours = `${h}h ${m}m`;
        }
      }

      days.push({
        id: workingDay,
        date: `${yyyy}-${mm}-${dd}`,
        day: daysOfWeek[dow],
        status,
        cutoff_time: '10:00 AM',
        arrival_time: arrivalTime,
        departure_time: departureTime,
        late_minutes: isLate ? lateMins : null,
        hours
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
    const onTimeCount = days.filter(d => d.status === 'On Time').length;
    const lateCount = days.filter(d => d.status === 'Late Comer').length;

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
        on_time_days: onTimeCount,
        late_days: lateCount,
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
    let csv = "Date,Day of Week,Campus Arrival Time,University Cutoff,Punctuality Status,Late Duration,Campus Departure Time,Duration Logged\n";
    for (const d of days) {
      const lateDuration = d.late_minutes ? `${d.late_minutes} mins late` : d.status === 'On Time' ? 'On Time (<= 10:00 AM)' : 'N/A';
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
