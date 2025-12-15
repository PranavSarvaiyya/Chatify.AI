import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <main className="lg:pl-64 min-h-screen flex flex-col relative w-full">
        
        {/* Mobile Header Trigger */}
        <div className="lg:hidden p-4 flex items-center gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
            <button 
                onClick={() => setIsMobileOpen(true)}
                className="p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-slate-800 dark:text-white">Chatify.AI</span>
        </div>

        {/* Content Injector */}
        <div className="flex-1 max-w-5xl mx-auto w-full p-4 lg:p-8">
            {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
