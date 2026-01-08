
import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseService } from './services/firebaseService';
import { User } from './types';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SweeperDashboard } from './pages/SweeperDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Listen for real Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userProfile = await firebaseService.getUser(fbUser.uid);
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setView('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    if (view === 'register') {
      return (
        <Register 
          onRegister={() => {}} // State handled by onAuthStateChanged
          onShowLogin={() => setView('login')} 
        />
      );
    }
    return (
      <Login 
        onLogin={() => {}} // State handled by onAuthStateChanged
        onShowRegister={() => setView('register')} 
      />
    );
  }

  return (
    <Layout onLogout={handleLogout}>
      {currentUser.role === 'user' && <CitizenDashboard />}
      {currentUser.role === 'admin' && <AdminDashboard />}
      {currentUser.role === 'sweeper' && <SweeperDashboard />}
    </Layout>
  );
};

export default App;
