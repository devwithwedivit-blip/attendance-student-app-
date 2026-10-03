-- Future University - ERP & Attendance Database Schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin', 'dean', 'student')),
  department TEXT NOT NULL DEFAULT 'Engineering',
  employee_code TEXT UNIQUE,
  profile_photo_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
  photo_url TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  latitude REAL,
  longitude REAL,
  location_name TEXT,
  flagged INTEGER NOT NULL DEFAULT 0,
  flag_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_timestamp ON attendance_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_records_type ON attendance_records(type);

CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  department TEXT NOT NULL DEFAULT 'Engineering',
  role TEXT NOT NULL DEFAULT 'employee',
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT
);

-- ========================================================
-- COLLEGE ERP: STUDENTS & ACADEMIC ATTENDANCE
-- ========================================================

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  roll_number TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  semester TEXT NOT NULL,
  total_working_days INTEGER NOT NULL DEFAULT 60,
  days_present INTEGER NOT NULL DEFAULT 45,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_students_semester ON students(semester);

CREATE TABLE IF NOT EXISTS attendance_notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  attendance_percent_at_time REAL NOT NULL,
  notice_title TEXT NOT NULL,
  notice_message TEXT NOT NULL,
  deadline_date TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  acknowledged INTEGER NOT NULL DEFAULT 0,
  acknowledged_at TEXT,
  email_sent INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notices_student_id ON attendance_notices(student_id);
CREATE INDEX IF NOT EXISTS idx_notices_acknowledged ON attendance_notices(acknowledged);
