/**
 * In-browser mock backend engine
 * Provides 100% offline & static-hosting (Netlify/Vercel) capability with full state persistence.
 * When a live backend URL (VITE_API_URL) is not present or returns 404, this handles all requests seamlessly.
 */

const STORAGE_KEY_PREFIX = 'fu_erp_';

function getStorage(key, defaultValue) {
  try {
    const val = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('Storage save failed:', err);
  }
}

// Initial Mock Users
const INITIAL_USERS = [
  {
    id: 1,
    name: 'Dr. Rajesh Sharma (Academic Head)',
    email: 'dean@futureuniversity.edu.in',
    aliases: ['dean@stmaryconvent.edu.in', 'dean@rbmi.in'],
    password: 'dean123',
    role: 'dean',
    department: 'Academics',
    employee_code: 'FU-DEAN-001',
    profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    is_active: 1,
    created_at: '2023-01-15T09:00:00.000Z'
  },
  {
    id: 2,
    name: 'Alex Mercer (Admin)',
    email: 'admin@futureuniversity.edu.in',
    aliases: ['admin@stmaryconvent.edu.in', 'admin@rbmi.in'],
    password: 'admin123',
    role: 'admin',
    department: 'Management',
    employee_code: 'FU-ADM-001',
    profile_photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    is_active: 1,
    created_at: '2023-02-01T09:00:00.000Z'
  },
  {
    id: 3,
    name: 'Prof. Sarah Chen',
    email: 'sarah.chen@futureuniversity.edu.in',
    aliases: ['sarah.chen@stmaryconvent.edu.in', 'sarah.chen@rbmi.in', 'sarah@futureuniversity.edu.in', 'prof.sarah@futureuniversity.edu.in', 'sarah', 'sarah.chen'],
    password: 'password123',
    role: 'employee',
    department: 'Computer Science & Engineering',
    employee_code: 'FU-FAC-1001',
    profile_photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    is_active: 1,
    created_at: '2023-07-10T09:00:00.000Z'
  },
  {
    id: 4,
    name: 'Saatwik Gosain',
    email: 'saatwik.gosain@futureuniversity.edu.in',
    aliases: ['saatwik.gosain@students.futureuniversity.edu.in', 'cse20@futureuniversity.edu.in', 'marcus.vance@futureuniversity.edu.in'],
    password: 'password123',
    role: 'student',
    department: 'Computer Science & Engineering',
    employee_code: 'CSE20',
    profile_photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    is_active: 1,
    created_at: '2023-08-20T09:00:00.000Z'
  },
  {
    id: 5,
    name: 'Prof. Priya Sharma',
    email: 'priya.sharma@futureuniversity.edu.in',
    aliases: ['priya.sharma@stmaryconvent.edu.in', 'priya.sharma@rbmi.in'],
    password: 'password123',
    role: 'employee',
    department: 'Pharmacy / B.Pharm',
    employee_code: 'FU-FAC-1003',
    profile_photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    is_active: 1,
    created_at: '2023-09-01T09:00:00.000Z'
  },
  {
    id: 6,
    name: 'Prof. Alex Rivera',
    email: 'alex.rivera@futureuniversity.edu.in',
    aliases: ['alex.rivera@stmaryconvent.edu.in', 'alex.rivera@rbmi.in'],
    password: 'password123',
    role: 'employee',
    department: 'Information Technology',
    employee_code: 'FU-FAC-1004',
    profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    is_active: 1,
    created_at: '2023-09-15T09:00:00.000Z'
  }
];

