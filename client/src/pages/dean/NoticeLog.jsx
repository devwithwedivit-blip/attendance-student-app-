import React, { useState, useEffect } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Eye,
  X,
  FileText,
  UserCheck,
  Building,
  Stamp
} from 'lucide-react';
import { api } from '../../utils/api';
import { formatDateTime, formatDate } from '../../utils/helpers';

export default function NoticeLog() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== '') params.append('acknowledged', statusFilter);
      if (deptFilter) params.append('department', deptFilter);

      const res = await api.get(`/api/dean/notices?${params.toString()}`);
      setNotices(res.notices || []);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [statusFilter, deptFilter]);

  const handleToggleAcknowledge = async (notice) => {
    setTogglingId(notice.id);
    try {
      await api.patch(`/api/dean/notices/${notice.id}/acknowledge`, {});
      await fetchNotices();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      n.student_name?.toLowerCase().includes(term) ||
      n.roll_number?.toLowerCase().includes(term) ||
      n.student_email?.toLowerCase().includes(term)
    );
  });

  const totalNotices = notices.length;
  const acknowledgedCount = notices.filter((n) => n.acknowledged).length;
  const pendingCount = totalNotices - acknowledgedCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.75rem' }}>Attendance Notice Dispatch Register</h1>
            <span className="badge badge-blue">
              <Building size={12} /> Official Academic Register
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Official record of attendance warning dispatches, university regulatory compliance, and student acknowledgement audit
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchNotices}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh Dispatch Register
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="stat-card" style={{ borderLeftColor: '#1e3a8a' }}>
          <div>
            <div className="stat-label">Total Notices Issued</div>
            <div className="stat-val">{totalNotices}</div>
            <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.2rem' }}>
              Academic Session 2024–25
            </div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BellRing size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#16a34a' }}>
          <div>
            <div className="stat-label">Acknowledged by Candidate</div>
            <div className="stat-val" style={{ color: '#15803d' }}>{acknowledgedCount}</div>
            <div style={{ fontSize: '0.725rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
              Confirmed Receipt & Undertaking
            </div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#d97706' }}>
          <div>
            <div className="stat-label">Awaiting Candidate Action</div>
            <div className="stat-val" style={{ color: '#b45309' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.725rem', color: '#d97706', fontWeight: 600, marginTop: '0.2rem' }}>
              Pending Dean Office Appearance
            </div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#6366f1' }}>
          <div>
            <div className="stat-label">Institutional Response Rate</div>
            <div className="stat-val" style={{ color: '#4f46e5' }}>
              {totalNotices > 0 ? Math.round((acknowledgedCount / totalNotices) * 100) : 0}%
            </div>
            <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.2rem' }}>
              Compliance Feedback Telemetry
            </div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Candidate / Roll No</label>
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
            <label className="form-label">Acknowledgement Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Dispatched Notices</option>
              <option value="1">Acknowledged by Student</option>
              <option value="0">Pending Acknowledgement</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Department</label>
            <select
              className="form-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Future University Departments / Sections</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Management & MBA">Management & MBA</option>
              <option value="Pharmacy / B.Pharm">Pharmacy / B.Pharm</option>
              <option value="BCA">BCA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Register Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Dispatch Ref #</th>
              <th>Roll Number</th>
              <th>Candidate Name</th>
              <th>Department</th>
              <th>Attendance at Notice</th>
              <th>Dispatch Timestamp</th>
              <th>Compliance Deadline</th>
              <th>Acknowledgement Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading official attendance notice register...
                </td>
              </tr>
            ) : filteredNotices.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No attendance warning notices recorded under the active filter.
                </td>
              </tr>
            ) : (
              filteredNotices.map((n) => (
                <tr key={n.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      SMCS-NOT-{String(n.id).padStart(4, '0')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                      {n.roll_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{n.student_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{n.student_email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{n.department}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{n.semester}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: n.attendance_percent_at_time < 60 ? '#b91c1c' : '#b45309' }}>
                      {n.attendance_percent_at_time}%
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#334155' }}>{formatDateTime(n.sent_at)}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.825rem' }}>
                      {formatDate(n.deadline_date)}
                    </span>
                  </td>
                  <td>
                    {n.acknowledged ? (
                      <div>
                        <span className="badge badge-emerald">
                          <CheckCircle2 size={11} />
                          Acknowledged
                        </span>
                        <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {formatDateTime(n.acknowledged_at)}
                        </div>
                      </div>
                    ) : (
                      <span className="badge badge-amber">
                        <Clock size={11} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedNotice(n)}
                        title="View formal letterhead notice"
                      >
                        <Eye size={13} />
                        Letter
                      </button>
                      <button
                        className={`btn btn-sm ${n.acknowledged ? 'btn-outline' : 'btn-primary'}`}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleAcknowledge(n)}
                        disabled={togglingId === n.id}
                        title="Update student acknowledgement state"
                      >
                        {n.acknowledged ? 'Reset' : 'Acknowledge'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Official Letterhead Modal */}
      {selectedNotice && (
        <div className="modal-overlay" onClick={() => setSelectedNotice(null)}>
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
                  <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                    Official Notice Record #{selectedNotice.id}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#475569' }}>
                    Future University • Office of Academic Affairs
                  </p>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setSelectedNotice(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', background: '#f8fafc' }}>
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
                    <span>Dispatch Ref: FU/ACAD/2024-25/NOT-{selectedNotice.roll_number.split('-')[2] || selectedNotice.id}</span>
                    <span>Date: {formatDate(selectedNotice.sent_at)}</span>
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.9rem',
                    lineHeight: '1.65',
                    color: '#1e293b',
                    whiteSpace: 'pre-wrap',
                    padding: '0.5rem 0'
                  }}
                >
                  {selectedNotice.notice_message}
                </div>

                {/* Stamp Seal and Sign-off */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #cbd5e1' }}>
                  <div className="letterhead-stamp">
                    OFFICIALLY DISPATCHED<br />ACADEMIC HEAD • FUTURE UNIVERSITY
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Dr. Rajesh Sharma, Ph.D.</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569' }}>Dean / Academic Head</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Future University</div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '1.25rem',
                  padding: '0.75rem 1rem',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.8rem'
                }}
              >
                <div>
                  <strong>Dispatch Timestamp:</strong> {formatDateTime(selectedNotice.sent_at)}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  {selectedNotice.acknowledged ? (
                    <span style={{ color: '#15803d', fontWeight: 700 }}>✓ Acknowledged by Candidate</span>
                  ) : (
                    <span style={{ color: '#b45309', fontWeight: 700 }}>⏳ Awaiting Candidate Submission</span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#f8fafc' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedNotice(null)}
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
