import React, { useState } from 'react';
import { Users, LayoutDashboard, History, User, LogOut, Shield, FileSpreadsheet, Menu, X, GraduationCap, BellRing, Camera, Building2, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, logout, isAdmin, isDean } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleNavClick = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const isStudent = user?.role === 'student';

  const getPortalLabel = () => {
    if (isDean) return 'Office of the Dean Academics';
    if (isAdmin) return 'Administrative & Registrar ERP';
    if (isStudent) return 'Student Portal • Academic Register';
    return 'Faculty Attendance Terminal';
  };

  const getDefaultHome = () => {
    if (isDean) return 'dean-dashboard';
    if (isAdmin) return 'admin-live';
    if (isStudent) return 'student-attendance';
    return 'emp-dashboard';
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
          {/* Brand */}
          <div className="nav-brand" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.85rem' }} onClick={() => handleNavClick(getDefaultHome())}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              padding: '2px 4px',
              background: 'rgba(255, 255, 255, 0.08)'
            }}>
              <img
                src="/logo.png"
                alt="Future University"
                style={{ height: '38px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div className="nav-brand-title" style={{ letterSpacing: '0.04em' }}>Future University</div>
              <div className="nav-brand-sub">
                {getPortalLabel()}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="nav-links">
            {isStudent ? (
              <button
                className={`nav-link ${currentView === 'student-attendance' ? 'active' : ''}`}
                onClick={() => handleNavClick('student-attendance')}
              >
                <Calendar size={16} className="nav-icon" />
                <span className="nav-label">My Daily Attendance</span>
              </button>
            ) : isDean ? (
              <>
                <button
                  className={`nav-link ${currentView === 'dean-dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dean-dashboard')}
                >
                  <GraduationCap size={16} className="nav-icon" />
                  <span className="nav-label">Student Attendance & 75% Criteria</span>
                </button>
                <button
                  className={`nav-link ${currentView === 'dean-notices' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dean-notices')}
                >
                  <BellRing size={16} className="nav-icon" />
                  <span className="nav-label">Notice Dispatch Register</span>
                </button>
                <div className="nav-divider" aria-hidden="true" />
                <button
                  className={`nav-link nav-link-terminal ${currentView === 'emp-dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('emp-dashboard')}
                  title="Switch to Faculty / Staff Check-In"
                >
                  <Camera size={15} className="nav-icon text-emerald" />
                  <span className="nav-label text-emerald">Faculty Check-In</span>
                </button>
              </>
            ) : isAdmin ? (
              <>
                <button
                  className={`nav-link ${currentView === 'admin-live' ? 'active' : ''}`}
                  onClick={() => handleNavClick('admin-live')}
                >
                  <LayoutDashboard size={16} className="nav-icon" />
                  <span className="nav-label">Faculty Live Presence</span>
                </button>
                <button
                  className={`nav-link ${currentView === 'admin-records' ? 'active' : ''}`}
                  onClick={() => handleNavClick('admin-records')}
                >
                  <FileSpreadsheet size={16} className="nav-icon" />
                  <span className="nav-label">Attendance Audit</span>
                </button>
                <button
                  className={`nav-link ${currentView === 'admin-employees' ? 'active' : ''}`}
                  onClick={() => handleNavClick('admin-employees')}
                >
                  <Users size={16} className="nav-icon" />
                  <span className="nav-label">Faculty & Staff Register</span>
                </button>
                <button
                  className={`nav-link ${currentView === 'dean-dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dean-dashboard')}
                  title="Access Dean Academic Roster"
                >
                  <GraduationCap size={16} className="nav-icon text-navy" />
                  <span className="nav-label">Dean Student Roster</span>
                </button>
                <button
                  className={`nav-link ${currentView === 'admin-reports' ? 'active' : ''}`}
                  onClick={() => handleNavClick('admin-reports')}
                >
                  <History size={16} className="nav-icon" />
                  <span className="nav-label">Institutional Reports</span>
                </button>
                <div className="nav-divider" aria-hidden="true" />
                <button
                  className={`nav-link nav-link-terminal ${currentView === 'emp-dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('emp-dashboard')}
                >
                  <Camera size={15} className="nav-icon text-emerald" />
                  <span className="nav-label text-emerald">My Terminal</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className={`nav-link ${currentView === 'emp-dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('emp-dashboard')}
                >
                  <Camera size={16} className="nav-icon" />
                  <span className="nav-label">Faculty Check In / Out</span>
                </button>
                <button
                  className={`nav-link ${currentView === 'dept-students' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dept-students')}
                  style={{ fontWeight: 600, color: currentView === 'dept-students' ? '#ffffff' : '#93c5fd' }}
                  title="CSE Department Student Attendance & Petition Management"
                >
                  <GraduationCap size={16} className="nav-icon" color={currentView === 'dept-students' ? '#ffffff' : '#60a5fa'} />
                  <span className="nav-label">CSE Students Attendance</span>
                </button>
                <button
                  className={`nav-link ${currentView === 'emp-history' ? 'active' : ''}`}
                  onClick={() => handleNavClick('emp-history')}
                >
                  <History size={16} className="nav-icon" />
                  <span className="nav-label">My Duty Register</span>
                </button>
                <button
                  className={`nav-link ${currentView === 'emp-profile' ? 'active' : ''}`}
                  onClick={() => handleNavClick('emp-profile')}
                >
                  <User size={16} className="nav-icon" />
                  <span className="nav-label">Faculty Profile</span>
                </button>
              </>
            )}
          </div>

          {/* User Badge & Actions */}
          <div className="nav-actions">
            <div className="nav-profile-badge">
              <img
                src={user.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                className="nav-profile-avatar"
              />
              <div className="nav-profile-info">
                <div className="nav-profile-name">{user.name}</div>
                <div className={`nav-profile-role ${isDean ? 'dean-role' : ''}`}>
                  {isDean ? '🎓 Dean (Academics)' : isAdmin ? '🛡️ Registrar / Admin' : isStudent ? `🎒 Student • ${user.employee_code || 'CSE20'}` : (user.employee_code || user.department)}
                </div>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-icon nav-logout-btn"
              onClick={logout}
              title="Sign Out from Institutional Session"
            >
              <LogOut size={16} />
            </button>

            {/* Mobile menu button */}
            <button
              className="btn btn-outline btn-icon mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div style={{
            padding: '1rem',
            background: '#ffffff',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {isStudent ? (
              <button className="nav-link active" onClick={() => handleNavClick('student-attendance')}>My Daily Attendance</button>
            ) : isDean ? (
              <>
                <button className="nav-link" onClick={() => handleNavClick('dean-dashboard')}>Students & 75% Criteria</button>
                <button className="nav-link" onClick={() => handleNavClick('dean-notices')}>Notice Dispatch Register</button>
                <button className="nav-link" onClick={() => handleNavClick('emp-dashboard')}>Faculty Check-In</button>
              </>
            ) : isAdmin ? (
              <>
                <button className="nav-link" onClick={() => handleNavClick('admin-live')}>Faculty Live Presence</button>
                <button className="nav-link" onClick={() => handleNavClick('admin-records')}>Attendance Audit</button>
                <button className="nav-link" onClick={() => handleNavClick('admin-employees')}>Faculty Register</button>
                <button className="nav-link" onClick={() => handleNavClick('dean-dashboard')}>Dean Student Roster</button>
                <button className="nav-link" onClick={() => handleNavClick('admin-reports')}>Institutional Reports</button>
                <button className="nav-link" onClick={() => handleNavClick('emp-dashboard')}>My Terminal</button>
              </>
            ) : (
              <>
                <button className="nav-link" onClick={() => handleNavClick('emp-dashboard')}>Faculty Check In / Out</button>
                <button className="nav-link" onClick={() => handleNavClick('dept-students')}>CSE Students Attendance</button>
                <button className="nav-link" onClick={() => handleNavClick('emp-history')}>My Register</button>
                <button className="nav-link" onClick={() => handleNavClick('emp-profile')}>Profile</button>
              </>
            )}
          </div>
        )}
    </header>
  );
}
