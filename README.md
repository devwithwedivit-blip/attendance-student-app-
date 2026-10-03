# Future University — ERP & Attendance System

A comprehensive ERP and Attendance Management System for **Future University**, featuring three dedicated role portals: **Academic Head / Dean**, **Administration & HR**, and **Faculty & Staff** with live photographic verification.

---

## 🌟 Portals & Capabilities

### 🎓 1. Academic Head & Compliance Portal
1. **75% Mandatory Attendance Compliance Monitoring**:
   - Live roster of enrolled students with real-time percentage: `(Days Present / Total Working Days) × 100`.
   - Visual compliance tags:
     - $\ge 75\%$ Attendance: Marked **Compliant** (Emerald Green).
     - $< 75\%$ Attendance: Marked **Below Criteria (<75%)** (Coral Red alert).
     - $< 60\%$ Attendance: Flagged as **Critical Defaulters**.
2. **Automated Low Attendance Notice System**:
   - **Bulk 1-Click Action**: `"Auto-Issue Notices to All Below 75%"` to generate formal notices in batch.
   - **Individual Notice Dispatch**: Issue customized warnings with remediation deadlines (3, 7, 14 days).
   - Simulates in-app student notification and institutional email dispatch citing board eligibility regulations.
3. **Notice Audit & Acknowledgement Log**:
   - Historical log of all dispatched notices with student details, attendance % at time of issue, dispatch date, and deadline.
   - Tracks delivery and acknowledgement status (**Sent** vs **Acknowledged by Student**).
4. **Academic Committee CSV Export**:
   - One-click CSV download of non-compliant students for Academic Review Committee hearings.
5. **Multi-Criteria Roster Filtering**:
   - Filter by Department / Stream (Computer Science & Engineering, Information Technology, Management & MBA, Pharmacy / B.Pharm, BCA).
   - Filter by Batch / Semester (Sem 2, Sem 4, Sem 6, Sem 8).
   - Filter by Attendance Range: All, Below 75% Criteria, Below 60% Critical, Compliant.

---

### 🛡️ 2. Administrative & HR Portal
1. **Live Faculty & Staff Telemetry**: Real-time cards showing who is on campus, who is late (> 9:30 AM), and who is absent.
2. **Attendance Records & Photo Audit**: Search and filter by staff, department, and date range; inspect high-resolution verification photos.
3. **Suspicious Flag & Review System**: Mark check-in photos as suspicious (blurry, proxy person, bad angle) with notes.
4. **Staff Directory**: Add, update, and deactivate faculty/staff accounts; generate registration invite codes.
5. **Reports**: Faculty working hours, punctuality ratings, and CSV downloads.

---

### 👤 3. Faculty & Staff Check-In / Out Portal
1. **Photo-Verified Attendance**:
   - Check-in and check-out exclusively via device camera (`getUserMedia`).
   - Face reticle preview, instant **Retake** and **Confirm** review flow.
   - Automated GPS coordinate tagging and Google Maps link.
2. **Duplicate Prevention**: State machine prevents double check-ins.
3. **Live Shift Timer**: Real-time counter while on duty.
4. **Attendance History**: Daily paired hours calculation and digital profile badge.

---

## 🔑 Demo Credentials

| Role | Name | Email | Password | Access Details |
|---|---|---|---|---|
| 🎓 **Academic Head** | Dr. Rajesh Sharma | `dean@futureuniversity.edu.in` | `dean123` | Full Academic Roster, 75% Compliance, Notices, Committee CSV |
| 👑 **Administrator** | Alex Mercer | `admin@futureuniversity.edu.in` | `admin123` | HR & Administrative Management, Faculty Records, Live Monitor |
| 👤 **Faculty (CSE)** | Prof. Sarah Chen | `sarah.chen@futureuniversity.edu.in` | `password123` | Computer Science Dept • Camera Check-In/Out Hub |
| 🎒 **Student (CSE)** | Saatwik Gosain | `saatwik.gosain@futureuniversity.edu.in` | `password123` | Student Roll: CSE20 • Student Attendance Terminal & ID Card |

> 💡 **Quick 1-Click Login**: The login screen ([http://localhost:5173](http://localhost:5173)) features 1-click buttons to instantly log into any portal.

---

## 🛠️ Tech Stack

- **Institution**: Future University
- **Frontend**: React 19, Vite, Lucide Icons, Canvas Confetti, Vanilla CSS design system (glassmorphism, mobile-responsive).
- **Backend**: Node.js, Express.js, JWT Auth (`jsonwebtoken`), `bcryptjs`, Multer.
- **Database**: Native SQLite (`node:sqlite DatabaseSync` built into Node 24).
- **Storage**: Modular storage provider (`server/services/storageService.js`) targeting `/uploads` with S3-ready interface.

---

## ⚙️ Running Locally

### Backend Server (Port 5000)
```bash
cd server
npm install
npm run seed      # Populates Academic Head, Admin, Faculty, 14 Students, and Attendance Notices
npm start         # Runs on http://localhost:5000
```

### Frontend App (Port 5173)
```bash
cd client
npm install
npm run dev       # Runs on http://localhost:5173
```

### Run Integration Tests
```bash
cd server
node test_e2e.js  # Runs 25 comprehensive end-to-end tests
```

---

## 📋 Data Model

- **`users`**: `id`, `name`, `email`, `password_hash`, `role` (`dean` / `admin` / `employee`), `department`, `employee_code`, `profile_photo_url`, `is_active`, `created_at`
- **`students`**: `id`, `user_id`, `name`, `roll_number`, `email`, `department`, `semester`, `total_working_days`, `days_present`, `created_at`
- **`attendance_notices`**: `id`, `student_id`, `attendance_percent_at_time`, `notice_title`, `notice_message`, `deadline_date`, `sent_at`, `acknowledged` (0/1), `acknowledged_at`, `email_sent`
- **`attendance_records`**: `id`, `user_id`, `type` (`check_in` / `check_out`), `photo_url`, `timestamp`, `latitude`, `longitude`, `location_name`, `flagged`, `flag_reason`, `created_at`
- **`invites`**: `id`, `code`, `email`, `department`, `role`, `used`, `expires_at`
