import React, { useState, useEffect } from 'react';
import { assessmentsApi } from '../../api/client';
import { AssessmentResult } from '@training-platform/shared-types';
import { useAuthStore } from '../../store/auth.store';

interface AssessmentWithCourse {
  id: string;
  course_id: string;
  pass_score: number;
  max_attempts: number;
  course_title: string;
  course_category: string | null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentWithCourse[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [score, setScore] = useState('');
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = useAuthStore((s) => s.user);

  const isTrainer = user?.role === 'trainer' || user?.role === 'hr_admin';

  // Load assessment list on mount
  useEffect(() => {
    assessmentsApi.list()
      .then((data) => {
        setAssessments(data as AssessmentWithCourse[]);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingAssessments(false));
  }, []);

  const selectedAssessment = assessments.find((a) => a.id === selectedId);

  const fetchResults = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const data = await assessmentsApi.getResults(selectedId);
      setResults(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading results');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) { setError('Please select an assessment'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await assessmentsApi.submit(selectedId, Number(score));
      setSuccess(
        result.passed
          ? '✓ Passed! A certification has been issued.'
          : `Score: ${result.score} — Not passed. Try again.`
      );
      setScore('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assessments</h1>
          <p className="page-subtitle">Submit assessment scores or view results</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)' }}>
        {/* Submit Panel */}
        <div className="panel" style={{ padding: 'var(--space-6)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-5)' }}>
            Submit Score
          </h2>
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="assessment-select" className="form-label">Assessment</label>
              {loadingAssessments ? (
                <div className="text-muted" style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2) 0' }}>Loading assessments…</div>
              ) : (
                <select
                  id="assessment-select"
                  className="form-select"
                  value={selectedId}
                  onChange={(e) => { setSelectedId(e.target.value); setResults([]); setSuccess(''); setError(''); }}
                  required
                >
                  <option value="">— Select an assessment —</option>
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.course_title}{a.course_category ? ` (${a.course_category})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedAssessment && (
              <div style={{
                background: 'var(--surface)',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span className="text-muted">Pass score</span>
                  <span style={{ fontWeight: 500 }}>{selectedAssessment.pass_score} / 100</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Max attempts</span>
                  <span style={{ fontWeight: 500 }}>{selectedAssessment.max_attempts}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="assessment-score" className="form-label">Score (0–100)</label>
              <input
                id="assessment-score"
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="form-input"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Enter your score"
                required
              />
            </div>
            <button
              id="submit-assessment-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedId}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Submitting…' : 'Submit Assessment'}
            </button>
          </form>
        </div>

        {/* Results Panel (trainer/hr_admin only) */}
        {isTrainer && (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Assessment Results</span>
              <button
                id="load-results-btn"
                className="btn btn-secondary btn-sm"
                onClick={fetchResults}
                disabled={!selectedId || loading}
              >
                Load Results
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Attempt</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr className="loading-row"><td colSpan={4}>Loading…</td></tr>
                )}
                {!loading && results.length === 0 && (
                  <tr><td colSpan={4} className="empty-state">Select an assessment and click Load Results.</td></tr>
                )}
                {results.map((r) => (
                  <tr key={r.id}>
                    <td className="tabular">{r.attempt_no ?? '—'}</td>
                    <td className="tabular">{r.score ?? '—'}</td>
                    <td>
                      <span className={`status-dot ${r.passed ? 'active' : 'expired'}`}>
                        {r.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="tabular text-sm">{formatDate(r.graded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
