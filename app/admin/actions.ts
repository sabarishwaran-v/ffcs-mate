'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

function encryptSecret(text: string): string {
  const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY || 'default_fallback_key_minimum_32_chars!';
  const keyBuffer = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptSecret(text: string): string {
  const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY || 'default_fallback_key_minimum_32_chars!';
  const keyBuffer = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift() as string, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function isAllowedEmail(email: string) {
  const allowedEmails = (process.env.ADMIN_EMAILS || "").split(',').map(e => e.trim().toLowerCase());
  return allowedEmails.includes(email.toLowerCase());
}

export async function getOrGenerateTOTPSecret(uid: string, email: string) {
  if (!isAllowedEmail(email)) {
    return { success: false, error: 'Unauthorized email address.' };
  }

  try {
    const adminDb = getAdminDb();
    const doc = await adminDb.collection('admin_secrets').doc(uid).get();

    if (doc.exists) {
      return { success: true, requiresSetup: false };
    } else {
      const secretObj = speakeasy.generateSecret({ name: 'FFCS Mate Admin (' + email + ')' });
      const secret = secretObj.base32;
      const encryptedSecret = encryptSecret(secret);
      
      await adminDb.collection('admin_secrets').doc(uid).set({
        secret: encryptedSecret,
        email: email,
        createdAt: new Date().toISOString()
      });

      const otpauth = secretObj.otpauth_url;
      const qrCodeDataUrl = await QRCode.toDataURL(otpauth!);

      return { success: true, requiresSetup: true, qrCodeDataUrl };
    }
  } catch (error: any) {
    console.error("TOTP Gen Error:", error);
    return { success: false, error: error.message };
  }
}

export async function verifyOTPAndGrantAccess(uid: string, email: string, token: string) {
  if (!isAllowedEmail(email)) {
    return { success: false, error: 'Unauthorized email address.' };
  }

  try {
    const adminDb = getAdminDb();
    const doc = await adminDb.collection('admin_secrets').doc(uid).get();
    
    if (!doc.exists) {
      return { success: false, error: '2FA setup not found. Please refresh.' };
    }

    const encryptedSecret = doc.data()?.secret;
    const secret = decryptSecret(encryptedSecret);

    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow 30 seconds before/after
    });

    if (isValid) {
      const adminAuth = getAdminAuth();
      await adminAuth.setCustomUserClaims(uid, { admin: true, mfa_verified: true });
      return { success: true };
    } else {
      return { success: false, error: 'Invalid authentication code.' };
    }
  } catch (error: any) {
    console.error("OTP Verify Error:", error);
    return { success: false, error: error.message };
  }
}
