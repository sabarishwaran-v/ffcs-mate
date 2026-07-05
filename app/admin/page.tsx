'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrGenerateTOTPSecret, verifyOTPAndGrantAccess } from './actions';
import { ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/button';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // TOTP State
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const result = await getOrGenerateTOTPSecret(user.uid, user.email!);
      
      if (!result.success) {
        toast.error(result.error);
        await auth.signOut();
      } else {
        if (result.requiresSetup && result.qrCodeDataUrl) {
          try {
            const dataUrl = await QRCode.toDataURL(result.qrCodeDataUrl);
            setQrCodeUrl(dataUrl);
          } catch (e) {
            console.error("Failed to generate QR code", e);
          }
        }
        setStep(2);
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your admin email first to reset password');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('Session lost. Please reload.');
      }
      
      const result = await verifyOTPAndGrantAccess(auth.currentUser.uid, auth.currentUser.email, otpCode);
      
      if (!result.success) {
        toast.error(result.error);
      } else {
        // Force refresh token to get the new custom claims (admin: true)
        await auth.currentUser.getIdToken(true);
        toast.success('Access Granted');
        router.push('/admin/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-2">Restricted Access. Authorized personnel only.</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary/50 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="admin@vitapstudent.ac.in"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground block">Password</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs text-red-500 hover:text-red-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="••••••••"
              />
            </div>
            <AnimatedButton 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 mt-4 font-bold"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to 2FA'}
            </AnimatedButton>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {qrCodeUrl && (
              <div className="flex flex-col items-center bg-secondary/30 p-4 rounded-xl border border-dashed">
                <p className="text-sm font-semibold mb-2 text-center text-foreground">Set up Authenticator App</p>
                <p className="text-xs text-muted-foreground text-center mb-4">Scan this QR code with Google Authenticator or Authy to set up your 2FA.</p>
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-lg bg-white p-2 border shadow-sm" />
              </div>
            )}
            
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                <KeyRound className="w-3 h-3 inline mr-1" />
                Authentication Code
              </label>
              <input 
                type="text" 
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] font-mono text-2xl bg-secondary/50 border rounded-lg px-4 py-4 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="000000"
              />
            </div>

            <AnimatedButton 
              type="submit" 
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 font-bold"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
            </AnimatedButton>
          </form>
        )}
      </div>
    </div>
  );
}
