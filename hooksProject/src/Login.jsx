import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUser ,handleUserLogin } from './db';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = await getUser(email);
    
    try {
        const user = await getUser(email);
        if (!user || user.password !== password) {
          alert('Invalid credentials');
          return;
        }
      
        localStorage.setItem('user_id', user.id);
        localStorage.setItem(`user_${user.id}`, JSON.stringify(user));
        await handleUserLogin(user.id);
      
        navigate('/dashboard');
      } catch (err) {
        console.error('Login error:', err);
        alert('Something went wrong.');
      }
      
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">Welcome Back</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition">
          Log In
        </button>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
