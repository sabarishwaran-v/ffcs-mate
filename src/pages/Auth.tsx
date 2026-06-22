import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldAlert, CheckCircle2, UserCircle2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

export default function Auth() {
  const navigate = useNavigate();
  const { user, login, updatePrivacy } = useUserStore();
  
  const [error, setError] = useState('');
  const [step, setStep] = useState<'LOGIN' | 'PRIVACY'>('LOGIN');

  const handleMockGoogleLogin = () => {
    try {
      // In production, this will use Firebase Auth: signInWithPopup(auth, provider)
      // For now, we simulate a successful VIT-AP Google Login
      login('sabarishwaran.25bce7xxx@vitapstudent.ac.in');
      setStep('PRIVACY');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePrivacyComplete = () => {
    navigate('/planner');
  };

  if (step === 'PRIVACY' && user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-lg w-full animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 p-4 rounded-full text-emerald-600">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Welcome, {user.name}!</h2>
          <p className="text-center text-gray-500 mb-8">
            Registration Number: <span className="font-mono font-semibold text-gray-800">{user.regNo}</span>
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
            <h3 className="flex items-center text-blue-900 font-semibold mb-2">
              <ShieldAlert className="w-5 h-5 mr-2" /> Privacy Settings
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              Since you will be able to collaborate with friends, we want to respect your privacy.
            </p>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={user.privacy.shareRegNo}
                  onChange={(e) => updatePrivacy({ shareRegNo: e.target.checked })}
                  className="mt-1 w-5 h-5 text-[#0056b3] rounded border-gray-300 focus:ring-[#0056b3]"
                />
                <div>
                  <div className="font-medium text-gray-900">Share my Registration Number</div>
                  <div className="text-sm text-gray-500">Allow collaborative partners to see your Reg No. Otherwise, they only see your first name.</div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={user.privacy.discoverable}
                  onChange={(e) => updatePrivacy({ discoverable: e.target.checked })}
                  className="mt-1 w-5 h-5 text-[#0056b3] rounded border-gray-300 focus:ring-[#0056b3]"
                />
                <div>
                  <div className="font-medium text-gray-900">Make me Discoverable</div>
                  <div className="text-sm text-gray-500">Allow other students to find you and invite you to collaborate.</div>
                </div>
              </label>
            </div>
          </div>

          <button 
            onClick={handlePrivacyComplete}
            className="w-full bg-[#0056b3] text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Continue to Planner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-full text-[#0056b3]">
            <UserCircle2 className="w-12 h-12" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Sign In Required</h2>
        <p className="text-center text-gray-500 mb-8">
          To use the Collaborative Planner and save your progress to the cloud, you must sign in.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm mb-6 border border-red-200">
            {error}
          </div>
        )}

        <button 
          onClick={handleMockGoogleLogin}
          className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-4 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all mb-4"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Sign In with Google</span>
        </button>

        <p className="text-xs text-center text-gray-400">
          Only <span className="font-semibold text-gray-600">@vitapstudent.ac.in</span> accounts are permitted.
        </p>

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/planner')} className="text-sm text-gray-500 hover:text-gray-800 underline transition-colors">
            Continue without an Account
          </button>
        </div>
      </div>
    </div>
  );
}
