import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Send,
  Download,
  Filter,
  Search,
  Sparkles,
  RefreshCw,
  BellRing,
  X,
  Clock,
  Building,
  FileText,
  ShieldAlert,
  Award
} from 'lucide-react';
import { api } from '../../utils/api';

export default function DeanDashboard() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [attendanceRange, setAttendanceRange] = useState('all');

  // Notice Modal
  const [activeNoticeStudent, setActiveNoticeStudent] = useState(null);
  const [deadlineDays, setDeadlineDays] = useState('7');
  const [customNoticeText, setCustomNoticeText] = useState('');
  const [dispatchingNotice, setDispatchingNotice] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [dashRes, studentsRes] = await Promise.all([
        api.get('/api/dean/dashboard'),
        api.get(
          `/api/dean/students?department=${encodeURIComponent(selectedDept)}&semester=${encodeURIComponent(
            selectedSem
          )}&attendance_range=${attendanceRange}&search=${encodeURIComponent(search)}`
        )
      ]);
      setStats(dashRes);
      setStudents(studentsRes.students || []);
    } catch (err) {
      console.error('Failed to load Dean data:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDept, selectedSem, attendanceRange, search]);

  const handleOpenNoticeModal = (student) => {
    setActiveNoticeStudent(student);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    const dlStr = deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    setDeadlineDays('7');
    setCustomNoticeText(
      `TO:\n${student.name}\nRoll No: ${student.roll_number}\nDepartment: ${student.department} (${student.semester})\nFuture University\n\n` +
      `SUBJECT: OFFICIAL WARNING NOTICE REGARDING SHORTAGE OF ATTENDANCE (< 75%)\n\n` +
      `Dear Student,\n\n` +
      `As per the records of the Academic Attendance Register for the current session, your cumulative attendance currently stands at ${student.attendance_percent}% (${student.days_present} days attended out of ${student.total_working_days} total working days).\n\n` +
      `Please take note that in accordance with Education Board Regulations and Future University Council Directives, a minimum of 75% attendance in theory lectures and practical classes is strictly mandatory to be eligible to appear in the Final Examinations.\n\n` +
      `In view of the above shortage, you are hereby directed to:\n` +
      `1. Report immediately in person to the Office of the Academic Head / Dean.\n` +
      `2. Submit valid documentary justification (medical certificates attested by authorized medical practitioner / approved institutional representation) no later than ${dlStr}.\n` +
      `3. Attend mandatory remedial academic tutorials scheduled by your Head of Department.\n\n` +
      `FAILURE TO COMPLY within the stipulated timeframe shall lead to automatic debarment from the issuance of Examination Admit Cards / Hall Tickets.\n\n` +
      `BY ORDER OF:\nOffice of Academic Affairs\nFuture University`
    );
  };

  const handleSendNotice = async () => {
    if (!activeNoticeStudent) return;
    setDispatchingNotice(true);
    try {
      const res = await api.post('/api/dean/notices/send', {
        student_id: activeNoticeStudent.id,
        deadline_days: deadlineDays,
        custom_message: customNoticeText
      });
      setSuccessBanner(res.message);
      setActiveNoticeStudent(null);
      await fetchDashboardData();
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err) {
      alert('Failed to send notice: ' + err.message);
    } finally {
      setDispatchingNotice(false);
    }
  };

  const handleAutoGenerateAll = async () => {
    const belowCount = stats?.belowCriteriaCount || 0;
    if (
      !window.confirm(
        `Are you sure you want to officially issue Low Attendance Warning Notices to all ${belowCount} students whose attendance is currently below 75%?`
      )
    ) {
      return;
    }

    setAutoGenerating(true);
    try {
      const res = await api.post('/api/dean/notices/auto-generate', {});
      setSuccessBanner(res.message);
      await fetchDashboardData();
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err) {
      alert('Auto-generation failed: ' + err.message);
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.get(
        `/api/dean/export-csv?department=${encodeURIComponent(selectedDept)}&semester=${encodeURIComponent(
          selectedSem
        )}&attendance_range=${attendanceRange}`
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Future-University-Academic-Committee-Below75-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            width: 36,
            height: 36,
            border: '3px solid var(--border-medium)',
            borderTopColor: '#1e3a8a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Accessing Official Academic Attendance Registers...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Formal Ordinance Notice Banner */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderLeft: '5px solid #1e3a8a',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 40, height: 40, background: '#eff6ff', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a' }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
              Academic Council Compliance Directive: Minimum 75% Attendance Requirement
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
              In pursuant to University Ordinance & Examination By-laws Clause 4.2. Students falling below 75% face examination debarment.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-coral btn-sm"
            onClick={handleAutoGenerateAll}
            disabled={autoGenerating || stats?.belowCriteriaCount === 0}
            title="Auto-issues official low attendance notices to every student below 75%"
          >
            <Send size={13} />
            {autoGenerating ? 'Dispatching...' : `Bulk Auto-Issue Notices (${stats?.belowCriteriaCount || 0})`}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExportCsv}
          >
            <Download size={13} />
            Export Academic Committee List (CSV)
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: '#ecfdf5',
            border: '1px solid #86efac',
            borderRadius: 'var(--radius-sm)',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 700,
            fontSize: '0.875rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Institutional KPI Cards */}
      <div className="grid-cols-4">
        <div className="stat-card" style={{ borderLeftColor: '#1e3a8a' }}>
          <div>
            <div className="stat-label">Total Registered Students</div>
            <div className="stat-val">{stats?.totalStudents || 0}</div>
            <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.2rem' }}>
              Across 5 Academic Departments
            </div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#16a34a' }}>
          <div>
            <div className="stat-label">Compliant Candidates (≥ 75%)</div>
            <div className="stat-val" style={{ color: '#15803d' }}>
              {stats?.compliantCount || 0}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
              Eligible for Hall Ticket Issuance
            </div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#dc2626' }}>
          <div>
            <div className="stat-label">Below Criteria (&lt; 75%)</div>
            <div className="stat-val" style={{ color: '#b91c1c' }}>
              {stats?.belowCriteriaCount || 0}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#dc2626', fontWeight: 600, marginTop: '0.2rem' }}>
              Warning Notices Required
            </div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#d97706' }}>
          <div>
            <div className="stat-label">Formal Notices Dispatched</div>
            <div className="stat-val" style={{ color: '#b45309' }}>
              {stats?.totalNoticesSent || 0}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.2rem' }}>
              {stats?.pendingAcknowledgements || 0} pending student acknowledgement
            </div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BellRing size={22} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            alignItems: 'flex-end'
          }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Student / Roll No</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Name or Roll No..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
              />
              <Search
                size={14}
                color="#64748b"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Department</label>
            <select
              className="form-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Future University Departments / Sections</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Management & MBA">Management & MBA</option>
              <option value="Pharmacy / B.Pharm">Pharmacy / B.Pharm</option>
              <option value="BCA">BCA</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Batch / Semester</label>
            <select
              className="form-select"
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
            >
              <option value="">All Semesters</option>
              <option value="Sem 2">Semester 2</option>
              <option value="Sem 4">Semester 4</option>
              <option value="Sem 6">Semester 6</option>
              <option value="Sem 8">Semester 8</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Attendance Compliance Filter</label>
            <select
              className="form-select"
              value={attendanceRange}
              onChange={(e) => setAttendanceRange(e.target.value)}
            >
              <option value="all">All Attendance Rates</option>
              <option value="below_75">⚠️ Below 75% Criteria (Non-Compliant)</option>
              <option value="below_60">🚨 Critical Defaulters (&lt; 60%)</option>
              <option value="compliant">✅ Compliant (≥ 75%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official Student Attendance Register Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Attendance Record</th>
              <th>Cumulative %</th>
              <th>Compliance Status</th>
              <th>Official Notice Status</th>
              <th style={{ textAlign: 'right' }}>Dean Action</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No student records found matching the designated criteria.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const isBelow = student.attendance_percent < 75;
                const isCritical = student.attendance_percent < 60;

                return (
                  <tr
                    key={student.id}
                    style={{
                      background: isCritical
                        ? '#fff1f2'
                        : isBelow
                        ? '#fffbeb'
                        : undefined
                    }}
                  >
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#0f172a'
                        }}
                      >
                        {student.roll_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{student.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {student.email}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{student.department}</span>
                    </td>
                    <td>
                      <span className="badge badge-muted">{student.semester}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                        {student.days_present} <span style={{ color: '#64748b' }}>/ {student.total_working_days} Days</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ minWidth: '130px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.85rem', fontWeight: 700 }}>
                          <span style={{ color: isBelow ? '#b91c1c' : '#15803d' }}>
                            {student.attendance_percent}%
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Req: 75%
                          </span>
                        </div>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, student.attendance_percent)}%`,
                              height: '100%',
                              background: isCritical ? '#dc2626' : isBelow ? '#d97706' : '#16a34a'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      {isBelow ? (
                        <span className="badge badge-coral">
                          <AlertTriangle size={11} />
                          Below Criteria (&lt;75%)
                        </span>
                      ) : (
                        <span className="badge badge-emerald">
                          <CheckCircle2 size={11} />
                          Compliant (≥75%)
                        </span>
                      )}
                    </td>
                    <td>
                      {student.latest_notice ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span className={`badge ${student.latest_notice.acknowledged ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                            {student.latest_notice.acknowledged ? '✓ Acknowledged' : '✉️ Dispatched'}
                          </span>
                          <span style={{ fontSize: '0.675rem', color: '#64748b' }}>
                            Deadline: {student.latest_notice.deadline_date}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn btn-sm ${isBelow ? 'btn-coral' : 'btn-secondary'}`}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => handleOpenNoticeModal(student)}
                      >
                        <Mail size={13} />
                        {student.latest_notice ? 'Re-Issue Notice' : 'Issue Notice'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>
        Official Academic Records • Future University • Showing {students.length} Enrolled Students
      </div>

      {/* Official Notice Letterhead Modal */}
      {activeNoticeStudent && (
        <div className="modal-overlay" onClick={() => setActiveNoticeStudent(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: '680px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ background: '#f8fafc', borderBottom: '2px solid #0f172a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm)',
                    background: '#1e3a8a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>Official Notice of Attendance Shortage</h3>
                  <p style={{ fontSize: '0.75rem', color: '#475569' }}>
                    Office of Academic Affairs • Future University
                  </p>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setActiveNoticeStudent(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', background: '#f8fafc' }}>
              {/* Formal Letterhead Container */}
              <div className="official-letterhead">
                <div className="official-letterhead-header">
                  <div className="letterhead-title">FUTURE UNIVERSITY</div>
                  <div className="letterhead-sub">
                    Learn • Assimilate • Transcend • Main Campus
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.35rem', color: '#0f172a' }}>
                    OFFICE OF ACADEMIC AFFAIRS
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#475569', marginTop: '0.5rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.35rem' }}>
                    <span>Ref No: FU/ACAD/2024-25/NOT-{activeNoticeStudent.roll_number.split('-')[2] || '01'}</span>
                    <span>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Letter Body Textarea */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <textarea
                    className="form-input"
                    rows={10}
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                      border: '1px dashed #cbd5e1',
                      background: '#ffffff',
                      resize: 'vertical'
                    }}
                    value={customNoticeText}
                    onChange={(e) => setCustomNoticeText(e.target.value)}
                  />
                </div>

                {/* Official Sign-off and Stamp Seal */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #cbd5e1' }}>
                  <div className="letterhead-stamp">
                    OFFICIAL DISPATCH<br />FUTURE UNIVERSITY
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Dr. Rajesh Sharma, Ph.D.</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569' }}>Dean / Academic Head</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Future University</div>
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#475569',
                  marginTop: '1rem',
                  background: '#eff6ff',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #bfdbfe'
                }}
              >
                <Mail size={14} color="#1e3a8a" />
                <span>
                  This notice will be recorded in the student's institutional record and dispatched to{' '}
                  <strong>{activeNoticeStudent.email}</strong>.
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#f8fafc' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveNoticeStudent(null)}
                disabled={dispatchingNotice}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-coral"
                onClick={handleSendNotice}
                disabled={dispatchingNotice}
              >
                <Send size={14} />
                {dispatchingNotice ? 'Dispatching Official Notice...' : 'Sign & Dispatch Official Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
