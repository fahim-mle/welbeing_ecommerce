import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { login, error, isLoading, mfaRequired, verifyMfa, verifyBackupCode, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mfaRequired) {
        // MFA verification step
        if (useBackupCode) {
          await verifyBackupCode(mfaCode);
        } else {
          await verifyMfa(mfaCode);
        }
      } else {
        // Normal login
        await login(email, password);
      }
    } catch {
      // Error handled by context/hook
    }
  };

  // Navigate on successful authentication
  useEffect(() => {
    if (isAuthenticated && !mfaRequired) {
      navigate('/');
    }
  }, [isAuthenticated, mfaRequired, navigate]);

  // Reset MFA state on unmount
  useEffect(() => {
    return () => {
      setMfaCode('');
      setUseBackupCode(false);
    };
  }, []);

  // MFA Verification Form
  if (mfaRequired) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Two-Factor Authentication</h2>
        <p className="text-text-secondary mb-4 text-center">
          {useBackupCode 
            ? 'Enter one of your backup codes' 
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
        
        {error && <div className="bg-danger-100 text-danger-700 p-3 mb-4 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label" htmlFor="mfaCode">
              {useBackupCode ? 'Backup Code' : 'Verification Code'}
            </label>
            <input
              id="mfaCode"
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              className="form-input text-center text-2xl tracking-widest font-mono"
              placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
              maxLength={useBackupCode ? 8 : 6}
              required
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full mb-4"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setMfaCode('');
            }}
            className="text-sm text-blue-600 hover:underline w-full text-center"
          >
            {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
          </button>
        </form>
      </div>
    );
  }

  // Normal Login Form
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      {error && <div className="bg-danger-100 text-danger-700 p-3 mb-4 rounded">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
            autoComplete="email"
          />
        </div>
        <div className="mb-6">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="flex justify-end mb-4">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-text-secondary">Don't have an account? <Link to="/register" className="text-blue-600">Register</Link></p>
      </div>
    </div>
  );
};

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, error, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password);
      navigate('/');
    } catch {
      // Error handled
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      {error && <div className="bg-danger-100 text-danger-700 p-3 mb-4 rounded">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
            autoComplete="email"
          />
        </div>
        <div className="mb-6">
          <label className="form-label" htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-text-secondary">Already have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
      </div>
    </div>
  );
};
