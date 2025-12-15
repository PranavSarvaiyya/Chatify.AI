import React, { useState, useEffect } from 'react';
import { 
  Sparkles,
  Plus, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User, 
  History,
  X,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';
import UploadModal from './UploadModal';

const Sidebar = ({ isMobileOpen, setIsMobileOpen, onChatSelect }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get('http://127.0.0.1:8000/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDelete = async (e, chatId) => {
      e.stopPropagation();
      if (!window.confirm("Delete this chat?")) return;

      const token = localStorage.getItem('token');
      try {
          await axios.delete(`http://127.0.0.1:8000/history/${chatId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          fetchHistory(); // Refresh list
          if (onChatSelect) onChatSelect(null); // Deselect if current
      } catch (error) {
          console.error("Failed to delete chat", error);
      }
  };

  const handleUploadSuccess = (data) => {
      fetchHistory(); // Refresh list
      if (data && data.chat_id) {
          if (onChatSelect) onChatSelect(data.chat_id); // Open the new chat
      }
  };

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        
        {/* Header */}
        <div className="p-4">
            <div className="flex items-center gap-2 mb-6 px-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                    Chatify.AI
                </h1>
                <button onClick={() => setIsMobileOpen(false)} className="ml-auto lg:hidden text-slate-500">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <button 
                onClick={() => setIsUploadOpen(true)}
                className="w-full flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 font-medium group"
            >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                <span>New Chat</span>
            </button>
        </div>

        {/* Scrollable History */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Recent
            </div>
            
            {history.length === 0 ? (
                <div className="px-3 py-4 text-sm text-slate-400 italic text-center">
                    No chats yet. Start one!
                </div>
            ) : (
                history.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => {
                            if (onChatSelect) onChatSelect(item.id);
                            setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-left group cursor-pointer"
                    >
                        <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0" />
                        <span className="truncate flex-1">{item.title}</span>
                        <button 
                            onClick={(e) => handleDelete(e, item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-500 rounded-md transition-all"
                            title="Delete Chat"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-900">
                    U
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">User</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Pro Plan</p>
                </div>
                <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      setIsSettingsOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    <Settings className="w-4 h-4" />
                </button>
                 <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
