import React from 'react';
import { User, Mail, Briefcase, Hash, Calendar, ShieldCheck, Camera, CheckCircle2, Award, QrCode, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

export default function EmployeeProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '850px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem' }}>Faculty Identity & Attendance Credentials</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Official institutional credential issued by the Office of Academic Affairs — Future University
        </p>
      </div>

      {/* Official Future University Faculty Identity Card */}
      <div className="glass-card" style={{
        padding: 0,
        overflow: 'hidden',
        border: '2px solid #1e3a8a',
        boxShadow: 'var(--shadow-md)',
        background: '#ffffff'
      }}>
        {/* Card Header Letterhead Ribbon */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderBottom: '3px solid #b45309',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '3px 6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src="/logo.png"
                  alt="Future University"
                  style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
                />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', letterSpacing: '0.04em', margin: 0, textTransform: 'uppercase' }}>
                  Future University
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  Learn • Assimilate • Transcend • Main Campus
                </div>
              </div>
            </div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.35rem 0.75rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fef3c7' }}>CARD TYPE</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>FACULTY / STAFF ID</div>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '1.75rem 2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          {/* Photo & Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '130px',
              height: '150px',
              border: '3px solid #1e3a8a',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              background: '#f8fafc',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <img
                src={user.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              <ShieldCheck size={13} />
              VERIFIED FACULTY
            </span>
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#0f172a', marginBottom: '0.25rem' }}>{user.name}</h2>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e3a8a', marginBottom: '0.75rem' }}>
              Assistant Professor / Faculty Member
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Faculty Code</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                  {user.employee_code || 'SMCS-FAC-01'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Academic Department</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  Dept. of {user.department}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Official Email</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {user.email}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Date of Appointment</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {formatDate(user.created_at)}
                </div>
              </div>
            </div>

            {/* Official Digital Seal & Barcode Strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <div>
                <div style={{
                  fontFamily: 'monospace',
                  letterSpacing: '0.25em',
                  fontSize: '0.75rem',
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '2px',
                  display: 'inline-block'
                }}>
                  ||| | |||| || ||| |||| | ||||| | |||
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  BIOMETRIC PIN: {user.employee_code?.replace('-', '') || 'FAC100'}•AUTH
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div className="letterhead-stamp" style={{ transform: 'none', padding: '0.25rem 0.65rem', fontSize: '0.7rem' }}>
                  AUTHORIZED REGISTRAR
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.2rem' }}>Digital Seal Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Attendance Regulations */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--navy-900)' }}>
          <FileText size={18} color="#1e3a8a" />
          Future University Institutional Attendance Directives for Faculty & Staff
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <CheckCircle2 size={16} color="#15803d" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
            <span>
              <strong>Rule 1 (Arrival Duty Entry):</strong> All faculty members must record their arrival attendance within the college premises prior to 09:15 AM IST via camera terminal.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <CheckCircle2 size={16} color="#15803d" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
            <span>
              <strong>Rule 2 (Photographic & Geotag Verification):</strong> Proxy attendance or submitting non-biometric photographs is strictly prohibited under University Conduct Code 14(B).
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <CheckCircle2 size={16} color="#15803d" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
            <span>
              <strong>Rule 3 (Departure Duty Sign-off):</strong> Duty departure must be logged after 04:30 PM IST or completion of scheduled lecture/laboratory workloads.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

