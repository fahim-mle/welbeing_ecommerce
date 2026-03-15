import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { mfaApi } from '../api/mfa';

interface MfaEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollmentComplete: (backupCodes: string[]) => void;
}

export const MfaEnrollmentModal = ({ isOpen, onClose, onEnrollmentComplete }: MfaEnrollmentModalProps) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      const enrollMfa = async () => {
        if (isMounted) {
          setEnrolling(true);
          setError('');
        }
        try {
          const response = await mfaApi.enroll();
          if (isMounted) {
            setQrCode(response.qrCode);
            setSecret(response.secret);
          }
        } catch (err) {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Failed to initialize MFA enrollment');
          }
        } finally {
          if (isMounted) {
            setEnrolling(false);
          }
        }
      };

      enrollMfa();
    } else {
      // Reset state when modal closes
      setQrCode('');
      setSecret('');
      setToken('');
      setError('');
      setEnrolling(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, retryTrigger]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (token.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await mfaApi.verifyEnrollment(token);
      if (response.success && response.backupCodes) {
        onEnrollmentComplete(response.backupCodes);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setToken(value);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Enable Two-Factor Authentication</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {enrolling ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Initializing MFA enrollment...</p>
            </div>
          ) : error && !qrCode ? (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setRetryTrigger((prev) => prev + 1)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: QR Code */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Scan QR Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use an authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
                </p>
                {qrCode && (
                  <div className="flex justify-center mb-4">
                    <img src={qrCode} alt="MFA QR Code" className="w-48 h-48 border border-gray-200 rounded-lg" />
                  </div>
                )}
                {secret && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Or enter this code manually:</p>
                    <code className="text-sm font-mono text-gray-900 break-all">{secret}</code>
                  </div>
                )}
              </div>

              {/* Step 2: Verify Code */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Verify Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit code from your authenticator app:
                </p>
                <form onSubmit={handleVerify}>
                  <div className="mb-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={token}
                      onChange={handleTokenChange}
                      placeholder="000000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      maxLength={6}
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || token.length !== 6}
                    className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                        Verifying...
                      </span>
                    ) : (
                      'Verify and Enable MFA'
                    )}
                  </button>
                </form>
              </div>

              {/* Info */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> After verification, you'll receive backup codes. Save them in a secure location.
                  You can use these codes to access your account if you lose your authenticator device.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
