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
  Building,
  User,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { formatDate } from '../../utils/helpers';

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

  // Default student details if backend hasn't populated yet
  const student = attendanceData?.student || {
    name: user?.name?.replace(' (Student)', '') || 'Saatwik Gosain',
    roll_number: user?.employee_code || 'CSE20',
    department: user?.department || 'Computer Science & Engineering',
    semester: 'Sem 4',
    total_working_days: 60,
    days_present: 54,
    days_absent: 6,
    attendance_percent: 90.0,
    is_compliant: true
  };

  const rawDays = attendanceData?.days || [];

  // Filter days based on user selections
  const filteredDays = rawDays.filter(item => {
    if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (monthFilter !== 'all') {
      const itemMonth = new Date(item.date).toLocaleString('en-US', { month: 'short' });
      if (itemMonth.toLowerCase() !== monthFilter.toLowerCase()) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = item.subject?.toLowerCase().includes(q);
      const matchDate = item.date?.includes(q);
      const matchDay = item.day?.toLowerCase().includes(q);
      if (!matchSubject && !matchDate && !matchDay) return false;
    }
    return true;
  });

  // Client-side CSV generator for instant reliable export
  const handleDownloadCsv = () => {
    setDownloading(true);
    try {
      const headers = [
        'Date',
        'Day',
        'Subject / Lecture',
        'Attendance Status',
        'In Time',
        'Out Time',
        'Duration',
        'Attendance Credit'
      ];

      const rows = rawDays.map(d => [
        `"${d.date}"`,
        `"${d.day}"`,
        `"${d.subject}"`,
        `"${d.status}"`,
        `"${d.in_time || 'N/A'}"`,
        `"${d.out_time || 'N/A'}"`,
        `"${d.hours || 'N/A'}"`,
        `"${d.credit}"`
      ]);

      const csvMetadata = [
        `"Future University - Official Student Attendance Register"`,
        `"Student Name:","${student.name}"`,
        `"Roll Number / Code:","${student.roll_number}"`,
        `"Department:","${student.department}"`,
        `"Semester:","${student.semester}"`,
        `"Cumulative Attendance Rate:","${student.attendance_percent}%"`,
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
      {/* Student Identity Card & Compliance Banner */}
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
                <span>Academic Session: <strong>2024–2025</strong></span>
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

      {/* Attendance Metrics Cards */}
      <div className="grid-cols-4">
        <div className="stat-card" style={{ borderLeftColor: '#1e3a8a' }}>
          <div>
            <div className="stat-label">Attendance Rate</div>
            <div className="stat-val" style={{ color: student.attendance_percent >= 75 ? '#15803d' : '#b91c1c' }}>
              {student.attendance_percent}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Mandatory Minimum: 75%
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#16a34a' }}>
          <div>
            <div className="stat-label">Days Present</div>
            <div className="stat-val" style={{ color: '#15803d' }}>
              {student.days_present}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
              Lectures Attended
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#f43f5e' }}>
          <div>
            <div className="stat-label">Days Absent</div>
            <div className="stat-val" style={{ color: '#be123c' }}>
              {student.days_absent}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Leaves / Absences
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#fff1f2', color: '#be123c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#6366f1' }}>
          <div>
            <div className="stat-label">Total Working Days</div>
            <div className="stat-val">
              {student.total_working_days}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Official University Days
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Daily Attendance Register & Filters */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>Daily Attendance Register</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Day-by-day official attendance log for academic lectures and lab sessions
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
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Search Subject / Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search subject or date..."
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
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Attendance Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">All Days ({rawDays.length})</option>
              <option value="present">Present Only ({rawDays.filter(d => d.status === 'Present').length})</option>
              <option value="absent">Absent Only ({rawDays.filter(d => d.status === 'Absent').length})</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Month</label>
            <select
              className="form-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">All Academic Months</option>
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
                  <th>Day</th>
                  <th>Course / Lecture Subject</th>
                  <th>Lecture Timings</th>
                  <th>Status</th>
                  <th>Credit</th>
                </tr>
              </thead>
              <tbody>
                {filteredDays.map((entry, idx) => {
                  const isPresent = entry.status.toLowerCase() === 'present';
                  return (
                    <tr key={entry.id || entry.date + idx} style={{ background: isPresent ? undefined : '#fff5f5' }}>
                      <td style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {entry.date}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {entry.day}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{entry.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Biometric Lecture Terminal • Lecture Hall LH-204
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.825rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} color="#64748b" />
                          <span>{entry.in_time || '09:15 AM'} – {entry.out_time || '04:30 PM'}</span>
                        </div>
                        {entry.hours && (
                          <div style={{ fontSize: '0.725rem', color: '#15803d', fontWeight: 600, marginTop: '0.15rem' }}>
                            Logged: {entry.hours}
                          </div>
                        )}
                      </td>
                      <td>
                        {isPresent ? (
                          <span className="badge badge-emerald">
                            <CheckCircle2 size={12} /> Present
                          </span>
                        ) : (
                          <span className="badge badge-coral">
                            <XCircle size={12} /> Absent
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: isPresent ? '#15803d' : '#b91c1c' }}>
                        {entry.credit !== undefined ? entry.credit : isPresent ? '1.0' : '0.0'}
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
            Showing <strong>{filteredDays.length}</strong> of <strong>{rawDays.length}</strong> academic records
          </div>
          <div>
            Future University • Office of the Dean of Academics
          </div>
        </div>
      </div>
    </div>
  );
}
