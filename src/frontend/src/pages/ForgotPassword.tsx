import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage(null);

    try {
      await authApi.forgotPassword(email);
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email.';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Check your inbox</h2>
          <p className="text-gray-600">
            If an account exists for <span className="font-semibold">{email}</span>, we sent a password reset link.
          </p>
          <Link to="/login" className="text-indigo-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Forgot password</h2>
        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{errorMessage}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="space-y-2">
            <span className="form-label">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-input"
              required
            />
          </label>
          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
            {status === 'loading' ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
