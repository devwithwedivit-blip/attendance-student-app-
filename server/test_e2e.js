const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Sample 1x1 green PNG base64 for test photo upload
const SAMPLE_BASE64_PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runTests() {
  console.log('🧪 Starting End-to-End System Integration Tests on', BASE_URL);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
  assert(healthRes.status === 'healthy', 'API health check is healthy');

  // ==========================================
  // DEAN ACADEMICS INTEGRATION TESTS
  // ==========================================
  console.log('\n--- 🎓 Testing Dean Academics Portal ---');

  // 2. Dean Login
  const deanLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dean@futureuniversity.edu.in', password: 'dean123' })
  }).then(r => r.json());

  assert(deanLogin.user?.role === 'dean', 'Dean login succeeded with role=dean');
  assert(deanLogin.user?.name.includes('Dr. Rajesh Sharma'), 'Dean profile name matched');
  const deanToken = deanLogin.token;

  // 3. Dean Dashboard KPIs
  const deanDash = await fetch(`${BASE_URL}/api/dean/dashboard`, {
    headers: { 'Authorization': `Bearer ${deanToken}` }
  }).then(r => r.json());

  assert(deanDash.institution === "Future University", "Institution name is Future University");
  assert(deanDash.totalStudents >= 14, `Dashboard reports ${deanDash.totalStudents} total students`);
  assert(deanDash.belowCriteriaCount > 0, `Dashboard reports ${deanDash.belowCriteriaCount} students below 75% criteria`);
  assert(deanDash.compliantCount > 0, `Dashboard reports ${deanDash.compliantCount} compliant students`);

  // 4. Students Roster & 75% Compliance Calculations
  const allStudents = await fetch(`${BASE_URL}/api/dean/students`, {
    headers: { 'Authorization': `Bearer ${deanToken}` }
  }).then(r => r.json());

  assert(allStudents.students.length >= 14, `Retrieved ${allStudents.students.length} students in roster`);
  const sampleStudent = allStudents.students[0];
  assert(typeof sampleStudent.attendance_percent === 'number', 'Student attendance percentage calculated as number');
  assert(sampleStudent.is_compliant === (sampleStudent.attendance_percent >= 75), 'Compliance boolean matches 75% threshold');

  // 5. Filter Students Below 75%
  const below75Students = await fetch(`${BASE_URL}/api/dean/students?attendance_range=below_75`, {
    headers: { 'Authorization': `Bearer ${deanToken}` }
  }).then(r => r.json());

  assert(below75Students.students.every(s => s.attendance_percent < 75), 'attendance_range=below_75 only returns students < 75%');
  const targetStudent = below75Students.students[0];

  // 6. Dispatch Individual Low Attendance Notice
  const noticeRes = await fetch(`${BASE_URL}/api/dean/notices/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${deanToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      student_id: targetStudent.id,
      deadline_days: 7,
      custom_message: `Urgent Warning: Attendance below 75% for ${targetStudent.name}. Report to Dean Academics.`
    })
  }).then(r => r.json());

  assert(Boolean(noticeRes.notice?.id), `Low attendance notice generated with ID #${noticeRes.notice?.id}`);
  assert(noticeRes.notice?.attendance_percent_at_time === targetStudent.attendance_percent, 'Notice records attendance % at time of issue');
  const generatedNoticeId = noticeRes.notice.id;

  // 7. Notice Audit Log
  const noticeLog = await fetch(`${BASE_URL}/api/dean/notices`, {
    headers: { 'Authorization': `Bearer ${deanToken}` }
  }).then(r => r.json());

  assert(noticeLog.notices.length >= 4, `Notice log contains ${noticeLog.notices.length} notices`);
  assert(noticeLog.notices.some(n => n.id === generatedNoticeId), 'Newly generated notice is visible in notice log');

  // 8. Student Acknowledge Notice
  const ackRes = await fetch(`${BASE_URL}/api/dean/notices/${generatedNoticeId}/acknowledge`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${deanToken}` }
  }).then(r => r.json());

  assert(ackRes.notice?.acknowledged === 1, 'Notice status toggled to Acknowledged');

  // 9. Auto-Generate Notices for All Below 75%
  const autoGenRes = await fetch(`${BASE_URL}/api/dean/notices/auto-generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${deanToken}`,
      'Content-Type': 'application/json'
    }
  }).then(r => r.json());

  assert(typeof autoGenRes.generatedCount === 'number', `Auto-generate completed with count=${autoGenRes.generatedCount}`);

  // 10. Academic Committee CSV Export
  const committeeCsvRes = await fetch(`${BASE_URL}/api/dean/export-csv?attendance_range=below_75`, {
    headers: { 'Authorization': `Bearer ${deanToken}` }
  });
  const committeeCsv = await committeeCsvRes.text();

  assert(committeeCsvRes.headers.get('content-type').includes('text/csv'), 'Committee export returned text/csv header');
  assert(committeeCsv.includes('Compliance Status (<75%)'), 'CSV includes compliance header column');
  assert(committeeCsv.includes('BELOW CRITERIA (<75%)'), 'CSV flags below 75% students');

  // ==========================================
  // FACULTY & ADMIN INTEGRATION TESTS
  // ==========================================
  console.log('\n--- 📸 Testing Faculty / Staff Check-In & Admin ---');

  // 11. Faculty Login
  const facultyLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarah.chen@futureuniversity.edu.in', password: 'password123' })
  }).then(r => r.json());

  assert(facultyLogin.user?.role === 'employee', 'Faculty login succeeded with role=employee');
  const facultyToken = facultyLogin.token;

  // 12. Check Today Attendance
  const todayRes = await fetch(`${BASE_URL}/api/attendance/today`, {
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  }).then(r => r.json());

  assert(todayRes.status === 'CHECKED_IN', 'Prof. Sarah Chen is currently CHECKED_IN today from seed');

  // 13. Perform Faculty Check-Out
  const checkOutRes = await fetch(`${BASE_URL}/api/attendance/check-out`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${facultyToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      photo_base64: SAMPLE_BASE64_PHOTO,
      latitude: 28.3670,
      longitude: 79.4304,
      location_name: "Future University Campus - Main Academic Block",
      face_verified: true
    })
  }).then(r => r.json());

  assert(checkOutRes.record?.type === 'check_out', 'Faculty check-out recorded with photo');

  // 14. Admin Login & Live Dashboard
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@futureuniversity.edu.in', password: 'admin123' })
  }).then(r => r.json());

  assert(adminLogin.user?.role === 'admin', 'Admin login successful');
  const adminToken = adminLogin.token;

  const adminDash = await fetch(`${BASE_URL}/api/admin/live-dashboard`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());

  assert(adminDash.metrics.totalEmployees >= 4, `Admin live dashboard reports ${adminDash.metrics.totalEmployees} faculty/staff members`);

  console.log('\n--------------------------------------------------');
  console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 ALL COLLEGE ERP & DEAN ACADEMICS INTEGRATION TESTS PASSED!');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
