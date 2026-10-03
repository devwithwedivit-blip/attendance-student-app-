import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Employee / Faculty Portal Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeHistory from './pages/employee/History';
import EmployeeProfile from './pages/employee/Profile';

// Admin Portal Pages
import AdminLiveDashboard from './pages/admin/LiveDashboard';
import AdminAttendanceRecords from './pages/admin/AttendanceRecords';
import AdminEmployeeManagement from './pages/admin/EmployeeManagement';
import AdminReports from './pages/admin/Reports';

// Dean Academics Portal Pages
import DeanDashboard from './pages/dean/DeanDashboard';
import NoticeLog from './pages/dean/NoticeLog';

function AppContent() {
  const { user, loading, isAdmin, isDean } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [currentView, setCurrentView] = useState('emp-dashboard');

  // Set default view based on role once logged in
  useEffect(() => {
    if (user) {
      if (isDean) {
        setCurrentView('dean-dashboard');
      } else if (isAdmin) {
        setCurrentView('admin-live');
      } else {
        setCurrentView('emp-dashboard');
      }
    }
  }, [user, isAdmin, isDean]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid var(--border-subtle)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ fontWeight: 600 }}>Loading Future University ERP...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login / Signup
  if (!user) {
    if (authView === 'signup') {
      return <Signup onNavigateLogin={() => setAuthView('login')} />;
    }
    return <Login onNavigateSignup={() => setAuthView('signup')} />;
  }

  // Logged in -> Render Portal with Navbar
  return (
    <div className="app-container">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="main-content">
        {/* Dean Academics Views */}
        {currentView === 'dean-dashboard' && <DeanDashboard />}
        {currentView === 'dean-notices' && <NoticeLog />}

        {/* Faculty / Staff Views */}
        {currentView === 'emp-dashboard' && (
          <EmployeeDashboard onNavigateHistory={() => setCurrentView('emp-history')} />
        )}
        {currentView === 'emp-history' && <EmployeeHistory />}
        {currentView === 'emp-profile' && <EmployeeProfile />}

        {/* Admin Views */}
        {currentView === 'admin-live' && <AdminLiveDashboard />}
        {currentView === 'admin-records' && <AdminAttendanceRecords />}
        {currentView === 'admin-employees' && <AdminEmployeeManagement />}
        {currentView === 'admin-reports' && <AdminReports />}
      </main>

      {/* Official Institutional Bottom Ribbon */}
      <footer className="institutional-ribbon">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
            FUTURE UNIVERSITY
          </span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span style={{ color: '#cbd5e1' }}>
            Learn • Assimilate • Transcend (Official Attendance & Compliance ERP)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.725rem', color: '#fef3c7' }}>
          <span>🎓 Future University Campus</span>
          <span>•</span>
          <span style={{ fontWeight: 600 }}>Academic Session 2024–25</span>
        </div>
      </footer>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Portal Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #f8fafc)',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <img src="/logo.png" alt="Future University" style={{ height: '56px', margin: '0 auto 1.5rem', objectFit: 'contain' }} />
            <h2 style={{ fontSize: '1.35rem', color: '#0f172a', marginBottom: '0.75rem' }}>Future University ERP</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              The portal encountered an unexpected state. You can reload or reset your browser session.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#1e3a8a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
