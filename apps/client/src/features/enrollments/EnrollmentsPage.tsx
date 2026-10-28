import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentsApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';

interface EnrollmentWithDetails {
  id: string;
  user_id: string;
  session_id: string;
  status: string;
  assigned_by: string | null;
  course_title: string;
  course_id: string;
  start_date: string;
  end_date: string | null;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flashId, setFlashId] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    enrollmentsApi.getMyEnrollments()
      .then((data) => setEnrollments(data as EnrollmentWithDetails[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = async (id: string) => {
    try {
      const updated = await enrollmentsApi.complete(id);
      setEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: (updated as EnrollmentWithDetails).status } : e))
      );
      setFlashId(id);
      setTimeout(() => setFlashId(null), 2200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error completing enrollment');
    }
  };

  const handleDrop = async (id: string) => {
    if (!confirm('Are you sure you want to drop this training enrollment?')) return;
    try {
      const updated = await enrollmentsApi.drop(id);
      setEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: (updated as EnrollmentWithDetails).status } : e))
      );
      setFlashId(id);
      setTimeout(() => setFlashId(null), 2200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error dropping enrollment');
    }
  };

  const canComplete = (e: EnrollmentWithDetails) =>
    ['employee', 'manager'].includes(user?.role || '') && e.status === 'enrolled';

  const canDrop = (e: EnrollmentWithDetails) =>
    ['enrolled', 'waitlisted'].includes(e.status);

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">My Enrollments</h1>
          <p className="page-subtitle">Training sessions you are registered for</p>
        </div>
        <Link to="/courses" className="btn btn-primary btn-sm" id="browse-courses-btn">
          Browse Courses to Enroll →
        </Link>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Session Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Assigned By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="loading-row"><td colSpan={6}>Loading enrollments…</td></tr>
            )}
            {!loading && enrollments.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
                  <p style={{ marginBottom: 'var(--space-3)' }}>No enrollments found.</p>
                  <Link to="/courses" className="btn btn-primary btn-sm">
                    Find a Course & Enroll
                  </Link>
                </td>
              </tr>
            )}
            {enrollments.map((e) => (
              <tr
                key={e.id}
                className={flashId === e.id ? 'status-flash' : ''}
                style={flashId === e.id ? { '--flash-color': 'var(--accent-active)' } as React.CSSProperties : {}}
              >
                <td style={{ fontWeight: 500 }}>{e.course_title}</td>
                <td className="tabular">{formatDate(e.start_date)}</td>
                <td className="tabular">{formatDate(e.end_date)}</td>
                <td>
                  <span className={`status-dot ${e.status}`}>
                    {e.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="text-muted">{e.assigned_by ? 'Manager' : 'Self'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {canComplete(e) && (
                      <button
                        className="btn btn-secondary btn-sm"
                        id={`complete-enrollment-${e.id}`}
                        onClick={() => handleComplete(e.id)}
                      >
                        Mark Complete
                      </button>
                    )}
                    {canDrop(e) && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--accent-revoked, #dc2626)' }}
                        id={`drop-enrollment-${e.id}`}
                        onClick={() => handleDrop(e.id)}
                      >
                        Drop
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
