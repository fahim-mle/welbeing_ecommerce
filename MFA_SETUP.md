# Multi-Factor Authentication (MFA) Setup Guide

## Overview

The Health & Wellbeing E-Commerce Platform implements TOTP-based (Time-based One-Time Password) Multi-Factor Authentication for enhanced security. MFA is **required for all admin accounts** and optional for regular users.

## Table of Contents

- [Features](#features)
- [User Guide](#user-guide)
  - [Enabling MFA](#enabling-mfa)
  - [Logging in with MFA](#logging-in-with-mfa)
  - [Using Backup Codes](#using-backup-codes)
  - [Regenerating Backup Codes](#regenerating-backup-codes)
- [Admin Guide](#admin-guide)
  - [Resetting User MFA](#resetting-user-mfa)
- [Technical Details](#technical-details)
- [API Endpoints](#api-endpoints)
- [Security Considerations](#security-considerations)

---

## Features

✅ **TOTP-based Authentication** - Compatible with Google Authenticator, Authy, 1Password, etc.  
✅ **QR Code Enrollment** - Easy setup by scanning QR code  
✅ **Backup Codes** - 10 single-use backup codes for account recovery  
✅ **Admin Enforcement** - Admins cannot access dashboard without MFA  
✅ **Self-Service Management** - Users can enable/disable MFA from profile  
✅ **Admin Reset** - Super-admins can reset MFA for users in emergency  

---

## User Guide

### Enabling MFA

**Step 1: Navigate to Profile**
1. Log in to your account
2. Click on your profile icon → **Profile**
3. Go to the **Security** tab

**Step 2: Enable MFA**
1. Click **Enable Two-Factor Authentication**
2. A modal will appear with a QR code

**Step 3: Scan QR Code**
1. Open your authenticator app (Google Authenticator, Authy, etc.)
2. Scan the QR code displayed
3. Alternatively, manually enter the secret code shown below the QR code

**Step 4: Verify Setup**
1. Enter the 6-digit code from your authenticator app
2. Click **Verify**

**Step 5: Save Backup Codes**
1. After verification, you'll see 10 backup codes
2. **IMPORTANT**: Save these codes in a secure location
3. Each code can only be used once
4. Options:
   - **Download** as text file
   - **Copy** to clipboard
   - **Print** for physical storage
5. Check "I have saved my backup codes" to close

**✅ MFA is now enabled!** Your next login will require a TOTP code.

---

### Logging in with MFA

**Step 1: Enter Email & Password**
1. Go to the login page
2. Enter your email and password
3. Click **Login**

**Step 2: Enter TOTP Code**
1. If MFA is enabled, you'll see a verification screen
2. Open your authenticator app
3. Enter the current 6-digit code
4. Click **Verify**

**✅ You're logged in!**

---

### Using Backup Codes

If you don't have access to your authenticator app, use a backup code:

**Step 1: Start Login**
1. Enter email and password
2. Click **Login**

**Step 2: Switch to Backup Code**
1. On the MFA verification screen, click **Use backup code instead**
2. Enter one of your saved backup codes (8 characters)
3. Click **Verify**

**⚠️ Important**: Each backup code can only be used once. After using a code, it will be marked as used.

---

### Regenerating Backup Codes

If you've used several backup codes or lost them:

**Step 1: Navigate to Profile**
1. Log in to your account
2. Go to **Profile** → **Security** tab

**Step 2: Regenerate Codes**
1. Click **Regenerate Backup Codes**
2. Your old codes will be invalidated
3. New codes will be displayed

**Step 3: Save New Codes**
1. Download, copy, or print the new codes
2. Store them securely
3. Check "I have saved my backup codes" to close

---

## Admin Guide

### Resetting User MFA

Super-admins can reset MFA for users who have lost access to their authenticator app and backup codes.

**Step 1: Navigate to Users Page**
1. Log in as admin
2. Go to **Admin** → **Users**

**Step 2: Find User**
1. Locate the user in the table
2. Check the **MFA** column to see if MFA is enabled

**Step 3: Reset MFA**
1. Click **Reset** in the MFA column
2. Confirm the action in the dialog
3. Click **Reset MFA**

**✅ MFA Reset Complete**
- User's MFA is now disabled
- All backup codes are deleted
- User can log in with just email/password
- User will need to re-enroll in MFA if required

---

## Technical Details

### TOTP Algorithm

- **Algorithm**: RFC 6238 (TOTP)
- **Hash**: SHA-1
- **Digits**: 6
- **Time Step**: 30 seconds
- **Window**: ±30 seconds (allows for clock drift)

### Backup Codes

- **Count**: 10 codes per user
- **Format**: 8 uppercase alphanumeric characters
- **Storage**: SHA-256 hashed in database
- **Single-use**: Marked with `usedAt` timestamp after use

### Token Flow

**Normal Login (No MFA):**
```
User → Email/Password → Access Token + Refresh Token (cookies) → Authenticated
```

**MFA Login:**
```
User → Email/Password → MFA Token (5 min expiry)
     → TOTP Code → Access Token + Refresh Token (cookies) → Authenticated
```

### Database Schema

**User Table:**
```sql
mfa_enabled     BOOLEAN DEFAULT false
mfa_secret      TEXT NULL
mfa_enrolled_at TIMESTAMP NULL
```

**MFA Backup Codes Table:**
```sql
id         SERIAL PRIMARY KEY
user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE
code       TEXT UNIQUE NOT NULL  -- SHA-256 hash
used_at    TIMESTAMP NULL
created_at TIMESTAMP DEFAULT NOW()
```

---

## API Endpoints

### Enrollment

**POST /api/auth/mfa/enroll**
- **Auth**: Required (user session)
- **Response**: `{ secret: string, qrCode: string }`
- **Purpose**: Generate TOTP secret and QR code

**POST /api/auth/mfa/verify-enrollment**
- **Auth**: Required (user session)
- **Body**: `{ token: string }` (6-digit TOTP)
- **Response**: `{ success: true, backupCodes: string[] }`
- **Purpose**: Verify TOTP and activate MFA

**GET /api/auth/mfa/status**
- **Auth**: Required (user session)
- **Response**: `{ mfaEnabled: boolean, mfaEnrolledAt: string | null }`
- **Purpose**: Check MFA enrollment status

### Login Verification

**POST /api/auth/mfa/verify**
- **Auth**: None (uses mfaToken)
- **Body**: `{ mfaToken: string, token: string }`
- **Response**: `{ user: { id, email, role } }` + cookies
- **Purpose**: Verify TOTP during login

**POST /api/auth/mfa/verify-backup-code**
- **Auth**: None (uses mfaToken)
- **Body**: `{ mfaToken: string, code: string }`
- **Response**: `{ user: { id, email, role } }` + cookies
- **Purpose**: Verify backup code during login

### Management

**POST /api/auth/mfa/regenerate-backup-codes**
- **Auth**: Required (user session)
- **Response**: `{ backupCodes: string[] }`
- **Purpose**: Generate new backup codes (invalidates old ones)

**POST /api/auth/mfa/reset**
- **Auth**: Required (admin session)
- **Body**: `{ userId: number }`
- **Response**: `{ success: true, message: string }`
- **Purpose**: Reset user's MFA (admin only)

---

## Security Considerations

### Best Practices

✅ **Use a Trusted Authenticator App**
- Google Authenticator
- Authy
- 1Password
- Microsoft Authenticator

✅ **Store Backup Codes Securely**
- Password manager
- Encrypted file
- Physical safe
- **Never** share or store in plain text

✅ **Enable MFA for Admin Accounts**
- Required for accessing admin dashboard
- Protects against compromised passwords

✅ **Regularly Review MFA Status**
- Check enrolled users in admin panel
- Monitor MFA reset actions in audit logs

### Security Features

🔒 **httpOnly Cookies** - Tokens stored in httpOnly cookies (not accessible via JavaScript)  
🔒 **Short-lived MFA Tokens** - 5-minute expiry for MFA verification tokens  
🔒 **Hashed Backup Codes** - SHA-256 hashed, never stored in plaintext  
🔒 **Single-use Backup Codes** - Each code can only be used once  
🔒 **Admin Enforcement** - Admins blocked from dashboard without MFA  
🔒 **Audit Logging** - MFA enrollment, verification, and reset actions logged  

### Common Issues

**Issue**: Lost authenticator app and backup codes  
**Solution**: Contact admin to reset MFA

**Issue**: TOTP code not working  
**Solution**: 
- Check device time is synchronized
- Wait for next code (codes change every 30 seconds)
- Ensure correct secret was scanned

**Issue**: Backup code not working  
**Solution**:
- Ensure code is entered exactly (8 uppercase alphanumeric)
- Check if code was already used
- Regenerate new codes if all are used

---

## Troubleshooting

### "Invalid TOTP code" Error

**Causes**:
1. Device time not synchronized
2. Wrong secret scanned
3. Code expired (30-second window)

**Solutions**:
1. Sync device time with internet time
2. Re-enroll MFA with new QR code
3. Wait for next code

### "Invalid backup code" Error

**Causes**:
1. Code already used
2. Typo in code entry
3. Codes regenerated (old codes invalidated)

**Solutions**:
1. Try another backup code
2. Carefully re-enter code (8 characters, uppercase)
3. Contact admin for MFA reset

### "MFA verification required" Error

**Cause**: Admin trying to access dashboard without completing MFA

**Solution**: Complete MFA enrollment from profile page

---

## Support

For additional help:
- 📖 [API Documentation](../src/backend/API_DOCS.md)
- 🔐 [Security Best Practices](./SECURITY.md)
- 📋 [Project README](../README.md)

---

**Last Updated**: March 2026  
**Version**: 1.0.0
