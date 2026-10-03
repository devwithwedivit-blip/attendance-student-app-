const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('./index');

const PHOTOS_DIR = path.join(__dirname, '..', 'uploads', 'photos');
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

// Generate an attractive SVG badge/portrait for local offline demo stability
function generateSampleSvg(name, role, timeStr, statusColor = '#10b981') {
  const initials = name.split(' ').map(n => n[0]).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${statusColor}"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#grad)"/>
    <circle cx="200" cy="160" r="80" fill="url(#avatarGrad)" opacity="0.9"/>
    <text x="200" y="185" font-family="system-ui, sans-serif" font-size="52" font-weight="700" fill="#ffffff" text-anchor="middle">${initials}</text>
    <rect x="40" y="270" width="320" height="90" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="200" y="305" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#f8fafc" text-anchor="middle">${name}</text>
    <text x="200" y="332" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${role} • ${timeStr}</text>
    <circle cx="65" cy="315" r="8" fill="${statusColor}"/>
    <text x="320" y="50" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#64748b" text-anchor="end">Future University ERP</text>
  </svg>`;
}

async function seed() {
  console.log('🌱 Starting Future University ERP seed...');

  // Drop and re-apply schema to ensure updated constraints and tables take effect
  db.exec('DROP TABLE IF EXISTS attendance_notices;');
  db.exec('DROP TABLE IF EXISTS students;');
  db.exec('DROP TABLE IF EXISTS attendance_records;');
  db.exec('DROP TABLE IF EXISTS invites;');
  db.exec('DROP TABLE IF EXISTS users;');

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schemaSql);

  const defaultPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const deanPassword = await bcrypt.hash('dean123', 10);

  // 1. Create Dean / Academic Head (Primary: Future University, with aliases)
  const deanResult = db.run(
    `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
     VALUES (?, ?, ?, 'dean', 'Academics', 'FU-DEAN-001', ?)`,
    [
      'Dr. Rajesh Sharma (Academic Head)',
      'dean@futureuniversity.edu.in',
      deanPassword,
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
    ]
  );
  // Backwards-compatible aliases
  db.run(
    `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
     VALUES (?, ?, ?, 'dean', 'Academics', 'SMCS-DEAN-001', ?)`,
    [
      'Dr. Rajesh Sharma (Academic Head)',
      'dean@stmaryconvent.edu.in',
      deanPassword,
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
    ]
  );
  db.run(
    `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
     VALUES (?, ?, ?, 'dean', 'Academics', 'DEAN-001', ?)`,
    [
      'Dr. Rajesh Sharma (Academic Head)',
      'dean@rbmi.in',
      deanPassword,
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
    ]
  );
  console.log('✅ Academic Head created: dean@futureuniversity.edu.in / dean123');

  // 2. Create Admin (Primary: Future University, with aliases)
  const adminResult = db.run(
    `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
     VALUES (?, ?, ?, 'admin', 'Management', 'FU-ADM-001', ?)`,
    [
      'Alex Mercer (Admin)',
      'admin@futureuniversity.edu.in',
      adminPassword,
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80'
    ]
  );
  db.run(
    `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
     VALUES (?, ?, ?, 'admin', 'Management', 'SMCS-ADM-001', ?)`,
    [
      'Alex Mercer (Admin)',
      'admin@stmaryconvent.edu.in',
      adminPassword,
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80'
    ]
  );
  db.run(
    `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
     VALUES (?, ?, ?, 'admin', 'Management', 'ADM-001', ?)`,
    [
      'Alex Mercer (Admin)',
      'admin@rbmi.in',
      adminPassword,
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80'
    ]
  );
  console.log('✅ Admin created: admin@futureuniversity.edu.in / admin123');

  // 3. Create Sample Faculty / Staff / Students
  const sampleUsers = [
    {
      name: 'Prof. Sarah Chen',
      email: 'sarah.chen@futureuniversity.edu.in',
      aliasEmail: 'sarah.chen@stmaryconvent.edu.in',
      department: 'Computer Science & Engineering',
      code: 'FU-FAC-1001',
      role: 'employee',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'
    },
    {
      name: 'Saatwik Gosain (Student)',
      email: 'saatwik.gosain@futureuniversity.edu.in',
      aliasEmail: 'saatwik.gosain@stmaryconvent.edu.in',
      department: 'Computer Science & Engineering',
      code: 'CSE20',
      role: 'student',
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80'
    },
    {
      name: 'Prof. Priya Sharma',
      email: 'priya.sharma@futureuniversity.edu.in',
      aliasEmail: 'priya.sharma@stmaryconvent.edu.in',
      department: 'Pharmacy / B.Pharm',
      code: 'FU-FAC-1003',
      role: 'employee',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80'
    },
    {
      name: 'Prof. Alex Rivera',
      email: 'alex.rivera@futureuniversity.edu.in',
      aliasEmail: 'alex.rivera@stmaryconvent.edu.in',
      department: 'Information Technology',
      code: 'FU-FAC-1004',
      role: 'employee',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
    }
  ];

  const employeeIds = [];
  for (const emp of sampleUsers) {
    const userRole = emp.role || 'employee';
    const res = db.run(
      `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [emp.name, emp.email, defaultPassword, userRole, emp.department, emp.code, emp.photo]
    );
    employeeIds.push({ id: res.lastInsertRowid, ...emp });

    if (emp.aliasEmail) {
      db.run(
        `INSERT INTO users (name, email, password_hash, role, department, employee_code, profile_photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [emp.name, emp.aliasEmail, defaultPassword, userRole, emp.department, `${emp.code}-OLD`, emp.photo]
      );
    }
  }
  console.log(`✅ ${employeeIds.length} faculty/staff/students created.`);

  // 4. Create Students Roster for Future University
  const sampleStudents = [
    // Science Sem 4
    { name: 'Saatwik Gosain', roll: 'FU-2024-CSE20', email: 'saatwik.gosain@students.futureuniversity.edu.in', dept: 'Computer Science & Engineering', sem: 'Sem 4', total: 60, present: 54 }, // 90.0%
    { name: 'Aarav Mehta', roll: 'FU-2024-CS01', email: 'aarav.mehta@students.futureuniversity.edu.in', dept: 'Computer Science & Engineering', sem: 'Sem 4', total: 60, present: 55 }, // 91.7%
    { name: 'Ishita Verma', roll: 'FU-2024-CS02', email: 'ishita.verma@students.futureuniversity.edu.in', dept: 'Computer Science & Engineering', sem: 'Sem 4', total: 60, present: 51 }, // 85.0%
    { name: 'Rohan Gupta', roll: 'FU-2024-CS03', email: 'rohan.gupta@students.futureuniversity.edu.in', dept: 'Computer Science & Engineering', sem: 'Sem 4', total: 60, present: 46 }, // 76.7% Borderline
    { name: 'Ananya Singh', roll: 'FU-2024-CS04', email: 'ananya.singh@students.futureuniversity.edu.in', dept: 'Computer Science & Engineering', sem: 'Sem 4', total: 60, present: 43 }, // 71.7% BELOW
    { name: 'Kabir Sen', roll: 'FU-2024-CS05', email: 'kabir.sen@students.futureuniversity.edu.in', dept: 'Computer Science & Engineering', sem: 'Sem 4', total: 60, present: 38 }, // 63.3% BELOW
    { name: 'Diya Nair', roll: 'FU-2024-CS06', email: 'diya.nair@students.futureuniversity.edu.in', dept: 'Computer Science & Engineering', sem: 'Sem 4', total: 60, present: 28 }, // 46.7% CRITICAL

    // IT Sem 6
    { name: 'Vikram Joshi', roll: 'FU-2024-IT01', email: 'vikram.joshi@students.futureuniversity.edu.in', dept: 'Information Technology', sem: 'Sem 6', total: 60, present: 53 }, // 88.3%
    { name: 'Sneha Patel', roll: 'FU-2024-IT02', email: 'sneha.patel@students.futureuniversity.edu.in', dept: 'Information Technology', sem: 'Sem 6', total: 60, present: 41 }, // 68.3% BELOW

    // Management Sem 2
    { name: 'Aditya Rao', roll: 'FU-2024-MBA01', email: 'aditya.rao@students.futureuniversity.edu.in', dept: 'Management & MBA', sem: 'Sem 2', total: 60, present: 50 }, // 83.3%
    { name: 'Pooja Kulkarni', roll: 'FU-2024-MBA02', email: 'pooja.kulkarni@students.futureuniversity.edu.in', dept: 'Management & MBA', sem: 'Sem 2', total: 60, present: 42 }, // 70.0% BELOW

    // Pharmacy Sem 6
    { name: 'Devendra Yadav', roll: 'FU-2024-PHARM01', email: 'devendra.yadav@students.futureuniversity.edu.in', dept: 'Pharmacy / B.Pharm', sem: 'Sem 6', total: 60, present: 54 }, // 90.0%
    { name: 'Meera Pillai', roll: 'FU-2024-PHARM02', email: 'meera.pillai@students.futureuniversity.edu.in', dept: 'Pharmacy / B.Pharm', sem: 'Sem 6', total: 60, present: 39 }, // 65.0% BELOW

    // BCA Sem 2
    { name: 'Siddharth Roy', roll: 'FU-2024-BCA01', email: 'siddharth.roy@students.futureuniversity.edu.in', dept: 'BCA', sem: 'Sem 2', total: 60, present: 52 }, // 86.7%
    { name: 'Tanvi Deshmukh', roll: 'FU-2024-BCA02', email: 'tanvi.deshmukh@students.futureuniversity.edu.in', dept: 'BCA', sem: 'Sem 2', total: 60, present: 40 }  // 66.7% BELOW
  ];

  const studentMap = {};

  for (const s of sampleStudents) {
    const res = db.run(
      `INSERT INTO students (name, roll_number, email, department, semester, total_working_days, days_present)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.name, s.roll, s.email, s.dept, s.sem, s.total, s.present]
    );
    studentMap[s.roll] = { id: res.lastInsertRowid, ...s };
  }
  console.log(`✅ ${sampleStudents.length} students enrolled in database.`);

  // 5. Seed Attendance Notices
  const date3DaysAgo = new Date();
  date3DaysAgo.setDate(date3DaysAgo.getDate() - 3);

  const date2DaysAgo = new Date();
  date2DaysAgo.setDate(date2DaysAgo.getDate() - 2);

  const date1DayAgo = new Date();
  date1DayAgo.setDate(date1DayAgo.getDate() - 1);

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 5);
  const deadlineStr = deadline.toISOString().split('T')[0];

  // Ananya Singh: Notice Sent & Acknowledged
  const ananya = studentMap['FU-2024-CS04'];
  db.run(
    `INSERT INTO attendance_notices (student_id, attendance_percent_at_time, notice_title, notice_message, deadline_date, sent_at, acknowledged, acknowledged_at, email_sent)
     VALUES (?, 71.7, 'OFFICIAL NOTICE: Low Attendance Warning (<75% Criteria) - FU-2024-CS04', 
             'Dear Ananya Singh, your cumulative attendance is 71.7%, strictly below 75%. Please submit doctor certificate or justification to Office of Academic Affairs.', 
             ?, ?, 1, datetime('now', '-1 day'), 1)`,
    [ananya.id, deadlineStr, date3DaysAgo.toISOString()]
  );

  // Kabir Sen: Notice Sent & Pending Acknowledgement
  const kabir = studentMap['FU-2024-CS05'];
  db.run(
    `INSERT INTO attendance_notices (student_id, attendance_percent_at_time, notice_title, notice_message, deadline_date, sent_at, acknowledged, email_sent)
     VALUES (?, 63.3, 'OFFICIAL NOTICE: Low Attendance Warning (<75% Criteria) - FU-2024-CS05', 
             'Dear Kabir Sen, your attendance of 63.3% falls severely short of institutional norms. Immediate meeting with the Academic Head is mandatory.', 
             ?, ?, 0, 1)`,
    [kabir.id, deadlineStr, date2DaysAgo.toISOString()]
  );

  // Sneha Patel: Notice Sent & Acknowledged
  const sneha = studentMap['FU-2024-IT02'];
  db.run(
    `INSERT INTO attendance_notices (student_id, attendance_percent_at_time, notice_title, notice_message, deadline_date, sent_at, acknowledged, acknowledged_at, email_sent)
     VALUES (?, 68.3, 'OFFICIAL NOTICE: Low Attendance Warning (<75% Criteria) - FU-2024-IT02', 
             'Dear Sneha Patel, your attendance is 68.3%. Submit remediation assignment to the department head.', 
             ?, ?, 1, datetime('now', '-6 hours'), 1)`,
    [sneha.id, deadlineStr, date1DayAgo.toISOString()]
  );

  console.log('✅ Sample attendance notices seeded (Acknowledged & Pending).');

  // 6. Pre-generate sample captured photos for faculty
  const createdPhotos = {};
  for (let i = 0; i < employeeIds.length; i++) {
    const emp = employeeIds[i];
    const filenameIn = `sample-${emp.code}-in.svg`;
    const filenameOut = `sample-${emp.code}-out.svg`;

    fs.writeFileSync(
      path.join(PHOTOS_DIR, filenameIn),
      generateSampleSvg(emp.name, emp.department, 'CHECK-IN', '#10b981')
    );
    fs.writeFileSync(
      path.join(PHOTOS_DIR, filenameOut),
      generateSampleSvg(emp.name, emp.department, 'CHECK-OUT', '#f59e0b')
    );

    createdPhotos[emp.id] = {
      inPhoto: `/uploads/photos/${filenameIn}`,
      outPhoto: `/uploads/photos/${filenameOut}`
    };
  }

  // Historical Faculty Attendance (past 3 days)
  const today = new Date();
  function getDateWithOffset(daysAgo, hour, minute) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, Math.floor(Math.random() * 50), 0);
    return d.toISOString();
  }

  for (let daysAgo = 3; daysAgo >= 1; daysAgo--) {
    for (const emp of employeeIds) {
      const inTimestamp = getDateWithOffset(daysAgo, 9, 5);
      const outTimestamp = getDateWithOffset(daysAgo, 17, 30);

      db.run(
        `INSERT INTO attendance_records (user_id, type, photo_url, timestamp, latitude, longitude, location_name)
         VALUES (?, 'check_in', ?, ?, 28.3670, 79.4304, ?)`,
        [emp.id, createdPhotos[emp.id].inPhoto, inTimestamp, "Future University Campus - Main Academic Block"]
      );
      db.run(
        `INSERT INTO attendance_records (user_id, type, photo_url, timestamp, latitude, longitude, location_name)
         VALUES (?, 'check_out', ?, ?, 28.3670, 79.4304, ?)`,
        [emp.id, createdPhotos[emp.id].outPhoto, outTimestamp, "Future University Campus - Staff Gate"]
      );
    }
  }

  // Today: Prof. Sarah Chen is Checked in
  const sarah = employeeIds[0];
  db.run(
    `INSERT INTO attendance_records (user_id, type, photo_url, timestamp, latitude, longitude, location_name)
     VALUES (?, 'check_in', ?, ?, 28.3670, 79.4304, ?)`,
    [sarah.id, createdPhotos[sarah.id].inPhoto, getDateWithOffset(0, 9, 2), "Future University Campus - Science Lab Block"]
  );

  console.log('✅ Future University demo database seeded successfully!');
  console.log('==================================================');
  console.log('Credentials:');
  console.log('🎓 Academic Head: dean@futureuniversity.edu.in  / dean123');
  console.log('👑 Admin:         admin@futureuniversity.edu.in / admin123');
  console.log('👤 Faculty/Staff: sarah.chen@futureuniversity.edu.in / password123');
  console.log('🎒 Student:       saatwik.gosain@futureuniversity.edu.in / password123 (Roll: CSE20)');
  console.log('==================================================');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
