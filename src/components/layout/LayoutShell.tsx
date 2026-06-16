import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

const LayoutShell: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-theme">
      {/* Left Sidebar (Desktop only) */}
      <Sidebar />
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Header (Top Nav) */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto max-md:p-4">
          <Outlet />
        </main>
      </div>
      
      {/* Bottom Nav (Mobile only) */}
      <BottomNav />
    </div>
  );
};

export default LayoutShell;
