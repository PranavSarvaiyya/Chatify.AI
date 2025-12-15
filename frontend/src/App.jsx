import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ChatInterface from './components/ChatInterface';
import DashboardLayout from './layouts/DashboardLayout';
import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';

// Wraps Sidebar + Content and manages State
const Dashboard = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [activeChatId, setActiveChatId] = useState(null);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <Sidebar 
                isMobileOpen={isMobileOpen} 
                setIsMobileOpen={setIsMobileOpen} 
                onChatSelect={(id) => setActiveChatId(id)}
            />

            {/* Main Content Area */}
            <main className="lg:pl-64 flex-1 flex flex-col relative w-full h-full">
                
                {/* Mobile Header Trigger */}
                <div className="lg:hidden p-4 flex items-center gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 z-30">
                    <button 
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-slate-800 dark:text-white">Chatify.AI</span>
                </div>

                {/* Content Injector - Constrained Height */}
                <div className="flex-1 w-full max-w-5xl mx-auto p-4 lg:p-8 overflow-hidden flex flex-col">
                    <ChatInterface activeChatId={activeChatId} />
                </div>
            </main>
        </div>
    );
};

// Auth Guard
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Dashboard Routes with Layout */}
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </Router>
  );
}

export default App;
