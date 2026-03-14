import { useState } from 'react';
import { Download, Copy, Printer, AlertTriangle, X, Check } from 'lucide-react';

interface BackupCodesModalProps {
  isOpen: boolean;
  backupCodes: string[];
  onClose: () => void;
}

export const BackupCodesModal = ({ isOpen, backupCodes, onClose }: BackupCodesModalProps) => {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const downloadCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const text = backupCodes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const escapeHtml = (str: string): string => {
    const htmlEscapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
  };

  const printCodes = () => {
    const printWindow = window.open('', '', 'width=600,height=400');
    if (printWindow) {
      const escapedCodes = backupCodes.map(code => escapeHtml(code));
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>MFA Backup Codes</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              p { color: #666; margin-bottom: 20px; }
              ul { list-style: none; padding: 0; }
              li { font-family: monospace; font-size: 16px; padding: 8px; margin: 4px 0; background: #f5f5f5; border: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <h1>MFA Backup Codes</h1>
            <p>Save these codes in a secure location. Each code can be used once to access your account if you lose your authenticator device.</p>
            <ul>${escapedCodes.map(code => `<li>${code}</li>`).join('')}</ul>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleClose = () => {
    if (saved) {
      setSaved(false);
      setCopied(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Backup Codes</h2>
          <button
            onClick={handleClose}
            disabled={!saved}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Banner */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 mb-1">
                  Save these codes now!
                </h3>
                <p className="text-sm text-amber-700">
                  These backup codes will only be shown once. Store them in a secure location.
                  Each code can be used once to access your account if you lose your authenticator device.
                </p>
              </div>
            </div>
          </div>

          {/* Backup Codes Grid */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Backup Codes:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-center"
                >
                  <code className="text-lg font-mono font-semibold text-gray-900 tracking-wider">
                    {code}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={downloadCodes}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={printCodes}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
                className="mt-1 mr-3 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                <strong className="font-semibold text-gray-900">
                  I have saved my backup codes
                </strong>
                {' '}in a secure location and understand they will not be shown again.
              </span>
            </label>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={!saved}
            className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saved ? 'Close' : 'Please confirm you have saved your codes'}
          </button>
        </div>
      </div>
    </div>
  );
};
