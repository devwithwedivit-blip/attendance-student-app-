import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Filter, Search, Eye, AlertTriangle, ShieldCheck, RefreshCw, Calendar, MapPin } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDateTime, formatDate, formatTime, getGoogleMapsUrl } from '../../utils/helpers';
import PhotoViewerModal from '../../components/PhotoViewerModal';
import StatusBadge from '../../components/StatusBadge';

export default function AdminAttendanceRecords() {
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Filters
  const [searchEmp, setSearchEmp] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedFlagged, setSelectedFlagged] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedDept) queryParams.append('department', selectedDept);
      if (selectedType) queryParams.append('type', selectedType);
      if (selectedFlagged !== '') queryParams.append('flagged', selectedFlagged);
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      queryParams.append('limit', '100');

      const res = await api.get(`/api/admin/records?${queryParams.toString()}`);
      setRecords(res.records || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedDept, selectedType, selectedFlagged, startDate, endDate]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedDept) queryParams.append('department', selectedDept);
      if (selectedType) queryParams.append('type', selectedType);
      if (selectedFlagged !== '') queryParams.append('flagged', selectedFlagged);
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);

      const blob = await api.get(`/api/admin/export-csv?${queryParams.toString()}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-records-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleFlagUpdated = async (recordId, flagged, flag_reason) => {
    await api.patch(`/api/admin/records/${recordId}/flag`, { flagged, flag_reason });
    await fetchRecords();
    setSelectedRecord(prev => prev ? { ...prev, flagged: flagged ? 1 : 0, flag_reason } : null);
  };

  // Local search filter by employee name/code
  const filteredRecords = records.filter(r => {
    if (!searchEmp.trim()) return true;
    const term = searchEmp.toLowerCase();
    return (
      r.user_name?.toLowerCase().includes(term) ||
      r.employee_code?.toLowerCase().includes(term) ||
      r.user_email?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Faculty Attendance Register & Audit</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Official Biometric & Photographic Duty Archive — Academic Committee Review Portal
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchRecords}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <Download size={14} />
            {exporting ? 'Exporting...' : 'Export Committee CSV'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Faculty / Staff</label>
            <input
              type="text"
              className="form-input"
              placeholder="Name, Faculty ID, or Email..."
              value={searchEmp}
              onChange={(e) => setSearchEmp(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Academic Department</label>
            <select
              className="form-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science & IT</option>
              <option value="Management Studies">Management Studies (MBA/BBA)</option>
              <option value="Pharmacy">Pharmacy (B.Pharm/M.Pharm)</option>
              <option value="Engineering">Applied Engineering</option>
              <option value="Administration">Registrar / Administration</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Duty Event Type</label>
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Duty Events</option>
              <option value="check_in">Duty Arrival (Check-In)</option>
              <option value="check_out">Duty Departure (Check-Out)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Audit Compliance Status</label>
            <select
              className="form-select"
              value={selectedFlagged}
              onChange={(e) => setSelectedFlagged(e.target.value)}
            >
              <option value="">All Audit Records</option>
              <option value="1">Suspicious / Discrepant Photos</option>
              <option value="0">Verified / Clean Attendance</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date From</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date To</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Biometric Photo</th>
              <th>Faculty / Staff Member</th>
              <th>Department</th>
              <th>Duty Event</th>
              <th>Recorded Timestamp</th>
              <th>Geotagged Location</th>
              <th>Audit Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  Loading attendance records...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No attendance records matched your filter criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id} style={{ background: rec.flagged ? 'rgba(244, 63, 94, 0.04)' : undefined }}>
                  <td>
                    <img
                      src={rec.photo_url}
                      alt="Thumbnail"
                      className="photo-thumbnail"
                      onClick={() => setSelectedRecord(rec)}
                      title="Inspect full photo"
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{rec.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rec.employee_code} • {rec.user_email}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{rec.user_department}</span>
                  </td>
                  <td>
                    <StatusBadge type={rec.type} />
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{formatDate(rec.timestamp)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatTime(rec.timestamp)}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.825rem' }}>
                      <MapPin size={13} color="#10b981" />
                      <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rec.location_name || 'Office Tagged'}
                      </span>
                    </div>
                  </td>
                  <td>
                    {rec.flagged ? (
                      <span className="badge badge-coral" title={rec.flag_reason || 'Marked suspicious'}>
                        <AlertTriangle size={12} />
                        Flagged
                      </span>
                    ) : (
                      <span className="badge badge-emerald">
                        <ShieldCheck size={12} />
                        Verified
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedRecord(rec)}
                    >
                      <Eye size={13} />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        Showing {filteredRecords.length} of {totalCount} records
      </div>

      {/* Lightbox / Audit Modal */}
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
