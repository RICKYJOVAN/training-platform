import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, departmentsApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { Department } from '@training-platform/shared-types';

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'hr_admin', label: 'HR Admin' },
  { value: 'compliance_officer', label: 'Compliance Officer' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.register({
        email,
        password,
        role,
        department_id: departmentId || undefined,
      });
      setAuth(result.user, result.accessToken);
      navigate('/certifications');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '0 var(--space-16)',
    }}>
      <div style={{ marginBottom: 'var(--space-10)' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 500,
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          maxWidth: 480,
        }}>
          Create an Account
        </h1>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--ink)',
          opacity: 0.45,
          marginTop: 'var(--space-3)',
        }}>
          Training & Certification Registry · Register to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="signup-email" className="form-label">Email address</label>
          <input
            id="signup-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-password" className="form-label">Password</label>
          <input
            id="signup-password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-confirm-password" className="form-label">Confirm Password</label>
          <input
            id="signup-confirm-password"
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-role" className="form-label">Role</label>
          <select
            id="signup-role"
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="signup-department" className="form-label">
            Department <span style={{ opacity: 0.45 }}>(optional)</span>
          </label>
          <select
            id="signup-department"
            className="form-select"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">— Select department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <button
          id="signup-submit"
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: 'var(--space-2)', justifyContent: 'center' }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p style={{
          marginTop: 'var(--space-6)',
          fontSize: 'var(--text-sm)',
          color: 'var(--ink)',
          opacity: 0.55,
          textAlign: 'center',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 500, opacity: 1 }}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
