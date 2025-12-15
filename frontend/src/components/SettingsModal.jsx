import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';

const SettingsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
            <button 
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            {/* Appearance Section */}
            <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Appearance</h3>
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => setTheme('light')}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                            theme === 'light' 
                                ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" 
                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <Sun className="w-6 h-6" />
                        <span className="text-xs font-medium">Light</span>
                    </button>
                    
                    <button 
                        onClick={() => setTheme('dark')}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                            theme === 'dark' 
                                ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" 
                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <Moon className="w-6 h-6" />
                        <span className="text-xs font-medium">Dark</span>
                    </button>

                    <button 
                        onClick={() => setTheme('system')}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                            theme === 'system' 
                                ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" 
                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <Monitor className="w-6 h-6" />
                        <span className="text-xs font-medium">System</span>
                    </button>
                </div>
            </div>

            {/* Other Settings Placeholder */}
            <div>
                 <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Account</h3>
                 <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-300">You are logged in as <span className="font-semibold text-indigo-600 dark:text-indigo-400">User</span></p>
                 </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
