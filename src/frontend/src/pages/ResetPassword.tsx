import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface rounded-2xl shadow-sm border border-border-default p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-text-primary">Invalid reset link</h2>
          <p className="text-text-secondary">Please request a new password reset link.</p>
          <Link to="/forgot-password" className="text-primary-600 hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      await authApi.resetPassword(token, password);
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password.';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-sm border border-border-default p-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Set a new password</h2>
        {status === 'success' ? (
          <div className="text-center text-success-600">
            Password updated! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="bg-danger-100 text-danger-700 p-3 rounded">{errorMessage}</div>
            )}
            <label className="space-y-2">
              <span className="form-label">New password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="form-input"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="form-label">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="form-input"
                required
              />
            </label>
            <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
              {status === 'loading' ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-text-secondary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
