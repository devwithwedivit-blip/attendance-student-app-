import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Building,
  User,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

export default function StudentPortal() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchAttendance() {
      setLoading(true);
      try {
        const res = await api.get('/api/student/my-attendance');
        setAttendanceData(res);
      } catch (err) {
        console.error('Failed to load student attendance:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  // Default student metadata
  const student = attendanceData?.student || {
    name: user?.name?.replace(' (Student)', '') || 'Saatwik Gosain',
    roll_number: user?.employee_code || 'CSE20',
    department: user?.department || 'Computer Science & Engineering',
    semester: 'Sem 4',
    total_working_days: 60,
    days_present: 54,
    on_time_days: 46,
    late_days: 8,
    days_absent: 6,
    attendance_percent: 90.0,
    is_compliant: true
  };

  const rawDays = attendanceData?.days || [];

  // Filter days based on user selections
  const filteredDays = rawDays.filter(item => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'on_time' && item.status !== 'On Time') return false;
      if (statusFilter === 'late' && item.status !== 'Late Comer') return false;
      if (statusFilter === 'absent' && item.status !== 'Absent') return false;
    }
    if (monthFilter !== 'all') {
      const itemMonth = new Date(item.date).toLocaleString('en-US', { month: 'short' });
      if (itemMonth.toLowerCase() !== monthFilter.toLowerCase()) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDate = item.date?.toLowerCase().includes(q);
      const matchDay = item.day?.toLowerCase().includes(q);
      const matchStatus = item.status?.toLowerCase().includes(q);
      const matchTime = item.arrival_time?.toLowerCase().includes(q);
      if (!matchDate && !matchDay && !matchStatus && !matchTime) return false;
    }
    return true;
  });

  const onTimeCount = rawDays.filter(d => d.status === 'On Time').length;
  const lateCount = rawDays.filter(d => d.status === 'Late Comer').length;
  const absentCount = rawDays.filter(d => d.status === 'Absent').length;

  // Client-side CSV generator with exact arrival times and cutoff
  const handleDownloadCsv = () => {
    setDownloading(true);
    try {
      const headers = [
        'Date',
        'Day of Week',
        'Campus Arrival Time',
        'University Cutoff',
        'Punctuality Status',
        'Late Duration',
        'Campus Departure Time',
        'Duration Logged'
      ];

      const rows = rawDays.map(d => [
        `"${d.date}"`,
        `"${d.day}"`,
        `"${d.arrival_time || 'N/A'}"`,
        `"${d.cutoff_time || '10:00 AM'}"`,
        `"${d.status}"`,
        `"${d.late_minutes ? d.late_minutes + ' mins late' : d.status === 'On Time' ? 'On Time' : 'N/A'}"`,
        `"${d.departure_time || 'N/A'}"`,
        `"${d.hours || 'N/A'}"`
      ]);

      const csvMetadata = [
        `"Future University - Official Daily Attendance & Punctuality Register"`,
        `"Student Name:","${student.name}"`,
        `"Student Roll / Code:","${student.roll_number}"`,
        `"Department:","${student.department}"`,
        `"Semester:","${student.semester}"`,
        `"University Cutoff:","10:00 AM Sharp (Mon-Sat, 6 Days a Week)"`,
        `"Total Working Days:","${student.total_working_days}"`,
        `"On-Time Days (<= 10:00 AM):","${onTimeCount}"`,
        `"Late Comer Days (> 10:00 AM):","${lateCount}"`,
        `"Days Absent:","${absentCount}"`,
        `"Overall Attendance Rate:","${student.attendance_percent}%"`,
        `"Compliance Status:","${student.attendance_percent >= 75 ? 'COMPLIANT (Eligible for Final Examinations)' : 'NON-COMPLIANT (<75%)'}"`,
        `"Report Generated:","${new Date().toLocaleString('en-IN')}"`,
        ``
      ].join('\n');

      const csvContent = csvMetadata + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Future_University_Attendance_${student.name.replace(/\s+/g, '_')}_${student.roll_number}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate CSV: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const months = Array.from(new Set(rawDays.map(d => new Date(d.date).toLocaleString('en-US', { month: 'short' })))).filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Student Identity Card & Attendance Status */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid var(--border-medium)',
          borderLeft: '6px solid #1e3a8a',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
                fontWeight: 800,
                fontSize: '1.5rem'
              }}
            >
              SG
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                <h1 style={{ fontSize: '1.65rem', margin: 0, color: '#0f172a' }}>{student.name}</h1>
                <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
                  Roll: {student.roll_number}
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                  <ShieldCheck size={13} /> Compliant ({student.attendance_percent}%)
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building size={14} color="#64748b" /> {student.department}
                </span>
                <span>•</span>
                <span>Semester: <strong>{student.semester}</strong></span>
                <span>•</span>
                <span>Working Schedule: <strong>6 Days / Week (Mon–Sat)</strong></span>
              </div>
            </div>
          </div>

          {/* Direct CSV Download Button */}
          <div>
            <button
              className="btn btn-primary"
              onClick={handleDownloadCsv}
              disabled={downloading || rawDays.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.4rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                background: '#1e3a8a',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)'
              }}
            >
              <Download size={18} />
              {downloading ? 'Preparing CSV...' : 'Download Attendance (CSV)'}
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Directive Banner: 10:00 AM Cutoff */}
      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderLeft: '5px solid #2563eb',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}
      >
        <Clock size={20} color="#1d4ed8" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: '#1e3a8a', lineHeight: 1.5 }}>
          <strong>Institutional Attendance Rule:</strong> University morning reporting cutoff is <strong>10:00 AM sharp</strong> (6 days a week, Monday through Saturday). Students arriving at or before 10:00 AM are marked <strong>On Time</strong>. Any student arriving after 10:00 AM, even by a single minute (10:01 AM or later), is officially recorded as a <strong>Late Comer</strong>.
        </div>
      </div>

      {/* Attendance & Punctuality Metrics Cards */}
      <div className="grid-cols-4">
        <div className="stat-card" style={{ borderLeftColor: '#16a34a' }}>
          <div>
            <div className="stat-label">On-Time Arrivals</div>
            <div className="stat-val" style={{ color: '#15803d' }}>
              {onTimeCount} Days
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
              Arrived by 10:00 AM or before
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#d97706' }}>
          <div>
            <div className="stat-label">Late Comer Arrivals</div>
            <div className="stat-val" style={{ color: '#b45309' }}>
              {lateCount} Days
            </div>
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, marginTop: '0.25rem' }}>
              Arrived after 10:00 AM cutoff
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#f43f5e' }}>
          <div>
            <div className="stat-label">Days Absent</div>
            <div className="stat-val" style={{ color: '#be123c' }}>
              {absentCount} Days
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Unexcused leaves / missed days
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#fff1f2', color: '#be123c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#1e3a8a' }}>
          <div>
            <div className="stat-label">Total Attendance Rate</div>
            <div className="stat-val" style={{ color: student.attendance_percent >= 75 ? '#15803d' : '#b91c1c' }}>
              {student.attendance_percent}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              {student.days_present} Present / {student.total_working_days} Days (≥75% Criteria)
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
        </div>
      </div>

      {/* Daily Attendance Register & Filters */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
              6-Day Weekly Attendance & Arrival Register
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Institutional campus attendance for 6 working days a week (Monday to Saturday) with 10:00 AM arrival tracking
            </p>
          </div>

          <button
            className="btn btn-outline btn-sm"
            onClick={handleDownloadCsv}
            style={{ fontWeight: 600, fontSize: '0.8rem' }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem'
          }}
        >
          {/* Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Search Date / Day / Status</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search date or day..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
              />
              <Search
                size={14}
                color="#64748b"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Arrival Status Filter</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">All Days ({rawDays.length})</option>
              <option value="on_time">✅ On Time (≤ 10:00 AM) ({onTimeCount})</option>
              <option value="late">⏰ Late Comer (&gt; 10:00 AM) ({lateCount})</option>
              <option value="absent">❌ Absent ({absentCount})</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Academic Month</label>
            <select
              className="form-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">All Months</option>
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Days Table */}
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div
              style={{
                display: 'inline-block',
                width: 32,
                height: 32,
                border: '3px solid var(--border-medium)',
                borderTopColor: '#1e3a8a',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '1rem'
              }}
            />
            <p style={{ fontWeight: 600 }}>Loading official attendance registers...</p>
          </div>
        ) : filteredDays.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileSpreadsheet size={36} style={{ opacity: 0.4, margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No attendance entries match your filters.</p>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { setStatusFilter('all'); setMonthFilter('all'); setSearchQuery(''); }}
              style={{ marginTop: '0.75rem' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day of Week (6 Days/Wk)</th>
                  <th>Campus Arrival Time</th>
                  <th>Reporting Cutoff</th>
                  <th>Punctuality Status</th>
                  <th>Campus Departure Time</th>
                  <th>Hours Logged</th>
                </tr>
              </thead>
              <tbody>
                {filteredDays.map((entry, idx) => {
                  const isOnTime = entry.status === 'On Time';
                  const isLate = entry.status === 'Late Comer';
                  const isAbsent = entry.status === 'Absent';

                  return (
                    <tr
                      key={entry.id || entry.date + idx}
                      style={{
                        background: isAbsent ? '#fff5f5' : isLate ? '#fffdf0' : undefined
                      }}
                    >
                      <td style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {entry.date}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {entry.day}
                      </td>
                      <td>
                        {isAbsent ? (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Did Not Arrive</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: isLate ? '#b45309' : '#15803d' }}>
                            <Clock size={13} color={isLate ? '#d97706' : '#16a34a'} />
                            <span>{entry.arrival_time}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                          10:00 AM Sharp
                        </span>
                      </td>
                      <td>
                        {isOnTime ? (
                          <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CheckCircle2 size={12} /> On Time (≤ 10:00 AM)
                          </span>
                        ) : isLate ? (
                          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                            <AlertTriangle size={12} color="#b45309" /> Late Comer ({entry.late_minutes}m Late)
                          </span>
                        ) : (
                          <span className="badge badge-coral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <XCircle size={12} /> Absent
                          </span>
                        )}
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                        {entry.departure_time || 'N/A'}
                      </td>
                      <td style={{ fontWeight: 600, color: isAbsent ? '#94a3b8' : '#0f172a' }}>
                        {entry.hours || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            Showing <strong>{filteredDays.length}</strong> of <strong>{rawDays.length}</strong> academic records (6 Days/Week: Mon–Sat)
          </div>
          <div>
            Future University • Mandatory 10:00 AM Arrival Policy
          </div>
        </div>
      </div>
    </div>
  );
}
