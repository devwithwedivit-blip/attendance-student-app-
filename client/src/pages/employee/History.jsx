import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, AlertTriangle, Eye, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate, formatTime, formatDuration } from '../../utils/helpers';
import PhotoViewerModal from '../../components/PhotoViewerModal';
import StatusBadge from '../../components/StatusBadge';

export default function EmployeeHistory() {
  const [historyData, setHistoryData] = useState({ records: [], dailySummaries: [] });
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/attendance/my-records?limit=100');
      setHistoryData(res);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const dailySummaries = historyData?.dailySummaries || [];
  const records = historyData?.records || [];
  const totalDays = dailySummaries.length;
  const totalSeconds = dailySummaries.reduce((acc, curr) => acc + (curr.totalDurationSeconds || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Faculty Attendance Register & Logbook</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Official Biometric & Photographic Duty Archive — Future University (Session 2024–2025)
          </p>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid-cols-4">
        <div className="stat-card">
          <div>
            <div className="stat-label">Academic Days Present</div>
            <div className="stat-val">{totalDays}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#ecfdf5', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Duty Hours</div>
            <div className="stat-val" style={{ color: '#1e3a8a' }}>{totalHours}h</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Avg. Daily Hours</div>
            <div className="stat-val">{avgHours}h</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Photographic Records</div>
            <div className="stat-val">{records.length}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#fffbeb', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={22} />
          </div>
        </div>
      </div>

      {/* Daily Breakdown List */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Daily Duty Attendance Archive</h3>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading your attendance records...
          </div>
        ) : dailySummaries.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No past attendance logs found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {dailySummaries.map((day) => (
              <div
                key={day.date}
                style={{
                  padding: '1.25rem',
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {/* Day Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.85rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Calendar size={18} color="#1e3a8a" />
                    <span style={{ fontWeight: 700, fontSize: '0.975rem', color: '#0f172a' }}>
                      {formatDate(day.date)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.65rem',
                      background: '#ecfdf5',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      Logged Duty: {day.totalHoursFormatted}
                    </span>
                  </div>
                </div>

                {/* Day's Check-In & Check-Out Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem'
                }}>
                  {day.records.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.85rem',
                        background: '#ffffff',
                        borderRadius: 'var(--radius-sm)',
                        border: rec.flagged ? '1px solid #dc2626' : '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <img
                        src={rec.photo_url}
                        alt="Duty Verification"
                        className="photo-thumbnail"
                        style={{ width: '56px', height: '56px' }}
                        onClick={() => setSelectedRecord(rec)}
                        title="Click to view full photo"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                            {rec.type === 'check_in' ? 'Duty Arrival' : 'Duty Departure'}
                          </span>
                          <StatusBadge type={rec.type} flagged={Boolean(rec.flagged)} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <Clock size={12} color="#1e3a8a" /> {formatTime(rec.timestamp)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                          <MapPin size={12} color="#15803d" /> {rec.location_name || "Future University Campus Tagged"}
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedRecord(rec)}
                        style={{ padding: '0.35rem 0.6rem' }}
                        title="View photo"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedRecord && (
        <PhotoViewerModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          isAdmin={false}
        />
      )}
    </div>
  );
}
