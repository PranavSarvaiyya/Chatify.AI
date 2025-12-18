import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Sparkles, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const ChatInterface = forwardRef(({ activeChatId }, ref) => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Allow parent to trigger active chat reloads
    useImperativeHandle(ref, () => ({
        loadChat: (chatId) => fetchChat(chatId)
    }));

    const fetchChat = async (chatId) => {
        if (!chatId) {
            setMessages([]);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        try {
            const response = await api.get(`/history/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Map MongoDB messages format to UI format
            if (response.data.messages) {
                 setMessages(response.data.messages);
            } else {
                 setMessages([]);
            }
        } catch (error) {
            console.error("Error fetching chat", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeChatId) {
            fetchChat(activeChatId);
        } else {
            setMessages([]); // Reset if no chat selected
        }
    }, [activeChatId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMessage = { role: 'user', text: query };
        setMessages((prev) => [...prev, userMessage]);
        setQuery('');
        setLoading(true);

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const result = await api.post('/chat', 
                { query: userMessage.text, chat_id: activeChatId }, // Pass active Chat ID
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            const botMessage = { role: 'bot', text: result.data.answer };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                const errorMessage = { role: 'bot', text: "Sorry, I encountered an error. Please try again." };
                setMessages((prev) => [...prev, errorMessage]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="flex flex-col h-full">
            
            {/* Chat Area - Takes available space */}
            {/* Chat Area - Takes available space */}
            <div className="flex-1 overflow-y-auto scroll-smooth pl-2" style={{ direction: 'rtl' }}>
                <div className="min-h-full flex flex-col space-y-6 pb-4 pr-2" style={{ direction: 'ltr' }}>
                    {messages.length === 0 && !loading && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                <Sparkles className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {activeChatId ? "Start conversation..." : "Select or create a chat"}
                            </h3>
                            <p className="text-slate-500 max-w-sm mt-2">
                                Ask me anything about your documents. I'm here to help.
                            </p>
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            {msg.role !== 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-4 h-4 text-black dark:text-white" />
                                </div>
                            )}

                            {/* Bubble */}
                            <div className={`max-w-[85%] rounded-2xl px-6 py-4 text-[15px] leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-black text-white rounded-tr-sm' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-black dark:text-white" />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area - Floating at bottom */}
            {activeChatId && (
                <div className="sticky bottom-0 bg-white dark:bg-slate-950 px-4 py-6">
                    <div className="flex gap-2 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-2 py-2 shadow-xl hover:shadow-2xl transition-shadow w-full max-w-3xl mx-auto">
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Message Chatify..."
                            className="flex-1 bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 px-4 text-base h-10"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={loading || !query.trim()}
                            className="p-3 bg-black hover:bg-slate-800 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex justify-center mt-3 gap-4 text-[11px] text-slate-400 font-medium">
                        <span>Chatify can make mistakes. Check important info.</span>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ChatInterface;
