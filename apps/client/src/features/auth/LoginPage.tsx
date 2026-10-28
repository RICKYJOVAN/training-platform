import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      setAuth(result.user, result.accessToken);
      navigate('/certifications');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
      <div style={{ marginBottom: 'var(--space-12)' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 500,
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          maxWidth: 480,
        }}>
          Training &amp; Certification Registry
        </h1>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--ink)',
          opacity: 0.45,
          marginTop: 'var(--space-3)',
        }}>
          Internal records system · Sign in to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="login-email" className="form-label">Email address</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="form-label">Password</label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          id="login-submit"
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: 'var(--space-2)', justifyContent: 'center' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{
          marginTop: 'var(--space-6)',
          fontSize: 'var(--text-xs)',
          color: 'var(--ink)',
          opacity: 0.35,
          borderTop: 'var(--border)',
          paddingTop: 'var(--space-5)',
        }}>
          Demo: <code style={{ fontFamily: 'var(--font-body)' }}>hr.admin@company.com</code> / <code style={{ fontFamily: 'var(--font-body)' }}>Password123!</code>
        </p>

        <p style={{
          marginTop: 'var(--space-5)',
          fontSize: 'var(--text-sm)',
          color: 'var(--ink)',
          opacity: 0.55,
          textAlign: 'center',
        }}>
          Don't have an account?{' '}
          <Link to="/signup" id="goto-signup" style={{ color: 'var(--ink)', fontWeight: 500, opacity: 1 }}>
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
