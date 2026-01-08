
import React, { useState, useEffect } from 'react';
import { mockDb } from './services/mockFirebase';
import { User } from './types';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SweeperDashboard } from './pages/SweeperDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = mockDb.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setCurrentUser(mockDb.getCurrentUser());
  };

  const handleLogout = () => {
    mockDb.setCurrentUser(null);
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
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
