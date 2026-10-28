import { Fragment, useEffect, useState } from 'react';

import { coursesApi, sessionsApi, enrollmentsApi } from '../../api/client';
import { Course } from '@training-platform/shared-types';
import { useAuthStore } from '../../store/auth.store';

interface Session {
  id: string;
  course_id: string;
  instructor_id: string | null;
  start_date: string;
  end_date: string | null;
  capacity: number | null;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAuthStore((s) => s.user);

  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [sessionsByCourse, setSessionsByCourse] = useState<Record<string, Session[]>>({});
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [enrollingSessionId, setEnrollingSessionId] = useState<string | null>(null);
  const [enrollMessage, setEnrollMessage] = useState<{ sessionId: string; text: string; isError: boolean } | null>(null);

  useEffect(() => {
    coursesApi.list()
      .then(setCourses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const canCreate = user?.role === 'hr_admin';

  const toggleSessions = async (courseId: string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }
    setExpandedCourseId(courseId);
    setEnrollMessage(null);
    if (!sessionsByCourse[courseId]) {
      setSessionsLoading(true);
      try {
        const sessions = await sessionsApi.list(courseId);
        setSessionsByCourse((prev) => ({ ...prev, [courseId]: sessions as Session[] }));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error loading sessions');
      } finally {
        setSessionsLoading(false);
      }
    }
  };

  const handleEnroll = async (sessionId: string) => {
    setEnrollingSessionId(sessionId);
    setEnrollMessage(null);
    try {
      const enrollment = await enrollmentsApi.enroll({ session_id: sessionId });
      const status = (enrollment as { status?: string }).status;
      setEnrollMessage({
        sessionId,
        text: status === 'waitlisted'
          ? 'Session is full — you have been waitlisted.'
          : 'Enrolled! Check "Enrollments" to see it.',
        isError: false,
      });
    } catch (e: unknown) {
      setEnrollMessage({
        sessionId,
        text: e instanceof Error ? e.message : 'Could not enroll',
        isError: true,
      });
    } finally {
      setEnrollingSessionId(null);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Catalogue</h1>
          <p className="page-subtitle">All training courses available in the registry</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary btn-sm" id="create-course-btn">
            Add Course
          </button>
        )}
      </div>

      <div className="panel">
        {error && <div className="alert alert-error" style={{ margin: 'var(--space-4)' }}>{error}</div>}
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Validity</th>
              <th>Version</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="loading-row">
                <td colSpan={6}>Loading courses…</td>
              </tr>
            )}
            {!loading && courses.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">No courses found.</td>
              </tr>
            )}
            {courses.map((c) => (
              <Fragment key={c.id}>
                <tr>
                  <td>
                    <span style={{ fontWeight: 500 }}>{c.title}</span>
                    {c.is_mandatory && <span className="mandatory-tag" style={{ marginLeft: 'var(--space-3)' }}>Mandatory</span>}
                  </td>
                  <td className="text-muted">{c.category || '—'}</td>
                  <td>{c.is_mandatory ? 'Mandatory' : 'Optional'}</td>
                  <td className="tabular">
                    {c.validity_months ? `${c.validity_months} months` : 'No expiry'}
                  </td>
                  <td className="tabular text-muted">v{c.version}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleSessions(c.id)}
                    >
                      {expandedCourseId === c.id ? 'Hide Sessions' : 'View Sessions'}
                    </button>
                  </td>
                </tr>
                {expandedCourseId === c.id && (
                  <tr>
                    <td colSpan={6} style={{ background: 'var(--surface)', padding: 'var(--space-4)' }}>
                      {sessionsLoading && !sessionsByCourse[c.id] && <span className="text-muted">Loading sessions…</span>}
                      {!sessionsLoading && sessionsByCourse[c.id]?.length === 0 && (
                        <span className="text-muted">No scheduled sessions for this course yet.</span>
                      )}
                      {sessionsByCourse[c.id] && sessionsByCourse[c.id].length > 0 && (
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Start</th>
                              <th>End</th>
                              <th>Capacity</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionsByCourse[c.id].map((s) => (
                              <tr key={s.id}>
                                <td className="tabular">{formatDate(s.start_date)}</td>
                                <td className="tabular">{formatDate(s.end_date)}</td>
                                <td className="tabular">{s.capacity ?? '—'}</td>
                                <td>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    disabled={enrollingSessionId === s.id}
                                    onClick={() => handleEnroll(s.id)}
                                  >
                                    {enrollingSessionId === s.id ? 'Enrolling…' : 'Enroll'}
                                  </button>
                                  {enrollMessage?.sessionId === s.id && (
                                    <span
                                      style={{
                                        marginLeft: 'var(--space-3)',
                                        color: enrollMessage.isError ? 'var(--accent-expired)' : 'var(--accent-active)',
                                      }}
                                    >
                                      {enrollMessage.text}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
