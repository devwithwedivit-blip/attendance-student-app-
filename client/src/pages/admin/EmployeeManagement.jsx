import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, CheckCircle, XCircle, Key, Copy, Check, Edit2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate } from '../../utils/helpers';

export default function AdminEmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);

  // Add Employee Form State
  const [newEmp, setNewEmp] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Engineering',
    role: 'employee',
    employee_code: ''
  });

  // Invite Form State
  const [newInvite, setNewInvite] = useState({
    email: '',
    department: 'Engineering',
    role: 'employee',
    days_valid: '7'
  });
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const [empRes, invRes] = await Promise.all([
        api.get('/api/admin/employees'),
        api.get('/api/admin/invites')
      ]);
      setEmployees(empRes.employees || []);
      setInvites(invRes.invites || []);
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/employees', newEmp);
      setAddModalOpen(false);
      setNewEmp({
        name: '',
        email: '',
        password: '',
        department: 'Engineering',
        role: 'employee',
        employee_code: ''
      });
      await fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to add employee.');
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editEmployee) return;
    try {
      await api.patch(`/api/admin/employees/${editEmployee.id}`, {
        name: editEmployee.name,
        department: editEmployee.department,
        role: editEmployee.role,
        is_active: editEmployee.is_active,
        employee_code: editEmployee.employee_code
      });
      setEditEmployee(null);
      await fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to update employee.');
    }
  };

  const handleToggleActive = async (emp) => {
    const action = emp.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${emp.name}'s account?`)) return;

    try {
      await api.patch(`/api/admin/employees/${emp.id}`, {
        is_active: emp.is_active ? 0 : 1
      });
      await fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/admin/invites', newInvite);
      setGeneratedInvite(res.invite);
      await fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to generate invite code.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Faculty & Staff Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Faculty roster, academic department appointments, and joining invitation keys — Rajshree Institutions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setGeneratedInvite(null);
              setInviteModalOpen(true);
            }}
          >
            <Key size={14} />
            Generate Joining Key
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setAddModalOpen(true)}
          >
            <UserPlus size={14} />
            Appoint Faculty / Staff
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Faculty / Staff Member</th>
              <th>Faculty Code</th>
              <th>Academic Dept</th>
              <th>Institutional Role</th>
              <th>Service Status</th>
              <th>Verified Records</th>
              <th>Appointment Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  Loading institutional staff directory...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No faculty records found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} style={{ opacity: emp.is_active ? 1 : 0.6 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={emp.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`}
                        alt={emp.name}
                        style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-medium)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#1e3a8a' }}>
                      {emp.employee_code}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>Dept. of {emp.department}</td>
                  <td>
                    <span className={`badge ${emp.role === 'dean' ? 'badge-emerald' : emp.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}>
                      {emp.role === 'dean' ? '🎓 Dean Academics' : emp.role === 'admin' ? '👑 Admin' : '👤 Faculty'}
                    </span>
                  </td>
                  <td>
                    {emp.is_active ? (
                      <span className="badge badge-emerald">
                        <CheckCircle size={12} /> Active Service
                      </span>
                    ) : (
                      <span className="badge badge-coral">
                        <XCircle size={12} /> Deactivated
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {emp.totalRecords} total {emp.flaggedRecords > 0 && <span style={{ color: '#fb7185' }}>({emp.flaggedRecords} flagged)</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(emp.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setEditEmployee(emp)}
                        title="Edit employee"
                      >
                        <Edit2 size={13} />
                      </button>
                      {emp.role !== 'admin' && (
                        <button
                          className={`btn btn-sm ${emp.is_active ? 'btn-coral' : 'btn-primary'}`}
                          style={{ padding: '0.35rem 0.65rem' }}
                          onClick={() => handleToggleActive(emp)}
                        >
                          {emp.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {addModalOpen && (
        <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Employee</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setAddModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddEmployee}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Jane Doe"
                    value={newEmp.name}
                    onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="e.g. jane@company.com"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="form-input"
                    placeholder="Minimum 6 characters"
                    value={newEmp.password}
                    onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={newEmp.role}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editEmployee && (
        <div className="modal-overlay" onClick={() => setEditEmployee(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Employee</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setEditEmployee(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateEmployee}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editEmployee.name}
                    onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editEmployee.employee_code || ''}
                    onChange={(e) => setEditEmployee({ ...editEmployee, employee_code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={editEmployee.department}
                    onChange={(e) => setEditEmployee({ ...editEmployee, department: e.target.value })}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={editEmployee.role}
                    onChange={(e) => setEditEmployee({ ...editEmployee, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditEmployee(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Generator Modal */}
      {inviteModalOpen && (
        <div className="modal-overlay" onClick={() => setInviteModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate Registration Invite</h3>
              <button className="btn btn-outline btn-icon" onClick={() => setInviteModalOpen(false)}>✕</button>
            </div>
            {generatedInvite ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <CheckCircle size={44} color="#10b981" style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Invite Code Ready!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Share this invite code or link with the new team member to let them self-register.
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.25rem'
                }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: 'var(--emerald-500)' }}>
                    {generatedInvite.code}
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => copyToClipboard(generatedInvite.code)}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <button className="btn btn-secondary" onClick={() => setGeneratedInvite(null)}>
                  Generate Another Code
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateInvite}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Employee Email (Optional)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. recruit@company.com"
                      value={newInvite.email}
                      onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={newInvite.department}
                      onChange={(e) => setNewInvite({ ...newInvite, department: e.target.value })}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Design">Design</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setInviteModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Generate Code</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
