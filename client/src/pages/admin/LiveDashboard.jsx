import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertTriangle, XCircle, CheckCircle2, RefreshCw, Eye, MapPin, Sparkles } from 'lucide-react';
import { api } from '../../utils/api';
import { formatTime, formatDuration } from '../../utils/helpers';
import PhotoViewerModal from '../../components/PhotoViewerModal';
import StatusBadge from '../../components/StatusBadge';

export default function AdminLiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchLiveDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/api/admin/live-dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load admin live dashboard:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboard();
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLiveDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFlagUpdated = async (recordId, flagged, flag_reason) => {
    await api.patch(`/api/admin/records/${recordId}/flag`, { flagged, flag_reason });
    await fetchLiveDashboard();
    setSelectedRecord(prev => prev ? { ...prev, flagged: flagged ? 1 : 0, flag_reason } : null);
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--emerald-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading live attendance telemetry...</p>
      </div>
    );
  }

  const { metrics, currentlyCheckedIn, checkedOutToday, absentToday, lateArrivals } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.75rem' }}>Faculty & Staff Presence Monitor</h1>
            <span className="badge badge-emerald badge-pulse">
              LIVE CAMPUS TELEMETRY
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Real-time Photographic Biometric Duty Register — Future University
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetchLiveDashboard(true)}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Register'}
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid-cols-4">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Faculty & Staff</div>
            <div className="stat-val">{metrics?.totalEmployees || 0}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#f1f5f9', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#15803d' }}>
          <div>
            <div className="stat-label">Currently On-Duty</div>
            <div className="stat-val" style={{ color: '#15803d' }}>{metrics?.checkedInNow || 0}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#ecfdf5', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#b91c1c' }}>
          <div>
            <div className="stat-label">Late Arrivals Today</div>
            <div className="stat-val" style={{ color: '#b91c1c' }}>{metrics?.lateToday || 0}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#fef2f2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#64748b' }}>
          <div>
            <div className="stat-label">Absent / Leave Today</div>
            <div className="stat-val" style={{ color: '#64748b' }}>{metrics?.absentToday || 0}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Main Section: Currently Checked In Employees */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#15803d', display: 'inline-block' }} />
              Active Faculty On-Duty ({currentlyCheckedIn?.length || 0})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Faculty members currently on-campus with verified arrival photographs
            </p>
          </div>
        </div>

        {currentlyCheckedIn?.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-medium)' }}>
            No faculty members are currently clocked in on campus.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {currentlyCheckedIn?.map((emp) => (
              <div
                key={emp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'var(--transition)'
                }}
              >
                {/* Photo thumbnail */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={emp.photoUrl}
                    alt={emp.name}
                    className="photo-thumbnail"
                    style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => setSelectedRecord(emp.activeCheckIn)}
                    title="Click to inspect photo"
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: -3,
                    right: -3,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#15803d',
                    border: '2px solid #ffffff'
                  }} />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{emp.name}</span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>ON DUTY</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    {emp.employee_code} • Dept. of {emp.department}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Arrival: {formatTime(emp.checkInTime)}</span>
                    <span style={{ color: '#15803d', fontWeight: 700 }}>Duty: {formatDuration(emp.durationSeconds)}</span>
                  </div>
                </div>

                {/* Action */}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedRecord(emp.activeCheckIn)}
                  title="Inspect photo & GPS location"
                >
                  <Eye size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Section: Late Arrivals & Absences */}
      <div className="grid-cols-2">
        {/* Late Arrivals Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={18} />
            Late Arrivals Today ({lateArrivals?.length || 0})
          </h3>
          {lateArrivals?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No late arrivals recorded today. Commendable punctuality!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lateArrivals?.map((emp) => (
                <div
                  key={emp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#fef2f2',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #fecaca'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={emp.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`}
                      alt={emp.name}
                      style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-medium)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.employee_code} • Dept. of {emp.department}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-coral">{emp.timeFormatted}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Absent Faculty Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <XCircle size={18} />
            Unaccounted / Absent Faculty ({absentToday?.length || 0})
          </h3>
          {absentToday?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>All active faculty members have verified attendance today!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {absentToday?.map((emp) => (
                <div
                  key={emp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={emp.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`}
                      alt={emp.name}
                      style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-medium)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.employee_code} • Dept. of {emp.department}</div>
                    </div>
                  </div>
                  <span className="badge badge-muted">Duty Unrecorded</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedRecord && (
        <PhotoViewerModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          isAdmin={true}
          onFlagUpdated={handleFlagUpdated}
        />
      )}
    </div>
  );
}
