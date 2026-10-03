import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Camera, Clock, CheckCircle, MapPin, Calendar, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { api } from '../../utils/api';
import { formatTime, formatDuration } from '../../utils/helpers';
import CameraModal from '../../components/CameraModal';
import PhotoViewerModal from '../../components/PhotoViewerModal';
import StatusBadge from '../../components/StatusBadge';

export default function EmployeeDashboard({ onNavigateHistory }) {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState(null);

  // Live timer state for active check-in
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/api/attendance/today');
      setTodayData(res);
      setLiveElapsedSeconds(res.totalSeconds || 0);
      setError(null);
    } catch (err) {
      console.error('Failed to load today status:', err);
      setError('Could not fetch attendance status. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  // Tick elapsed duration every second if currently checked in
  useEffect(() => {
    let interval = null;
    if (todayData?.status === 'CHECKED_IN') {
      interval = setInterval(() => {
        setLiveElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todayData?.status]);

  const handleActionClick = () => {
    setCameraModalOpen(true);
  };

  const handleConfirmAttendance = async ({ photoBlob, photoBase64, latitude, longitude, face_verified }) => {
    if (!face_verified) {
      alert('Verification Failed: A live human face must be verified inside the circle guide.');
      return;
    }
    setSubmittingAction(true);
    try {
      const isCheckIn = todayData?.status !== 'CHECKED_IN';
      const endpoint = isCheckIn ? '/api/attendance/check-in' : '/api/attendance/check-out';

      const formData = new FormData();
      if (photoBlob) {
        formData.append('photo', photoBlob, `${isCheckIn ? 'checkin' : 'checkout'}.jpg`);
      } else if (photoBase64) {
        formData.append('photo_base64', photoBase64);
      }
      formData.append('face_verified', 'true');
      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);

      await api.postMultipart(endpoint, formData);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setCameraModalOpen(false);
      await fetchTodayStatus();
    } catch (err) {
      alert(err.message || 'Failed to submit attendance photo.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--emerald-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading attendance status...</p>
      </div>
    );
  }

  const isCheckedIn = todayData?.status === 'CHECKED_IN';
  const isCheckedOut = todayData?.status === 'CHECKED_OUT';
  const notCheckedIn = todayData?.status === 'NOT_CHECKED_IN';

  const actionType = isCheckedIn ? 'check_out' : 'check_in';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Institutional Advisory Banner */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderLeft: '4px solid #1e3a8a',
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.85rem',
        color: '#1e3a8a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={16} color="#1e3a8a" />
          <span>
            <strong>Institutional Directive (Ref: FU/ADMIN/2024/ATT-08):</strong> All students, faculty, and staff must record arrival and departure using this photographic terminal.
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1e40af' }}>
          Session 2024–2025
        </span>
      </div>

      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>{user?.role === 'student' ? 'Student Attendance Terminal' : 'Faculty & Staff Attendance Terminal'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Official Biometric & Photographic Register — Future University
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.85rem',
            background: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-medium)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--navy-900)'
          }}>
            <Calendar size={15} color="#1e3a8a" />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <StatusBadge status={todayData?.status} />
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-sm)',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Hero Check-In Card */}
      <div className={`glass-card hero-action-card ${isCheckedIn ? 'checked-in' : ''}`}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: isCheckedIn ? '#dc2626' : '#15803d',
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={14} />
            {isCheckedIn ? 'OFFICIAL DUTY / LECTURE SHIFT IN PROGRESS' : isCheckedOut ? 'CAMPUS DUTY COMPLETED TODAY' : 'READY TO COMMENCE OFFICIAL DUTY'}
          </div>

          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: 'var(--navy-900)' }}>
            {isCheckedIn ? 'Record Shift Departure' : isCheckedOut ? 'Day Shift Recorded' : 'Record Shift Arrival'}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5 }}>
            {isCheckedIn
              ? `Arrival timestamp verified at ${formatTime(todayData?.activeCheckIn?.timestamp)}. Capture departure photo to complete duty hours.`
              : isCheckedOut
              ? `Departure recorded at ${formatTime(todayData?.latestCheckOut?.timestamp)}. Total logged today: ${formatDuration(todayData?.totalSeconds)}.`
              : 'Mandatory photo capture with GPS coordinates to verify physical on-campus presence.'}
          </p>

          {/* Big Action Button */}
          <button
            className={`big-punch-btn ${isCheckedIn ? 'check-out' : 'check-in'}`}
            onClick={handleActionClick}
            aria-label={isCheckedIn ? 'Duty Check Out' : 'Duty Check In'}
          >
            <Camera size={44} style={{ marginBottom: '0.4rem' }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.02em' }}>
              {isCheckedIn ? 'DUTY CHECK OUT' : isCheckedOut ? 'CHECK IN AGAIN' : 'DUTY CHECK IN'}
            </span>
            <span style={{ fontSize: '0.725rem', opacity: 0.9, fontWeight: 600, marginTop: '0.2rem', letterSpacing: '0.04em' }}>
              LIVE PHOTO VERIFIED
            </span>
          </button>

          {/* Live Duration Counter */}
          {isCheckedIn && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-full)',
              color: '#15803d',
              fontWeight: 700,
              fontSize: '1rem',
              marginTop: '0.75rem'
            }}>
              <Clock size={18} />
              <span>Campus Duty Duration: {formatDuration(liveElapsedSeconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Today's Verification Events */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Today's Duty Activity Log</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Photographic entries recorded on campus today
            </p>
          </div>
          {onNavigateHistory && (
            <button
              className="btn btn-outline btn-sm"
              onClick={onNavigateHistory}
            >
              Full Duty Logbook <ChevronRight size={14} />
            </button>
          )}
        </div>

        {todayData?.records?.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-medium)'
          }}>
            <Camera size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No duty attendance photos logged yet today.</p>
            <p style={{ fontSize: '0.8rem' }}>Tap the Duty Check In terminal button above to record arrival.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {todayData?.records?.map((record) => (
              <div
                key={record.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={record.photo_url}
                    alt="Attendance thumbnail"
                    className="photo-thumbnail"
                    onClick={() => setSelectedPhotoRecord(record)}
                    title="Click to view full photo"
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {record.type === 'check_in' ? 'Check In Event' : 'Check Out Event'}
                      </span>
                      <StatusBadge type={record.type} flagged={Boolean(record.flagged)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} /> {formatTime(record.timestamp)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} color="#10b981" /> {record.location_name || 'Office Tagged'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedPhotoRecord(record)}
                >
                  View Photo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        actionType={actionType}
        onConfirm={handleConfirmAttendance}
        loading={submittingAction}
      />

      {/* Photo Lightbox Modal */}
      {selectedPhotoRecord && (
        <PhotoViewerModal
          record={selectedPhotoRecord}
          onClose={() => setSelectedPhotoRecord(null)}
          isAdmin={false}
        />
      )}
    </div>
  );
}
