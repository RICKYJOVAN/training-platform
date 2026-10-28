import React, { useEffect, useState } from 'react';
import { certificationsApi } from '../../api/client';
import { Certification } from '@training-platform/shared-types';
import { useAuthStore } from '../../store/auth.store';

interface CertWithDetails extends Certification {
  course_title: string;
  user_email?: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CertificationsPage() {
  const [certs, setCerts] = useState<CertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [flashId, setFlashId] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const isPrivileged = ['manager', 'hr_admin', 'compliance_officer'].includes(user?.role || '');
  const canRevoke = ['compliance_officer', 'hr_admin'].includes(user?.role || '');

  const fetchCerts = async (status = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      if (isPrivileged) {
        const data = await certificationsApi.getByStatus(status);
        setCerts(data as CertWithDetails[]);
      } else {
        const data = await certificationsApi.getMyCerts();
        setCerts(data as CertWithDetails[]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading certifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, [statusFilter]);

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this certification? This cannot be undone and will impact compliance records.')) return;
    try {
      await certificationsApi.revoke(id);
      setCerts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'revoked' } : c));
      setFlashId(id);
      setTimeout(() => setFlashId(null), 2200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Revoke failed');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">
            {isPrivileged ? 'Certifications Registry' : 'My Certifications'}
          </h1>
          <p className="page-subtitle">
            {isPrivileged
              ? 'Training certifications, renewal timelines, and governance status across the organisation'
              : 'Your issued training certifications and their current status'}
          </p>
          {!canRevoke && isPrivileged && (
            <p className="text-muted" style={{ fontSize: 'var(--text-xs, 0.78rem)', marginTop: 'var(--space-1)' }}>
              Note: Revoking certifications is restricted to <strong>Compliance Officers</strong> and <strong>HR Administrators</strong> for audit integrity.
            </p>
          )}
        </div>

        {isPrivileged && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <label htmlFor="status-filter" style={{ fontSize: 'var(--text-sm, 0.85rem)', fontWeight: 500 }}>
              Status:
            </label>
            <select
              id="status-filter"
              className="form-select"
              style={{ width: 170 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="expiring_soon">Expiring Soon (≤30d)</option>
              <option value="expired">Expired Only</option>
              <option value="revoked">Revoked Only</option>
            </select>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              {isPrivileged && <th>Employee</th>}
              <th>Course</th>
              <th>Issued</th>
              <th>Expires</th>
              <th>Status</th>
              {canRevoke && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="loading-row"><td colSpan={6}>Loading certifications…</td></tr>
            )}
            {!loading && certs.length === 0 && (
              <tr><td colSpan={6} className="empty-state">No certifications found for this filter.</td></tr>
            )}
            {certs.map((cert) => (
              <tr
                key={cert.id}
                className={flashId === cert.id ? 'status-flash' : ''}
                style={flashId === cert.id
                  ? { '--flash-color': 'var(--accent-revoked)' } as React.CSSProperties
                  : {}
                }
              >
                {isPrivileged && (
                  <td className="text-sm">{(cert as CertWithDetails).user_email || '—'}</td>
                )}
                <td style={{ fontWeight: 500 }}>{cert.course_title || '—'}</td>
                <td className="tabular">{formatDate(cert.issued_date)}</td>
                <td className="tabular">{formatDate(cert.expiry_date)}</td>
                <td>
                  <span className={`status-dot ${cert.status}`}>
                    {cert.status.replace('_', ' ')}
                  </span>
                </td>
                {canRevoke && (
                  <td>
                    {cert.status !== 'revoked' ? (
                      <button
                        className="btn btn-danger btn-sm"
                        id={`revoke-cert-${cert.id}`}
                        onClick={() => handleRevoke(cert.id)}
                      >
                        Revoke
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: 'var(--text-xs, 0.75rem)' }}>Revoked</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
