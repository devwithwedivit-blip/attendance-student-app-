import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, AlertTriangle, Calendar, Award, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';

export default function AdminReports() {
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDept) params.append('department', selectedDept);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await api.get(`/api/admin/reports?${params.toString()}`);
      setReportsData(res.summaries || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedDept, startDate, endDate]);

  const totalTeamHours = reportsData.reduce((acc, curr) => acc + (curr.totalHours || 0), 0).toFixed(1);
  const totalLateCount = reportsData.reduce((acc, curr) => acc + (curr.lateArrivalCount || 0), 0);
  const totalFlaggedCount = reportsData.reduce((acc, curr) => acc + (curr.flaggedEventsCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Faculty Attendance & Workload Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Official Academic Workload, Punctuality & Audit Compliance Register — Future University
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchReports}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh Report
        </button>
      </div>

      {/* Aggregate KPI Stats */}
      <div className="grid-cols-4">
        <div className="stat-card" style={{ borderLeftColor: '#15803d' }}>
          <div>
            <div className="stat-label">Total Faculty Workload Hours</div>
            <div className="stat-val" style={{ color: '#15803d' }}>{totalTeamHours}h</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#ecfdf5', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#1e3a8a' }}>
          <div>
            <div className="stat-label">Faculty Tracked</div>
            <div className="stat-val" style={{ color: '#1e3a8a' }}>{reportsData.length}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#b91c1c' }}>
          <div>
            <div className="stat-label">Total Late Arrivals</div>
            <div className="stat-val" style={{ color: '#b91c1c' }}>{totalLateCount}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#fef2f2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#b45309' }}>
          <div>
            <div className="stat-label">Audit Discrepancies Flagged</div>
            <div className="stat-val" style={{ color: '#b45309' }}>{totalFlaggedCount}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#fffbeb', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={22} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Department</label>
            <select
              className="form-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Academic Departments</option>
              <option value="Computer Science">Computer Science & IT</option>
              <option value="Management Studies">Management Studies (MBA/BBA)</option>
              <option value="Pharmacy">Pharmacy (B.Pharm/M.Pharm)</option>
              <option value="Engineering">Applied Engineering</option>
              <option value="Administration">Registrar / Administration</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Audit Period Start</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Audit Period End</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Faculty / Staff Member</th>
              <th>Academic Department</th>
              <th>Duty Days Present</th>
              <th>Total Workload Hours</th>
              <th>Avg Hours/Day</th>
              <th>Late Arrivals</th>
              <th>Audit Discrepancies</th>
              <th>Punctuality Rating</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  Aggregating institutional attendance audit data...
                </td>
              </tr>
            ) : reportsData.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No reporting data found for the selected academic period.
                </td>
              </tr>
            ) : (
              reportsData.map((emp) => {
                const punctualityPct = emp.totalDaysPresent > 0
                  ? Math.max(0, Math.round(((emp.totalDaysPresent - emp.lateArrivalCount) / emp.totalDaysPresent) * 100))
                  : 100;

                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {emp.employee_code} • {emp.email}
                      </div>
                    </td>
                    <td>{emp.department}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{emp.totalDaysPresent} days</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#34d399' }}>{emp.totalHours} hrs</span>
                    </td>
                    <td>{emp.avgHoursPerDay} hrs</td>
                    <td>
                      {emp.lateArrivalCount > 0 ? (
                        <span style={{ color: '#fb7185', fontWeight: 600 }}>
                          {emp.lateArrivalCount} times
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td>
                      {emp.flaggedEventsCount > 0 ? (
                        <span className="badge badge-coral">
                          {emp.flaggedEventsCount} flagged
                        </span>
                      ) : (
                        <span className="badge badge-emerald">Clean</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                          <div
                            style={{
                              width: `${punctualityPct}%`,
                              height: '100%',
                              background: punctualityPct > 80 ? '#10b981' : punctualityPct > 60 ? '#f59e0b' : '#f43f5e'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{punctualityPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