// Initial Students
const INITIAL_STUDENTS = [
  { id: 1, name: 'Aarav Mehta', roll_number: 'FU-2024-CS01', email: 'aarav.mehta@students.futureuniversity.edu.in', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 55 },
  { id: 2, name: 'Ishita Verma', roll_number: 'FU-2024-CS02', email: 'ishita.verma@students.futureuniversity.edu.in', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 51 },
  { id: 3, name: 'Rohan Gupta', roll_number: 'FU-2024-CS03', email: 'rohan.gupta@students.futureuniversity.edu.in', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 46 },
  { id: 4, name: 'Ananya Singh', roll_number: 'FU-2024-CS04', email: 'ananya.singh@students.futureuniversity.edu.in', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 43 },
  { id: 5, name: 'Kabir Sen', roll_number: 'FU-2024-CS05', email: 'kabir.sen@students.futureuniversity.edu.in', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 38 },
  { id: 6, name: 'Diya Nair', roll_number: 'FU-2024-CS06', email: 'diya.nair@students.futureuniversity.edu.in', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 28 },
  { id: 7, name: 'Vikram Joshi', roll_number: 'FU-2024-IT01', email: 'vikram.joshi@students.futureuniversity.edu.in', department: 'Information Technology', semester: 'Sem 6', total_working_days: 60, days_present: 53 },
  { id: 8, name: 'Sneha Patel', roll_number: 'FU-2024-IT02', email: 'sneha.patel@students.futureuniversity.edu.in', department: 'Information Technology', semester: 'Sem 6', total_working_days: 60, days_present: 41 },
  { id: 9, name: 'Aditya Rao', roll_number: 'FU-2024-MBA01', email: 'aditya.rao@students.futureuniversity.edu.in', department: 'Management & MBA', semester: 'Sem 2', total_working_days: 60, days_present: 50 },
  { id: 10, name: 'Pooja Kulkarni', roll_number: 'FU-2024-MBA02', email: 'pooja.kulkarni@students.futureuniversity.edu.in', department: 'Management & MBA', semester: 'Sem 2', total_working_days: 60, days_present: 42 },
  { id: 11, name: 'Devendra Yadav', roll_number: 'FU-2024-PHARM01', email: 'devendra.yadav@students.futureuniversity.edu.in', department: 'Pharmacy / B.Pharm', semester: 'Sem 6', total_working_days: 60, days_present: 54 },
  { id: 12, name: 'Meera Pillai', roll_number: 'FU-2024-PHARM02', email: 'meera.pillai@students.futureuniversity.edu.in', department: 'Pharmacy / B.Pharm', semester: 'Sem 6', total_working_days: 60, days_present: 39 },
  { id: 13, name: 'Siddharth Roy', roll_number: 'FU-2024-BCA01', email: 'siddharth.roy@students.futureuniversity.edu.in', department: 'BCA', semester: 'Sem 2', total_working_days: 60, days_present: 52 },
  { id: 14, name: 'Tanvi Deshmukh', roll_number: 'FU-2024-BCA02', email: 'tanvi.deshmukh@students.futureuniversity.edu.in', department: 'BCA', semester: 'Sem 2', total_working_days: 60, days_present: 40 },
  { id: 15, name: 'Saatwik Gosain', roll_number: 'FU-2024-CSE20', email: 'saatwik.gosain@students.futureuniversity.edu.in', department: 'Computer Science & Engineering', semester: 'Sem 4', total_working_days: 60, days_present: 54 }
];

