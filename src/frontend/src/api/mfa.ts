import { API_BASE_URL } from '../config';

// Response types
export interface MfaEnrollResponse {
  secret: string;
  qrCode: string;
}

export interface MfaVerifyEnrollmentResponse {
  success: boolean;
  backupCodes: string[];
}

export interface MfaStatusResponse {
  mfaEnabled: boolean;
  mfaEnrolledAt: string | null;
}

export interface MfaVerifyResponse {
  user: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    role: string;
    isActive?: boolean;
    mfaEnabled?: boolean;
  };
}

export interface RegenerateBackupCodesResponse {
  backupCodes: string[];
}

export interface ResetMfaResponse {
  success: boolean;
  message: string;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

// API functions
export const mfaApi = {
  // Enroll in MFA (generate TOTP secret + QR code)
  async enroll(): Promise<MfaEnrollResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/mfa/enroll`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'MFA enrollment failed');
    }
    return res.json();
  },

  // Verify TOTP code during enrollment
  async verifyEnrollment(token: string): Promise<MfaVerifyEnrollmentResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/mfa/verify-enrollment`, {
      method: 'POST',
      headers: jsonHeaders,
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'TOTP verification failed');
    }
    return res.json();
  },

  // Get MFA status
  async getStatus(): Promise<MfaStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/mfa/status`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to get MFA status');
    }
    return res.json();
  },

  // Verify TOTP code during login
  async verifyLogin(mfaToken: string, token: string): Promise<MfaVerifyResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/mfa/verify`, {
      method: 'POST',
      headers: jsonHeaders,
      credentials: 'include',
      body: JSON.stringify({ mfaToken, token }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'MFA verification failed');
    }
    return res.json();
  },

  // Verify backup code during login
  async verifyBackupCode(mfaToken: string, code: string): Promise<MfaVerifyResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/mfa/verify-backup-code`, {
      method: 'POST',
      headers: jsonHeaders,
      credentials: 'include',
      body: JSON.stringify({ mfaToken, code }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Backup code verification failed');
    }
    return res.json();
  },

  // Regenerate backup codes
  async regenerateBackupCodes(): Promise<RegenerateBackupCodesResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/mfa/regenerate-backup-codes`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to regenerate backup codes');
    }
    return res.json();
  },

  // Reset user's MFA (admin only)
  async resetMfa(userId: number): Promise<ResetMfaResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/mfa/reset`, {
      method: 'POST',
      headers: jsonHeaders,
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to reset MFA');
    }
    return res.json();
  },
};
