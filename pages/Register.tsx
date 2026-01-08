
import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseService } from '../services/firebaseService';
import { Role } from '../types';

interface RegisterProps {
  onRegister: () => void;
  onShowLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegister, onShowLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
      const uid = userCredential.user.uid;

      // 2. Create Firestore Profile
      await firebaseService.saveUser({
        uid,
        name,
        email: email.toLowerCase(),
        role,
        createdAt: Date.now(),
      });

      onRegister();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1A73E8] rounded-3xl mb-6 shadow-xl shadow-blue-100">
            <span className="text-4xl text-white font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Join SwachhSnap</h1>
          <p className="text-gray-500 mt-2">Create an account to help clean your city</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              placeholder="rahul@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  role === 'user' ? 'border-[#1A73E8] bg-blue-50 text-[#1A73E8]' : 'border-gray-100 text-gray-500'
                }`}
              >
                Citizen User
              </button>
              <button
                type="button"
                onClick={() => setRole('sweeper')}
                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  role === 'sweeper' ? 'border-[#34A853] bg-green-50 text-[#34A853]' : 'border-gray-100 text-gray-500'
                }`}
              >
                Field Sweeper
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A73E8] text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button onClick={onShowLogin} className="text-[#1A73E8] font-bold hover:underline">Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
};
