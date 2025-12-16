import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import illustration from '../assets/auth-illustration.png';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      await axios.post('http://127.0.0.1:8000/signup', formData);
      setMessage('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
          setMessage(`Error: ${err.response.data.detail}`);
      } else if (err.message) {
          setMessage(`Error: ${err.message}`);
      } else {
          setMessage('Error creating account. Check console.');
      }
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

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create an account</h1>
          <p className="text-slate-500 mb-8">Join us today and start boosting your productivity with Chatify.AI. It's free to get started.</p>

          {message && <div className={`p-3 rounded-lg mb-4 text-sm text-center ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message}</div>}

          <form onSubmit={handleSignup} className="space-y-5">
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
              Sign Up
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-green-500 font-medium hover:underline">
                  Login here
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
             <div className="absolute top-10 right-10 text-slate-900 text-4xl">✨</div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
