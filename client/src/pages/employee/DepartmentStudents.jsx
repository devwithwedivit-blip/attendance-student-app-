import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Building,
  User,
  FileSpreadsheet,
  Edit3,
  Check,
  X,
  FileText,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

export default function DepartmentStudents() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Petition modal state
  const [petitionModalOpen, setPetitionModalOpen] = useState(false);
  const [activePetitionRow, setActivePetitionRow] = useState(null);
  const [newArrivalTime, setNewArrivalTime] = useState('09:50 AM');
  const [newStatus, setNewStatus] = useState('On Time (Petition Approved)');
  const [petitionReason, setPetitionReason] = useState('Bus transport breakdown petition verified by Faculty');
  const [submittingPetition, setSubmittingPetition] = useState(false);
  const [petitionFeedback, setPetitionFeedback] = useState(null);

  const fetchDepartmentData = async (studentId = null) => {
    setLoading(true);
    try {
      const endpoint = studentId
        ? `/api/student/department-students?student_id=${studentId}`
        : '/api/student/department-students';
      const res = await api.get(endpoint);
      setData(res);
      if (res?.selectedStudent?.id && !selectedStudentId) {
        setSelectedStudentId(res.selectedStudent.id);
      }
    } catch (err) {
      console.error('Failed to load department student attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData(selectedStudentId);
  }, [selectedStudentId]);

  const students = data?.students || [];
  const selectedStudent = data?.selectedStudent || students[0] || {};
  const rawDays = data?.days || [];

  // Filter table rows
  const filteredDays = rawDays.filter(item => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'on_time' && !item.status.includes('On Time')) return false;
      if (statusFilter === 'late' && item.status !== 'Late Comer') return false;
      if (statusFilter === 'absent' && item.status !== 'Absent') return false;
      if (statusFilter === 'petition' && !item.petition_approved) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDate = item.date?.toLowerCase().includes(q);
      const matchDay = item.day?.toLowerCase().includes(q);
      const matchStatus = item.status?.toLowerCase().includes(q);
      const matchTime = item.arrival_time?.toLowerCase().includes(q);
      const matchReason = item.petition_reason?.toLowerCase().includes(q);
      if (!matchDate && !matchDay && !matchStatus && !matchTime && !matchReason) return false;
    }
    return true;
  });

  const onTimeCount = rawDays.filter(d => d.status.includes('On Time')).length;
  const lateCount = rawDays.filter(d => d.status === 'Late Comer').length;
  const absentCount = rawDays.filter(d => d.status === 'Absent').length;
  const petitionCount = rawDays.filter(d => d.petition_approved).length;

  // Direct CSV Download: Department or Single Student
  const handleDownloadCsv = (singleStudent = false) => {
    setDownloading(true);
    try {
      if (singleStudent && selectedStudent) {
        const headers = [
          'Roll Number',
          'Student Name',
          'Department',
          'Date',
          'Day of Week',
          'Campus Arrival Time',
          'University Cutoff',
          'Punctuality Status',
          'Late Duration',
          'Petition Remarks',
          'Approved By',
          'Campus Departure Time',
          'Duration Logged'
        ];

        const rows = rawDays.map(d => [
          `"${selectedStudent.roll_number}"`,
          `"${selectedStudent.name}"`,
          `"${selectedStudent.department || 'Computer Science & Engineering'}"`,
          `"${d.date}"`,
          `"${d.day}"`,
          `"${d.arrival_time || 'N/A'}"`,
          `"${d.cutoff_time || '10:00 AM'}"`,
          `"${d.status}"`,
          `"${d.late_minutes ? d.late_minutes + ' mins late' : d.status.includes('On Time') ? 'On Time (<= 10:00 AM)' : 'N/A'}"`,
          `"${d.petition_approved ? d.petition_reason : 'Standard Biometric Log'}"`,
          `"${d.approved_by || 'N/A'}"`,
          `"${d.departure_time || 'N/A'}"`,
          `"${d.hours || 'N/A'}"`
        ]);

        const csvMetadata = [
          `"Future University - CSE Department Official Student Attendance Register"`,
          `"Faculty In-Charge:","${user?.name || 'Prof. Sarah Chen'}"`,
          `"Department:","Computer Science & Engineering"`,
          `"Student Name:","${selectedStudent.name}"`,
          `"Roll Number:","${selectedStudent.roll_number}"`,
          `"Working Schedule:","6 Days / Week (Monday to Saturday)"`,
          `"Official Reporting Cutoff:","10:00 AM Sharp"`,
          `"Total Working Days:","${selectedStudent.total_working_days || 60}"`,
          `"Days Present:","${selectedStudent.days_present || onTimeCount + lateCount}"`,
          `"On-Time Arrivals:","${onTimeCount}"`,
          `"Late Comer Arrivals:","${lateCount}"`,
          `"Petitions Approved:","${petitionCount}"`,
          `"Overall Attendance:","${selectedStudent.attendance_percent}%"`,
          `"Export Date:","${new Date().toLocaleString('en-IN')}"`,
          ``
        ].join('\n');

        const csvContent = csvMetadata + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Future_University_CSE_${selectedStudent.name.replace(/\s+/g, '_')}_Attendance.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Full department export
        const headers = [
          'Roll Number',
          'Student Name',
          'Department',
          'Date',
          'Day of Week',
          'Campus Arrival Time',
          'University Cutoff',
          'Punctuality Status',
          'Late Duration',
          'Petition Remarks',
          'Campus Departure Time',
          'Hours Logged'
        ];

        const rows = [];
        for (const s of students) {
          rows.push([
            `"${s.roll_number}"`,
            `"${s.name}"`,
            `"${s.department}"`,
            `"Summary"`,
            `"All Days"`,
            `"N/A"`,
            `"10:00 AM"`,
            `"${s.is_compliant ? 'Compliant' : 'Below 75%'}"`,
            `"${s.attendance_percent}%"`,
            `"${s.days_present} / ${s.total_working_days} Days"`,
            `"N/A"`,
            `"N/A"`
          ]);
        }

        const csvMetadata = [
          `"Future University - CSE Department Full Student Attendance Register"`,
          `"Faculty Authority:","${user?.name || 'Prof. Sarah Chen'}"`,
          `"Department:","Computer Science & Engineering"`,
          `"Total Enrolled Students:","${students.length}"`,
          `"Schedule:","6 Days / Week (Monday to Saturday)"`,
          `"Reporting Cutoff:","10:00 AM Sharp"`,
          `"Export Date:","${new Date().toLocaleString('en-IN')}"`,
          ``
        ].join('\n');

        const csvContent = csvMetadata + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Future_University_CSE_Department_All_Students_Attendance.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Failed to generate CSV: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Open Petition Modal for specific day
  const handleOpenPetition = (row) => {
    setActivePetitionRow(row);
    setNewArrivalTime(row.arrival_time && !row.arrival_time.includes('N/A') ? row.arrival_time : '09:50 AM');
    setNewStatus('On Time (Petition Approved)');
    setPetitionReason(row.petition_reason || 'Bus transit breakdown petition verified by Faculty');
    setPetitionModalOpen(true);
    setPetitionFeedback(null);
  };

  // Submit Petition Timing Adjustment
  const handleSubmitPetition = async (e) => {
    e.preventDefault();
    if (!activePetitionRow || !selectedStudent) return;
    setSubmittingPetition(true);
    try {
      const res = await api.post('/api/student/adjust-timing', {
        student_id: selectedStudent.id,
        date: activePetitionRow.date,
        new_arrival_time: newArrivalTime,
        new_status: newStatus,
        petition_reason: petitionReason
      });

      setPetitionFeedback({
        type: 'success',
        message: `Timing updated to ${newArrivalTime} for ${activePetitionRow.date} on approved student petition.`
      });

      // Refresh data
      await fetchDepartmentData(selectedStudent.id);
      setTimeout(() => {
        setPetitionModalOpen(false);
      }, 1200);
    } catch (err) {
      setPetitionFeedback({
        type: 'error',
        message: err.message || 'Failed to submit timing adjustment.'
      });
    } finally {
      setSubmittingPetition(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      {/* Faculty Department Authority Banner */}
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
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
                fontWeight: 800,
                fontSize: '1.5rem'
              }}
            >
              CSE
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                <h1 style={{ fontSize: '1.65rem', margin: 0, color: '#0f172a' }}>
                  CSE Department Student Attendance
                </h1>
                <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
                  Faculty Portal
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                  <ShieldCheck size={13} /> {user?.name || 'Prof. Sarah Chen'} In-Charge
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building size={14} color="#64748b" /> Computer Science & Engineering
                </span>
                <span>•</span>
                <span>Enrolled Students: <strong>{students.length}</strong></span>
                <span>•</span>
                <span>Reporting Schedule: <strong>6 Days / Week (10:00 AM Cutoff)</strong></span>
              </div>
            </div>
          </div>

          {/* Export CSV Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleDownloadCsv(true)}
              disabled={downloading || rawDays.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: '#1e3a8a',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)'
              }}
              title="Download CSV for currently selected student"
            >
              <Download size={16} />
              {downloading ? 'Preparing CSV...' : `Download ${selectedStudent.name || 'Student'} CSV`}
            </button>

            <button
              className="btn btn-outline"
              onClick={() => handleDownloadCsv(false)}
              disabled={downloading || students.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
              title="Download overall department summary CSV"
            >
              <FileSpreadsheet size={16} />
              Export All CSE CSV
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Directive Banner: 10:00 AM Rule & Petition Authority */}
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
          <strong>Faculty Petition Authority:</strong> As CSE Faculty In-Charge, you can inspect student arrival times (cutoff: <strong>10:00 AM sharp</strong>, Monday through Saturday). If a student was late or absent due to verified college transit delay or medical grounds, click <strong>"Adjust Timing (Petition)"</strong> to modify their arrival timestamp and grant official on-time exemption.
        </div>
      </div>

      {/* Student Selector Card */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="#1e3a8a" />
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#0f172a' }}>
              Select CSE Student
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Click student to inspect daily register & adjust timings
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {students.map(s => {
            const isSelected = s.id === selectedStudent.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid #1e3a8a' : '1px solid var(--border-medium)',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#1e3a8a' : '#334155',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(30, 58, 138, 0.15)' : 'none'
                }}
              >
                <span>{s.name}</span>
                <span
                  style={{
                    fontSize: '0.725rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    background: s.is_compliant ? '#ecfdf5' : '#fff1f2',
                    color: s.is_compliant ? '#15803d' : '#be123c',
                    fontWeight: 700
                  }}
                >
                  {s.attendance_percent}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Student Metrics Banner */}
      <div className="grid-cols-4">
        <div className="stat-card" style={{ borderLeftColor: '#16a34a' }}>
          <div>
            <div className="stat-label">On-Time Days</div>
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
            <div className="stat-label">Late Comer Days</div>
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

        <div className="stat-card" style={{ borderLeftColor: '#7c3aed' }}>
          <div>
            <div className="stat-label">Petitions Approved</div>
            <div className="stat-val" style={{ color: '#6d28d9' }}>
              {petitionCount} Approved
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, marginTop: '0.25rem' }}>
              Timing adjusted on petition
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={24} />
          </div>
        </div>
      </div>

      {/* Attendance Register & Filters */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
              6-Day Register: {selectedStudent.name} ({selectedStudent.roll_number})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Recorded on campus for 6 working days a week (Monday to Saturday) • 10:00 AM reporting cutoff
            </p>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleDownloadCsv(true)}
            style={{ fontWeight: 600, fontSize: '0.8rem', background: '#1e3a8a' }}
          >
            <Download size={14} /> Download {selectedStudent.name} CSV
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
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter Punctuality</label>
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
              <option value="petition">✨ Petition Approved ({petitionCount})</option>
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
            <p style={{ fontWeight: 600 }}>Loading department student register...</p>
          </div>
        ) : filteredDays.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileSpreadsheet size={36} style={{ opacity: 0.4, margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No attendance entries match your filters.</p>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
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
                  <th>Departure</th>
                  <th>Hours</th>
                  <th>Petition Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDays.map((entry, idx) => {
                  const isOnTime = entry.status.includes('On Time');
                  const isLate = entry.status === 'Late Comer';
                  const isAbsent = entry.status === 'Absent';
                  const isPetition = Boolean(entry.petition_approved);

                  return (
                    <tr
                      key={entry.id || entry.date + idx}
                      style={{
                        background: isPetition ? '#fbf8ff' : isAbsent ? '#fff5f5' : isLate ? '#fffdf0' : undefined
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
                        {isPetition ? (
                          <div>
                            <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                              <Sparkles size={12} /> Petition Approved (On Time)
                            </span>
                            {entry.petition_reason && (
                              <div style={{ fontSize: '0.72rem', color: '#6d28d9', marginTop: '0.2rem', fontStyle: 'italic' }}>
                                Ref: {entry.petition_reason}
                              </div>
                            )}
                          </div>
                        ) : isOnTime ? (
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
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenPetition(entry)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.6rem',
                            color: isPetition ? '#6d28d9' : '#1e3a8a',
                            borderColor: isPetition ? '#ddd6fe' : '#bfdbfe'
                          }}
                          title="Change arrival timing on student petition"
                        >
                          <Edit3 size={13} />
                          {isPetition ? 'Edit Petition' : 'Adjust Timing'}
                        </button>
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
            Displaying <strong>{filteredDays.length}</strong> of <strong>{rawDays.length}</strong> academic records for <strong>{selectedStudent.name}</strong>
          </div>
          <div>
            Future University • Computer Science & Engineering Department
          </div>
        </div>
      </div>

      {/* Petition Timing Adjustment Modal */}
      {petitionModalOpen && activePetitionRow && (
        <div className="modal-overlay" onClick={() => setPetitionModalOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit3 size={18} color="#1e3a8a" />
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#0f172a' }}>
                  Student Timing Adjustment on Petition
                </h3>
              </div>
              <button className="btn btn-outline btn-icon" onClick={() => setPetitionModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPetition}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {petitionFeedback && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: petitionFeedback.type === 'success' ? '#ecfdf5' : '#fff1f2',
                      border: `1px solid ${petitionFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                      color: petitionFeedback.type === 'success' ? '#15803d' : '#be123c',
                      fontSize: '0.85rem'
                    }}
                  >
                    {petitionFeedback.message}
                  </div>
                )}

                {/* Target Record Info Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>Student: <strong>{selectedStudent.name} ({selectedStudent.roll_number})</strong></span>
                    <span>Date: <strong>{activePetitionRow.date}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Current Status: <strong style={{ color: '#b45309' }}>{activePetitionRow.status}</strong></span>
                    <span>Recorded Arrival: <strong>{activePetitionRow.arrival_time || 'None (Absent)'}</strong></span>
                  </div>
                </div>

                {/* New Arrival Time */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Adjusted Campus Arrival Time
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={newArrivalTime}
                    onChange={(e) => setNewArrivalTime(e.target.value)}
                    placeholder="e.g. 09:50 AM"
                    required
                  />
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {['09:40 AM', '09:45 AM', '09:50 AM', '09:55 AM'].map(preset => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setNewArrivalTime(preset)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      >
                        {preset} (On Time)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Updated Status */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Official Adjusted Status
                  </label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="On Time (Petition Approved)">✅ On Time (Petition Approved)</option>
                    <option value="On Time (≤ 10:00 AM)">✅ On Time (≤ 10:00 AM)</option>
                    <option value="Excused (Official Duty)">📋 Excused (Official Duty)</option>
                    <option value="Late Comer">⏰ Late Comer</option>
                  </select>
                </div>

                {/* Petition Reason */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Student Petition Grounds / Faculty Approval Remark
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={petitionReason}
                    onChange={(e) => setPetitionReason(e.target.value)}
                    placeholder="Explain petition reason (e.g. Bus transport breakdown verified, medical certificate verified)..."
                    required
                  />
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      'University bus transit delay verified',
                      'Medical fitness certificate approved',
                      'Department lab duty assignment pass'
                    ].map(reasonPreset => (
                      <button
                        type="button"
                        key={reasonPreset}
                        onClick={() => setPetitionReason(reasonPreset)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                      >
                        {reasonPreset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPetitionModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingPetition}
                  style={{ background: '#1e3a8a' }}
                >
                  {submittingPetition ? 'Saving Adjustment...' : 'Approve Petition & Save Timing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