// Initial Notices
const INITIAL_NOTICES = [
  {
    id: 1,
    student_id: 6,
    student_name: 'Diya Nair',
    student_roll: 'FU-2024-CS06',
    department: 'Computer Science & Engineering',
    semester: 'Sem 4',
    attendance_percent: 46.7,
    notice_type: 'CRITICAL',
    deadline_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    acknowledged: 0,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 2,
    student_id: 5,
    student_name: 'Kabir Sen',
    student_roll: 'FU-2024-CS05',
    department: 'Computer Science & Engineering',
    semester: 'Sem 4',
    attendance_percent: 63.3,
    notice_type: 'WARNING',
    deadline_date: new Date(Date.now() + 6 * 86400000).toISOString(),
    acknowledged: 1,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

// Initial Attendance Records
const todayStr = new Date().toISOString().split('T')[0];
const INITIAL_RECORDS = [
  {
    id: 101,
    user_id: 3,
    type: 'check_in',
    timestamp: `${todayStr}T09:05:00.000Z`,
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    latitude: 28.6139,
    longitude: 77.2090,
    flagged: 0,
    flag_reason: null,
    user_name: 'Prof. Sarah Chen',
    user_email: 'sarah.chen@futureuniversity.edu.in',
    user_department: 'Computer Science & Engineering',
    employee_code: 'FU-FAC-1001'
  },
  {
    id: 102,
    user_id: 4,
    type: 'check_in',
    timestamp: `${todayStr}T09:12:00.000Z`,
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    latitude: 28.6139,
    longitude: 77.2090,
    flagged: 0,
    flag_reason: null,
    user_name: 'Saatwik Gosain',
    user_email: 'saatwik.gosain@futureuniversity.edu.in',
    user_department: 'Computer Science & Engineering',
    employee_code: 'CSE20'
  }
];

// State Getters and Setters
function getUsers() {
  return getStorage('users', INITIAL_USERS);
}
function saveUsers(users) {
  setStorage('users', users);
}

function getStudents() {
  return getStorage('students', INITIAL_STUDENTS);
}
function saveStudents(students) {
  setStorage('students', students);
}

function getStudentAdjustments() {
  return getStorage('student_adjustments', []);
}
function saveStudentAdjustments(adjs) {
  setStorage('student_adjustments', adjs);
}

function generateMockStudentDays(studentObj, adjustments = []) {
  const student = studentObj || { id: 15, name: 'Saatwik Gosain', roll_number: 'FU-2024-CSE20', days_present: 54, total_working_days: 60 };
  const studentId = student.id || 15;
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const totalDays = student.total_working_days || 60;
  const targetPresent = student.days_present !== undefined ? student.days_present : 54;
  const targetAbsent = totalDays - targetPresent;

  const absentDays = new Set();
  const seedMultiplier = (studentId * 7) % 11 + 3;
  for (let i = 1; i <= targetAbsent; i++) {
    const dayIndex = ((i * seedMultiplier + studentId * 5) % totalDays) + 1;
    absentDays.add(dayIndex);
  }

  const lateDays = new Map();
  const lateCount = Math.min(8, Math.max(3, Math.floor((60 - targetAbsent) * 0.15)));
  for (let i = 1; i <= lateCount; i++) {
    const dayIndex = ((i * 13 + studentId * 3) % totalDays) + 1;
    if (!absentDays.has(dayIndex)) {
      const lateMins = ((i * 3 + studentId * 2) % 25) + 2;
      lateDays.set(dayIndex, lateMins);
    }
  }

  const adjsMap = new Map();
  for (const a of adjustments) {
    if (a.student_id === studentId) {
      adjsMap.set(a.date, a);
    }
  }

  const days = [];
  let d = new Date(2024, 6, 15);
  const now = new Date(2024, 9, 3);
  let workingDay = 0;

  while (d <= now && workingDay < totalDays) {
    const dow = d.getDay();
    if (dow !== 0) {
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

      const adj = adjsMap.get(dateStr);
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

function getNotices() {
  return getStorage('notices', INITIAL_NOTICES);
}
function saveNotices(notices) {
  setStorage('notices', notices);
}

function getRecords() {
  return getStorage('records', INITIAL_RECORDS);
}
function saveRecords(records) {
  setStorage('records', records);
}

function getInvites() {
  return getStorage('invites', [
    { id: 1, code: 'FACULTY-2024', department: 'Computer Science & Engineering', role: 'employee', used: 0, created_at: new Date().toISOString() },
    { id: 2, code: 'DEAN-JOIN-99', department: 'Academics', role: 'dean', used: 0, created_at: new Date().toISOString() }
  ]);
}
function saveInvites(invites) {
  setStorage('invites', invites);
}

// Current logged in user helper
function getCurrentUser(token) {
  if (!token) return null;
  const users = getUsers();
  const found = users.find(u => 'mock-token-' + u.id === token);
  return found || users[0];
}

/**
 * Main Mock Request Handler
 */
export async function handleMockRequest(endpoint, options = {}) {
  // Simulate natural brief async network latency
  await new Promise(r => setTimeout(r, 120));

  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(endpoint, 'https://localhost');
  const path = url.pathname;
  const searchParams = url.searchParams;

  // Extract auth token
  const token = localStorage.getItem('veriface_token');
  const currentUser = getCurrentUser(token);

  let body = {};
  if (options.body) {
    if (typeof options.body === 'string') {
      try { body = JSON.parse(options.body); } catch { body = {}; }
    } else if (options.body instanceof FormData) {
      body = Object.fromEntries(options.body.entries());
      const photoFile = options.body.get('photo');
      if (photoFile && (photoFile instanceof Blob || photoFile instanceof File)) {
        try {
          body.photo = URL.createObjectURL(photoFile);
        } catch {
          body.photo = options.body.get('photo_base64') || null;
        }
      }
    } else {
      body = options.body;
    }
  }

  // 1. AUTH: Login
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    const users = getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();

    const user = users.find(u => 
      u.email.toLowerCase() === cleanEmail || 
      (u.aliases && u.aliases.some(a => a.toLowerCase() === cleanEmail))
    );

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // Check password (simple match for demo accounts)
    const validPass = user.password === password || password === 'password123' || password === 'admin123' || password === 'dean123';
    if (!validPass) {
      throw new Error('Invalid email or password.');
    }

    if (!user.is_active) {
      throw new Error('Your account has been deactivated. Please contact an administrator.');
    }

    const mockToken = 'mock-token-' + user.id;
    const safeUser = { ...user };
    delete safeUser.password;

    return {
      message: 'Login successful (Static Demo Mode)',
      token: mockToken,
      user: safeUser
    };
  }

  // 2. AUTH: Signup
  if (path === '/api/auth/signup' && method === 'POST') {
    const { name, email, password, department = 'Computer Science & Engineering', employee_code, invite_code } = body;
    const users = getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (users.find(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    let assignedRole = 'employee';
    let assignedDept = department;

    if (invite_code) {
      const invites = getInvites();
      const inv = invites.find(i => i.code === invite_code && !i.used);
      if (inv) {
        assignedRole = inv.role || assignedRole;
        assignedDept = inv.department || assignedDept;
        inv.used = 1;
        saveInvites(invites);
      }
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: assignedRole,
      department: assignedDept,
      employee_code: employee_code || `FU-FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      profile_photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      is_active: 1,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const safeUser = { ...newUser };
    delete safeUser.password;

    return {
      message: 'Account created successfully',
      token: 'mock-token-' + newUser.id,
      user: safeUser
    };
  }

  // 3. AUTH: Me
  if (path === '/api/auth/me') {
    if (!currentUser) throw new Error('Unauthorized');
    const safeUser = { ...currentUser };
    delete safeUser.password;
    return { user: safeUser };
  }

  // 3b. AUTH: Verify Invite
  if (path.startsWith('/api/auth/verify-invite/')) {
    const code = path.split('/')[4]?.trim();
    const invites = getInvites();
    const invite = invites.find(i => i.code === code && !i.used);
    if (!invite) {
      throw new Error('Invite code not found or already redeemed.');
    }
    return {
      valid: true,
      invite: {
        email: invite.email || '',
        department: invite.department,
        role: invite.role
      }
    };
  }

  // 4. ATTENDANCE: Today status
  if (path === '/api/attendance/today') {
    const userId = currentUser ? currentUser.id : 3;
    const records = getRecords().filter(r => r.user_id === userId);
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.timestamp.startsWith(today));

    let status = 'NOT_CHECKED_IN';
    let activeCheckIn = null;
    let latestCheckOut = null;
    let totalSeconds = 0;

    if (todayRecords.length > 0) {
      const last = todayRecords[todayRecords.length - 1];
      if (last.type === 'check_in') {
        status = 'CHECKED_IN';
        activeCheckIn = last;
      } else {
        status = 'CHECKED_OUT';
        latestCheckOut = last;
      }

      // calculate duration
      let inTime = null;
      for (const r of todayRecords) {
        if (r.type === 'check_in') inTime = new Date(r.timestamp).getTime();
        else if (r.type === 'check_out' && inTime) {
          totalSeconds += Math.max(0, Math.floor((new Date(r.timestamp).getTime() - inTime) / 1000));
          inTime = null;
        }
      }
      if (status === 'CHECKED_IN' && inTime) {
        totalSeconds += Math.max(0, Math.floor((Date.now() - inTime) / 1000));
      }
    }

    return {
      today,
      status,
      activeCheckIn,
      latestCheckOut,
      firstCheckIn: todayRecords.find(r => r.type === 'check_in')?.timestamp || null,
      records: todayRecords,
      todayRecords,
      totalSeconds,
      has_checked_in: status !== 'NOT_CHECKED_IN',
      has_checked_out: status === 'CHECKED_OUT'
    };
  }

  // 5. ATTENDANCE: Check In
  if (path === '/api/attendance/check-in' && method === 'POST') {
    if (body.face_verified !== 'true' && body.face_verified !== true) {
      throw new Error('Biometric Security Violation: Live human face must be verified inside the circle before check-in.');
    }

    const userId = currentUser ? currentUser.id : 3;
    const records = getRecords();
    
    // Photo handling: if blob/base64 is passed, store or use sample avatar
    let photoUrl = body.photo_preview || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80';
    if (body.photo && typeof body.photo === 'string' && body.photo.startsWith('data:')) {
      photoUrl = body.photo;
    }

    const newRecord = {
      id: Date.now(),
      user_id: userId,
      type: 'check_in',
      timestamp: new Date().toISOString(),
      photo_url: photoUrl,
      latitude: body.latitude || 28.6139,
      longitude: body.longitude || 77.2090,
      flagged: 0,
      flag_reason: null,
      user_name: currentUser?.name || 'Faculty Member',
      user_email: currentUser?.email || 'faculty@futureuniversity.edu.in',
      user_department: currentUser?.department || 'Computer Science & Engineering',
      employee_code: currentUser?.employee_code || 'FU-FAC-1001'
    };

    records.push(newRecord);
    saveRecords(records);

    return {
      message: 'Check-in recorded successfully! Camera biometric photo logged.',
      record: newRecord
    };
  }

  // 6. ATTENDANCE: Check Out
  if (path === '/api/attendance/check-out' && method === 'POST') {
    if (body.face_verified !== 'true' && body.face_verified !== true) {
      throw new Error('Biometric Security Violation: Live human face must be verified inside the circle before check-out.');
    }

    const userId = currentUser ? currentUser.id : 3;
    const records = getRecords();

    let photoUrl = body.photo_preview || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80';
    if (body.photo && typeof body.photo === 'string' && body.photo.startsWith('data:')) {
      photoUrl = body.photo;
    }

    const newRecord = {
      id: Date.now(),
      user_id: userId,
      type: 'check_out',
      timestamp: new Date().toISOString(),
      photo_url: photoUrl,
      latitude: body.latitude || 28.6139,
      longitude: body.longitude || 77.2090,
      flagged: 0,
      flag_reason: null,
      user_name: currentUser?.name || 'Faculty Member',
      user_email: currentUser?.email || 'faculty@futureuniversity.edu.in',
      user_department: currentUser?.department || 'Computer Science & Engineering',
      employee_code: currentUser?.employee_code || 'FU-FAC-1001'
    };

    records.push(newRecord);
    saveRecords(records);

    return {
      message: 'Check-out recorded successfully! Duty period logged.',
      record: newRecord
    };
  }

  // 7. ATTENDANCE: My Records (History)
  if (path === '/api/attendance/my-records') {
    const userId = currentUser ? currentUser.id : 3;
    const records = getRecords()
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const daysMap = {};
    for (const rec of records) {
      const dateKey = rec.timestamp.split('T')[0] || rec.timestamp.split(' ')[0];
      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          date: dateKey,
          records: [],
          checkIns: [],
          checkOuts: [],
          firstCheckIn: null,
          latestCheckOut: null,
          totalDurationSeconds: 0
        };
      }
      daysMap[dateKey].records.push(rec);
      if (rec.type === 'check_in') daysMap[dateKey].checkIns.push(rec);
      if (rec.type === 'check_out') daysMap[dateKey].checkOuts.push(rec);
    }

    const dailySummaries = Object.values(daysMap).map(day => {
      day.records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      day.firstCheckIn = day.checkIns[0] || null;
      day.latestCheckOut = day.checkOuts[day.checkOuts.length - 1] || null;

      let inTime = null;
      let totalSeconds = 0;
      for (const r of day.records) {
        if (r.type === 'check_in') inTime = new Date(r.timestamp).getTime();
        else if (r.type === 'check_out' && inTime) {
          totalSeconds += Math.max(0, Math.floor((new Date(r.timestamp).getTime() - inTime) / 1000));
          inTime = null;
        }
      }
      day.totalDurationSeconds = totalSeconds;
      return day;
    });

    return { records, dailySummaries };
  }

  // 8. DEAN: Dashboard
  if (path === '/api/dean/dashboard') {
    const students = getStudents();
    let compliantCount = 0;
    let belowCriteriaCount = 0;
    let criticalCount = 0;
    const deptStats = {};

    for (const s of students) {
      const pct = Math.round((s.days_present / s.total_working_days) * 1000) / 10;
      if (pct >= 75) compliantCount++;
      else {
        belowCriteriaCount++;
        if (pct < 60) criticalCount++;
      }

      if (!deptStats[s.department]) deptStats[s.department] = { total: 0, belowCriteria: 0 };
      deptStats[s.department].total++;
      if (pct < 75) deptStats[s.department].belowCriteria++;
    }

    const notices = getNotices();
    const noticesPending = notices.filter(n => !n.acknowledged).length;
    const noticesAcknowledged = notices.filter(n => n.acknowledged).length;

    return {
      institution: "Future University",
      portal: 'Dean Academics',
      totalStudents: students.length,
      compliantCount,
      belowCriteriaCount,
      criticalCount,
      complianceRate: students.length > 0 ? Math.round((compliantCount / students.length) * 100) : 100,
      totalNoticesSent: notices.length,
      noticesPending,
      pendingAcknowledgements: noticesPending,
      noticesAcknowledged,
      acknowledgedNotices: noticesAcknowledged,
      departmentStats: deptStats,
      deptStats
    };
  }

  // 9. DEAN: Students Roster
  if (path === '/api/dean/students') {
    const students = getStudents();
    const dept = searchParams.get('department');
    const sem = searchParams.get('semester');
    const range = searchParams.get('attendance_range');
    const query = (searchParams.get('search') || '').toLowerCase();

    let filtered = students.map(s => {
      const pct = Math.round((s.days_present / s.total_working_days) * 1000) / 10;
      return {
        ...s,
        attendance_percent: pct,
        status: pct >= 75 ? 'COMPLIANT' : pct >= 60 ? 'BORDERLINE' : 'CRITICAL'
      };
    });

    if (dept) filtered = filtered.filter(s => s.department === dept);
    if (sem) filtered = filtered.filter(s => s.semester === sem);
    if (range === 'critical' || range === 'below_60') filtered = filtered.filter(s => s.attendance_percent < 60);
    else if (range === 'below75' || range === 'below_75') filtered = filtered.filter(s => s.attendance_percent < 75);
    else if (range === 'above75' || range === 'compliant') filtered = filtered.filter(s => s.attendance_percent >= 75);

    if (query) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.roll_number.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
      );
    }

    return { students: filtered };
  }

  // 10. DEAN: Notices list
  if (path === '/api/dean/notices') {
    const notices = getNotices();
    const ack = searchParams.get('acknowledged');
    const dept = searchParams.get('department');

    let filtered = [...notices].reverse();
    if (ack !== null && ack !== '') {
      filtered = filtered.filter(n => String(n.acknowledged) === String(ack));
    }
    if (dept) {
      filtered = filtered.filter(n => n.department === dept);
    }

    return { notices: filtered };
  }

  // 11. DEAN: Send Notice
  if (path === '/api/dean/notices/send' && method === 'POST') {
    const students = getStudents();
    const student = students.find(s => s.id === Number(body.student_id));
    if (!student) throw new Error('Student not found');

    const pct = Math.round((student.days_present / student.total_working_days) * 1000) / 10;
    const notices = getNotices();

    const deadlineDays = Number(body.deadline_days) || 7;
    const deadlineDate = new Date(Date.now() + deadlineDays * 86400000).toISOString();

    const newNotice = {
      id: Date.now(),
      student_id: student.id,
      student_name: student.name,
      student_roll: student.roll_number,
      department: student.department,
      semester: student.semester,
      attendance_percent: pct,
      notice_type: pct < 60 ? 'CRITICAL' : 'WARNING',
      deadline_date: deadlineDate,
      custom_message: body.custom_message,
      acknowledged: 0,
      created_at: new Date().toISOString()
    };

    notices.push(newNotice);
    saveNotices(notices);

    return {
      message: `Notice successfully issued to ${student.name} (${student.roll_number})`,
      notice: newNotice
    };
  }

  // 12. DEAN: Auto-generate notices
  if (path === '/api/dean/notices/auto-generate' && method === 'POST') {
    const students = getStudents();
    const notices = getNotices();
    let generatedCount = 0;

    for (const student of students) {
      const pct = Math.round((student.days_present / student.total_working_days) * 1000) / 10;
      if (pct < 75) {
        // check if recent notice exists
        const exists = notices.some(n => n.student_id === student.id && !n.acknowledged);
        if (!exists) {
          notices.push({
            id: Date.now() + Math.random(),
            student_id: student.id,
            student_name: student.name,
            student_roll: student.roll_number,
            department: student.department,
            semester: student.semester,
            attendance_percent: pct,
            notice_type: pct < 60 ? 'CRITICAL' : 'WARNING',
            deadline_date: new Date(Date.now() + 7 * 86400000).toISOString(),
            acknowledged: 0,
            created_at: new Date().toISOString()
          });
          generatedCount++;
        }
      }
    }

    saveNotices(notices);
    return {
      message: `Auto-dispatched ${generatedCount} compliance warnings to defaulters.`,
      generatedCount
    };
  }

  // 13. DEAN: Acknowledge notice
  if (path.startsWith('/api/dean/notices/') && path.endsWith('/acknowledge') && method === 'PATCH') {
    const parts = path.split('/');
    const noticeId = Number(parts[4]);
    const notices = getNotices();
    const notice = notices.find(n => n.id === noticeId);
    if (!notice) throw new Error('Notice not found');
    notice.acknowledged = notice.acknowledged ? 0 : 1;
    saveNotices(notices);
    return { message: 'Status updated', acknowledged: notice.acknowledged };
  }

  // 14. ADMIN: Live Dashboard
  if (path === '/api/admin/live-dashboard') {
    const users = getUsers().filter(u => u.role === 'employee' && u.is_active);
    const records = getRecords();
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.timestamp.startsWith(today));

    const currentlyCheckedIn = [];
    const checkedOutToday = [];
    const absentToday = [];
    const lateArrivals = [];

    for (const emp of users) {
      const empRecs = todayRecords.filter(r => r.user_id === emp.id);
      if (empRecs.length === 0) {
        absentToday.push({ ...emp, status: 'ABSENT' });
      } else {
        const last = empRecs[empRecs.length - 1];
        if (last.type === 'check_in') {
          currentlyCheckedIn.push({
            ...emp,
            status: 'CHECKED_IN',
            activeCheckIn: last,
            checkInTime: last.timestamp,
            photoUrl: last.photo_url,
            latitude: last.latitude,
            longitude: last.longitude,
            durationSeconds: Math.floor((Date.now() - new Date(last.timestamp).getTime()) / 1000)
          });
        } else {
          checkedOutToday.push({
            ...emp,
            status: 'CHECKED_OUT',
            lastRecord: last,
            checkOutTime: last.timestamp,
            photoUrl: last.photo_url
          });
        }

        const first = empRecs[0];
        const hour = new Date(first.timestamp).getHours();
        const min = new Date(first.timestamp).getMinutes();
        if (hour > 9 || (hour === 9 && min > 30)) {
          lateArrivals.push({ ...emp, firstCheckInTime: first.timestamp });
        }
      }
    }

    return {
      today,
      metrics: {
        totalEmployees: users.length,
        checkedInNow: currentlyCheckedIn.length,
        checkedOutToday: checkedOutToday.length,
        absentToday: absentToday.length,
        lateToday: lateArrivals.length
      },
      currentlyCheckedIn,
      checkedOutToday,
      absentToday,
      lateArrivals,
      recentActivity: [...todayRecords].slice(-10).reverse()
    };
  }

  // 15. ADMIN: Records list
  if (path === '/api/admin/records') {
    const records = getRecords();
    const dept = searchParams.get('department');
    const type = searchParams.get('type');
    const flagged = searchParams.get('flagged');

    let filtered = [...records].reverse();
    if (dept) filtered = filtered.filter(r => r.user_department === dept);
    if (type) filtered = filtered.filter(r => r.type === type);
    if (flagged !== null && flagged !== '') filtered = filtered.filter(r => String(r.flagged) === String(flagged));

    return {
      records: filtered,
      total: filtered.length
    };
  }

  // 16. ADMIN: Flag Record
  if (path.match(/\/api\/admin\/records\/\d+\/flag/) && method === 'PATCH') {
    const id = Number(path.split('/')[4]);
    const records = getRecords();
    const record = records.find(r => r.id === id);
    if (record) {
      record.flagged = body.flagged ? 1 : 0;
      record.flag_reason = body.flag_reason || null;
      saveRecords(records);
    }
    return { message: 'Record updated', record };
  }

  // 17. ADMIN: Employees
  if (path === '/api/admin/employees') {
    if (method === 'GET') {
      const users = getUsers().filter(u => u.role === 'employee');
      return { employees: users };
    }
    if (method === 'POST') {
      const users = getUsers();
      const newEmp = {
        id: Date.now(),
        name: body.name,
        email: body.email,
        password: 'password123',
        role: 'employee',
        department: body.department,
        employee_code: body.employee_code || `SMCS-FAC-${Math.floor(1000 + Math.random() * 9000)}`,
        profile_photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.name)}`,
        is_active: 1,
        created_at: new Date().toISOString()
      };
      users.push(newEmp);
      saveUsers(users);
      return { message: 'Employee created', employee: newEmp };
    }
  }

  // 18. ADMIN: Employee update
  if (path.match(/\/api\/admin\/employees\/\d+/) && method === 'PATCH') {
    const id = Number(path.split('/')[4]);
    const users = getUsers();
    const emp = users.find(u => u.id === id);
    if (emp) {
      Object.assign(emp, body);
      saveUsers(users);
    }
    return { message: 'Updated', employee: emp };
  }

  // 19. ADMIN: Invites
  if (path === '/api/admin/invites') {
    if (method === 'GET') {
      return { invites: getInvites() };
    }
    if (method === 'POST') {
      const invites = getInvites();
      const newInv = {
        id: Date.now(),
        code: body.code || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
        department: body.department || 'Computer Science & Engineering',
        role: body.role || 'employee',
        used: 0,
        created_at: new Date().toISOString()
      };
      invites.push(newInv);
      saveInvites(invites);
      return { message: 'Invite created', invite: newInv };
    }
  }

  // 20. ADMIN: Reports
  if (path === '/api/admin/reports') {
    const users = getUsers().filter(u => u.role === 'employee');
    const records = getRecords();

    const summaries = users.map(u => {
      const userRecs = records.filter(r => r.user_id === u.id);
      return {
        id: u.id,
        name: u.name,
        department: u.department,
        employee_code: u.employee_code,
        profile_photo_url: u.profile_photo_url,
        totalHours: (userRecs.length * 4.2),
        totalCheckIns: userRecs.filter(r => r.type === 'check_in').length,
        totalCheckOuts: userRecs.filter(r => r.type === 'check_out').length,
        lateArrivalCount: 1,
        flaggedEventsCount: userRecs.filter(r => r.flagged).length
      };
    });

    return { summaries };
  }

  // 21. CSV Exports
  if (path === '/api/admin/export-csv' || path === '/api/dean/export-defaulters-csv') {
    const csvContent = 'Date,Code,Name,Department,Type,Time\n' +
      getRecords().map(r => `${r.timestamp.split('T')[0]},${r.employee_code || ''},"${r.user_name || ''}","${r.user_department || ''}",${r.type},${r.timestamp}`).join('\n');
    return new Blob([csvContent], { type: 'text/csv' });
  }

  // 22. STUDENT: My Attendance Register on Days (6 Days/Week: Mon-Sat, 10:00 AM Cutoff)
  if (path === '/api/student/my-attendance') {
    const students = getStudents();
    const student = students.find(s => s.roll_number.includes('CSE20') || s.name.includes('Saatwik')) || students[0];
    const adjs = getStudentAdjustments();
    const days = generateMockStudentDays(student, adjs);

    const onTimeCount = days.filter(d => d.status.includes('On Time')).length;
    const lateCount = days.filter(d => d.status === 'Late Comer').length;
    const absentCount = days.filter(d => d.status === 'Absent').length;
    const presentCount = days.length - absentCount;
    const pct = Math.round((presentCount / days.length) * 1000) / 10;

    return {
      student: {
        id: student.id,
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
    };
  }

  // 23. STUDENT: Export CSV
  if (path === '/api/student/export-csv') {
    const students = getStudents();
    const student = students.find(s => s.roll_number.includes('CSE20') || s.name.includes('Saatwik')) || students[0];
    const adjs = getStudentAdjustments();
    const days = generateMockStudentDays(student, adjs);

    let csv = "Date,Day of Week,Campus Arrival Time,University Cutoff,Punctuality Status,Late Duration,Campus Departure Time,Duration Logged\n";
    for (const d of days) {
      const lateDuration = d.late_minutes ? `${d.late_minutes} mins late` : d.status.includes('On Time') ? 'On Time (<= 10:00 AM)' : 'N/A';
      csv += `"${d.date}","${d.day}","${d.arrival_time || 'N/A'}","10:00 AM","${d.status}","${lateDuration}","${d.departure_time || 'N/A'}","${d.hours || 'N/A'}"\n`;
    }
    return new Blob([csv], { type: 'text/csv' });
  }

  // 24. FACULTY: CSE Department Students Register
  if (path === '/api/student/department-students') {
    const allStudents = getStudents();
    const dept = searchParams.get('department') || currentUser?.department || 'Computer Science & Engineering';
    const selectedStudentId = searchParams.get('student_id') ? parseInt(searchParams.get('student_id'), 10) : null;

    const deptStudents = allStudents.filter(s => s.department.toLowerCase().includes('computer science') || s.department.toLowerCase().includes('cse'));
    const studentsList = deptStudents.length > 0 ? deptStudents : allStudents.slice(0, 7);

    let activeStudent = null;
    if (selectedStudentId) {
      activeStudent = studentsList.find(s => s.id === selectedStudentId);
    }
    if (!activeStudent) {
      activeStudent = studentsList.find(s => s.roll_number.includes('CSE20') || s.name.includes('Saatwik')) || studentsList[0];
    }

    const adjs = getStudentAdjustments();
    const days = generateMockStudentDays(activeStudent, adjs);

    const onTimeCount = days.filter(d => d.status.includes('On Time')).length;
    const lateCount = days.filter(d => d.status === 'Late Comer').length;
    const absentCount = days.filter(d => d.status === 'Absent').length;
    const presentCount = days.length - absentCount;
    const pct = Math.round((presentCount / days.length) * 1000) / 10;

    let compliantCount = 0;
    let belowCriteriaCount = 0;
    for (const s of studentsList) {
      const p = (s.days_present / s.total_working_days) * 100;
      if (p >= 75) compliantCount++;
      else belowCriteriaCount++;
    }

    return {
      department: dept,
      faculty_in_charge: currentUser?.name || 'Prof. Sarah Chen',
      students: studentsList.map(s => {
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
        total_students: studentsList.length,
        compliant_students: compliantCount,
        below_criteria_students: belowCriteriaCount,
        compliance_rate: Math.round((compliantCount / studentsList.length) * 100)
      }
    };
  }

  // 25. FACULTY: Adjust Student Attendance Timing on Petition
  if (path === '/api/student/adjust-timing' && method === 'POST') {
    const { student_id, date, new_arrival_time, new_status = 'On Time (Petition Approved)', petition_reason } = body;
    if (!student_id || !date || !new_arrival_time) {
      throw new Error('student_id, date, and new_arrival_time are required.');
    }

    const adjs = getStudentAdjustments();
    const existingIndex = adjs.findIndex(a => a.student_id === parseInt(student_id, 10) && a.date === date);

    const adjustmentRecord = {
      id: Date.now(),
      student_id: parseInt(student_id, 10),
      date,
      new_arrival_time,
      new_status,
      petition_reason: petition_reason?.trim() || 'Student petition approved by CSE Faculty In-Charge',
      approved_by: currentUser?.name ? `${currentUser.name} (Faculty)` : 'Prof. Sarah Chen (CSE)',
      created_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      adjs[existingIndex] = adjustmentRecord;
    } else {
      adjs.push(adjustmentRecord);
    }
    saveStudentAdjustments(adjs);

    // Update student days present if changed from absent
    const students = getStudents();
    const st = students.find(s => s.id === parseInt(student_id, 10));
    const updatedDays = generateMockStudentDays(st, adjs);

    return {
      success: true,
      message: `Timing updated to ${new_arrival_time} for ${date} on approved student petition.`,
      adjusted_date: date,
      new_status,
      petition_reason: adjustmentRecord.petition_reason,
      approved_by: adjustmentRecord.approved_by,
      updated_days: updatedDays
    };
  }

  // 26. FACULTY: Department Export CSV
  if (path === '/api/student/department-export-csv') {
    const allStudents = getStudents();
    const deptStudents = allStudents.filter(s => s.department.toLowerCase().includes('computer science') || s.department.toLowerCase().includes('cse'));
    const studentsList = deptStudents.length > 0 ? deptStudents : allStudents.slice(0, 7);

    const studentIdParam = searchParams.get('student_id') ? parseInt(searchParams.get('student_id'), 10) : null;
    const adjs = getStudentAdjustments();

    let csv = "Student Roll,Student Name,Department,Date,Day of Week,Campus Arrival Time,University Cutoff,Punctuality Status,Late Duration,Petition Remarks,Campus Departure Time,Hours Logged\n";

    if (studentIdParam) {
      const targetStudent = studentsList.find(s => s.id === studentIdParam) || studentsList[0];
      const days = generateMockStudentDays(targetStudent, adjs);
      for (const d of days) {
        const lateDuration = d.late_minutes ? `${d.late_minutes} mins late` : d.status.includes('On Time') ? 'On Time (<= 10:00 AM)' : 'N/A';
        const remarks = d.petition_approved ? `Petition Approved: ${d.petition_reason} (by ${d.approved_by})` : 'Standard Biometric Log';
        csv += `"${targetStudent.roll_number}","${targetStudent.name}","${targetStudent.department}","${d.date}","${d.day}","${d.arrival_time || 'N/A'}","10:00 AM","${d.status}","${lateDuration}","${remarks}","${d.departure_time || 'N/A'}","${d.hours || 'N/A'}"\n`;
      }
    } else {
      for (const s of studentsList) {
        const days = generateMockStudentDays(s, adjs);
        for (const d of days) {
          const lateDuration = d.late_minutes ? `${d.late_minutes} mins late` : d.status.includes('On Time') ? 'On Time (<= 10:00 AM)' : 'N/A';
          const remarks = d.petition_approved ? `Petition Approved: ${d.petition_reason} (by ${d.approved_by})` : 'Standard Biometric Log';
          csv += `"${s.roll_number}","${s.name}","${s.department}","${d.date}","${d.day}","${d.arrival_time || 'N/A'}","10:00 AM","${d.status}","${lateDuration}","${remarks}","${d.departure_time || 'N/A'}","${d.hours || 'N/A'}"\n`;
        }
      }
    }

    return new Blob([csv], { type: 'text/csv' });
  }

  // Default fallback for unknown routes
  return { status: 'ok', message: 'Handled by in-browser mock engine' };
}
