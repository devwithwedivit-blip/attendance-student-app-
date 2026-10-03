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
          <p style={{ fontWeight: 600 }}>Loading St. Mary's Convent School ERP...</p>
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
            ST. MARY'S CONVENT SCHOOL
          </span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span style={{ color: '#cbd5e1' }}>
            Premier Co-Educational Christian Minority Institution (Estd. 1968)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.725rem', color: '#fef3c7' }}>
          <span>🏫 St. Mary's Campus</span>
          <span>•</span>
          <span style={{ fontWeight: 600 }}>Academic Session 2024–25</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
