import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import illustration from '../assets/auth-illustration.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // FormData for OAuth2 standard flow
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await axios.post('http://127.0.0.1:8000/token', formData);
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-slate-100">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back!</h1>
          <p className="text-slate-500 mb-8">Simplify your workflow and boost your productivity with Chatify.AI. Get started for free.</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="text"
                className="w-full px-5 py-3.5 rounded-full border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400 bg-white"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div>
              <input
                type="password"
                className="w-full px-5 py-3.5 rounded-full border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400 bg-white"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-slate-900 text-white font-medium py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl mt-4"
            >
              Login
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500">
              Not a member?{' '}
              <Link to="/signup" className="text-green-500 font-medium hover:underline">
                  Register now
              </Link>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden md:flex w-full md:w-1/2 bg-slate-50 p-12 items-center justify-center relative overflow-hidden">
             <img 
                src={illustration} 
                alt="Illustration" 
                className="relative z-10 w-full max-w-sm object-contain transform hover:scale-105 transition-transform duration-500" 
             />
             
             {/* Decorative Elements matching the style */}
             <div className="absolute top-10 right-10 text-slate-900 text-4xl">✨</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
