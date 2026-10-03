import React, { useState } from 'react';
import { X, MapPin, Calendar, User, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import { formatDateTime, getGoogleMapsUrl } from '../utils/helpers';
import StatusBadge from './StatusBadge';

export default function PhotoViewerModal({ record, onClose, isAdmin = false, onFlagUpdated }) {
  const [isUpdatingFlag, setIsUpdatingFlag] = useState(false);
  const [flagReason, setFlagReason] = useState(record?.flag_reason || 'Blurry photo / Proxy attendance verification');

  if (!record) return null;

  const mapsUrl = getGoogleMapsUrl(record.latitude, record.longitude);

  const handleToggleFlag = async () => {
    if (!onFlagUpdated) return;
    setIsUpdatingFlag(true);
    try {
      await onFlagUpdated(record.id, !record.flagged, flagReason);
    } catch (err) {
      alert('Failed to update flag status: ' + err.message);
    } finally {
      setIsUpdatingFlag(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '620px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}>Attendance Photo Verification</h3>
                <StatusBadge type={record.type} flagged={Boolean(record.flagged)} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Record #{record.id} • {record.user_name || 'Employee Verification'}
              </p>
            </div>
          </div>
          <button className="btn btn-outline btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Main Photo Display */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxHeight: '380px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: '#030712',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: record.flagged ? '2px solid var(--coral-500)' : '1px solid var(--border-subtle)',
            boxShadow: record.flagged ? '0 0 20px var(--coral-glow)' : 'none'
          }}>
            <img
              src={record.photo_url}
              alt="Verification snapshot"
              style={{
                maxWidth: '100%',
                maxHeight: '380px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                // fallback if local path needs server root
                if (!e.target.src.startsWith('http') && !e.target.src.startsWith('/uploads')) {
                  e.target.src = '/uploads/' + record.photo_url;
                }
              }}
            />
            {record.flagged === 1 && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(244, 63, 94, 0.92)',
                color: '#ffffff',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
              }}>
                <AlertTriangle size={14} />
                FLAGGED SUSPICIOUS
              </div>
            )}
          </div>

          {/* Metadata Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            marginTop: '1.25rem'
          }}>
            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <User size={13} />
                EMPLOYEE
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {record.user_name || 'N/A'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {record.employee_code || record.user_department || 'General'}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <Calendar size={13} />
                TIMESTAMP
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {formatDateTime(record.timestamp)}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <MapPin size={13} />
                LOCATION
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                {record.location_name || (record.latitude ? `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}` : 'Office Tagged')}
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'var(--emerald-500)',
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    marginTop: '0.2rem'
                  }}
                >
                  View on Maps <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* Admin Flagging Panel */}
          {isAdmin && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: record.flagged ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.06)',
              border: `1px solid ${record.flagged ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {record.flagged ? (
                    <>
                      <AlertTriangle size={15} color="#f43f5e" />
                      Suspicious Attendance Follow-up Required
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} color="#10b981" />
                      Verified Photo Attendance
                    </>
                  )}
                </span>
                <button
                  className={`btn btn-sm ${record.flagged ? 'btn-primary' : 'btn-coral'}`}
                  onClick={handleToggleFlag}
                  disabled={isUpdatingFlag}
                >
                  {record.flagged ? (
                    <>
                      <ShieldCheck size={14} />
                      Verify & Remove Flag
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} />
                      Flag as Suspicious
                    </>
                  )}
                </button>
              </div>

              {record.flagged ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Flag reason:</strong> {record.flag_reason || 'Pending admin audit'}
                </p>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    placeholder="Optional reason (e.g. blurry image, proxy person, bad angle)"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
