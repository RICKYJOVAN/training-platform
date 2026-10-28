import React, { useEffect, useState } from 'react';
import { reportsApi, departmentsApi } from '../../api/client';
import { ComplianceRow, Department } from '@training-platform/shared-types';

export default function ReportsPage() {
  const [rows, setRows] = useState<ComplianceRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async (deptId?: string) => {
    setLoading(true);
    try {
      const data = await reportsApi.compliance(deptId || undefined);
      setRows(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => {});
    fetchReport();
  }, []);

  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDept(val);
    fetchReport(val || undefined);
  };

  const totalActive = rows.reduce((s, r) => s + r.certs_active, 0);
  const totalExpiring = rows.reduce((s, r) => s + r.certs_expiring_soon, 0);
  const totalExpired = rows.reduce((s, r) => s + r.certs_expired, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Report</h1>
          <p className="page-subtitle">Certification status summary by department</p>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm, 0.85rem)', marginTop: 'var(--space-1)' }}>
            Compliance Rate = employees with a currently <strong>active</strong> certification ÷ total employees.
            "Expiring soon" certs are still valid but do not count toward this rate.
          </p>
        </div>
        <select
          id="dept-filter"
          className="form-select"
          style={{ width: 220 }}
          value={selectedDept}
          onChange={handleFilter}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">Active Certifications</div>
          <div className="stat-value active tabular">{totalActive}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expiring Soon</div>
          <div className="stat-value expiring tabular">{totalExpiring}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expired</div>
          <div className="stat-value expired tabular">{totalExpired}</div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Department Breakdown</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Employees</th>
              <th>Active</th>
              <th>Expiring Soon</th>
              <th>Expired</th>
              <th>Compliance Rate</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="loading-row"><td colSpan={6}>Loading report…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="empty-state">No data.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.department_id}>
                <td style={{ fontWeight: 500 }}>{row.department_name}</td>
                <td className="tabular">{row.total_employees}</td>
                <td>
                  <span className="status-dot active tabular">{row.certs_active}</span>
                </td>
                <td>
                  <span className="status-dot expiring_soon tabular">{row.certs_expiring_soon}</span>
                </td>
                <td>
                  <span className="status-dot expired tabular">{row.certs_expired}</span>
                </td>
                <td className="tabular" style={{
                  color: row.compliance_rate >= 80
                    ? 'var(--accent-active)'
                    : row.compliance_rate >= 50
                      ? 'var(--accent-expiring)'
                      : 'var(--accent-expired)',
                  fontWeight: 500,
                }}>
                  {row.compliance_rate?.toFixed(1) ?? '—'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
