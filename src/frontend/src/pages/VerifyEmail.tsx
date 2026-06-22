import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authApi } from '../api/auth';

export const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been successfully verified.');
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed.';
        setStatus('error');
        setMessage(errorMessage);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-sm border border-border-default p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Email Verification</h2>
        {status === 'verifying' && <p className="text-text-secondary">Verifying your email...</p>}
        {status !== 'verifying' && (
          <p className={status === 'success' ? 'text-success-600' : 'text-danger-600'}>{message}</p>
        )}
        <Link
          to="/login"
          className="btn-primary inline-flex items-center justify-center px-6 py-3"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};
