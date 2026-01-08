
import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

interface LoginProps {
  onLogin: () => void;
  onShowRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onShowRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const quickSelect = (e: string) => {
    setEmail(e);
    setPassword('demopass123');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1A73E8] rounded-3xl mb-6 shadow-xl shadow-blue-100">
            <span className="text-4xl text-white font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SwachhSnap</h1>
          <p className="text-gray-500 mt-2">Civic tech for a cleaner city</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent outline-none transition-all"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A73E8] text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Quick Login (Testing Only)</p>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => quickSelect('admin@city.gov')}
                className="flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-600">Admin Account</span>
                <span className="text-[10px] text-gray-400 group-hover:text-[#1A73E8]">admin@city.gov</span>
              </button>
              <button 
                onClick={() => quickSelect('rajesh@clean.com')}
                className="flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-600">Sweeper Account</span>
                <span className="text-[10px] text-gray-400 group-hover:text-[#34A853]">rajesh@clean.com</span>
              </button>
              <button 
                onClick={() => quickSelect('john@example.com')}
                className="flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-600">Citizen Account</span>
                <span className="text-[10px] text-gray-400 group-hover:text-[#FBBC05]">john@example.com</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <button 
              onClick={onShowRegister}
              className="text-[#1A73E8] font-bold hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
