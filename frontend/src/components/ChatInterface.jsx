import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { Send, Sparkles, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            const response = await axios.get(`http://127.0.0.1:8000/history/${chatId}`, {
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
            const result = await axios.post('http://127.0.0.1:8000/chat', 
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
            <div className="flex-1 overflow-y-auto space-y-6 pb-4 scroll-smooth pr-2">
                {messages.length === 0 && !loading && (
                     <div className="flex flex-col items-center justify-center h-full text-center opacity-50 animate-in fade-in duration-500">
                        <Sparkles className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">
                            {activeChatId ? "Start conversation..." : "Select or create a chat"}
                        </h3>
                     </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-indigo-600 dark:bg-indigo-500' 
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-indigo-500" />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-indigo-600 dark:bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4">
                         <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 px-5 py-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Floating at bottom */}
            {activeChatId && (
                <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950 pb-2">
                    <div className="flex gap-2 items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-lg ring-1 ring-slate-900/5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Message Chatify..."
                            className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-base"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={loading || !query.trim()}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex justify-center mt-2 gap-4 text-[10px] text-slate-400 dark:text-slate-600 font-medium">
                        <span className="flex items-center gap-1">AI can make mistakes. Please verify important information.</span>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ChatInterface;
