
import React, { useState } from 'react';
import { mockDb } from '../services/mockFirebase';
import { COLORS } from '../constants';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const users = mockDb.getUsers();
      const user = users.find(u => u.email === email.toLowerCase());
      
      if (user) {
        mockDb.setCurrentUser(user);
        onLogin();
      } else {
        setError('Invalid credentials. Please click one of the demo accounts below.');
      }
      setLoading(false);
    }, 800);
  };

  const quickSelect = (e: string) => {
    setEmail(e);
    setPassword('demopass');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1A73E8] rounded-3xl mb-6 shadow-xl shadow-blue-100">
            <span className="text-4xl text-white font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SwachhSnap</h1>
          <p className="text-gray-500 mt-2">Civic tech for a cleaner city</p>
        </div>

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
            <p className="text-[10px] text-gray-400 mt-1 ml-1">* Use any password for demo accounts</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A73E8] text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-sm font-bold text-gray-900 mb-3 text-center uppercase tracking-wider">Quick Demo Login</p>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => quickSelect('admin@city.gov')}
              className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-[#1A73E8] transition-all group"
            >
              <span className="text-sm font-medium text-gray-700">Municipal Admin</span>
              <span className="text-xs text-[#1A73E8] font-bold group-hover:underline">Select</span>
            </button>
            <button 
              onClick={() => quickSelect('rajesh@clean.com')}
              className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-[#34A853] transition-all group"
            >
              <span className="text-sm font-medium text-gray-700">Field Sweeper</span>
              <span className="text-xs text-[#34A853] font-bold group-hover:underline">Select</span>
            </button>
            <button 
              onClick={() => quickSelect('john@example.com')}
              className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-[#FBBC05] transition-all group"
            >
              <span className="text-sm font-medium text-gray-700">Citizen User</span>
              <span className="text-xs text-[#FBBC05] font-bold group-hover:underline">Select</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
