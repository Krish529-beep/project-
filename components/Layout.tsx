
import React from 'react';
import { mockDb } from '../services/mockFirebase';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const user = mockDb.getCurrentUser();

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'admin': return 'Municipal Authority';
      case 'sweeper': return 'Field Officer (Sweeper)';
      default: return 'Citizen';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1A73E8] rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">SwachhSnap</h1>
              <p className="text-xs text-gray-500 font-medium">{user ? getRoleLabel(user.role) : ''}</p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm font-medium text-gray-700">{user.name}</span>
              <button 
                onClick={onLogout}
                className="text-sm font-medium text-[#EA4335] hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© 2024 SwachhSnap Civic-Tech. Dedicated to a cleaner tomorrow.</p>
        </div>
      </footer>
    </div>
  );
};
