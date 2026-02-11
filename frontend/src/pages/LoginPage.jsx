import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const LoginPage = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', credentials);
      localStorage.setItem('token', res.data.token);
      navigate('/brides');
    } catch (err) { 
      alert('פרטי התחברות שגויים'); 
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6" dir="rtl">
      <div className="bg-white p-14 rounded-[4rem] shadow-2xl w-full max-w-lg space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-900/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <h2 className="text-5xl font-black italic tracking-tighter mb-4 text-gray-900">כניסה <br/><span className="text-accent underline">למערכת</span></h2>
        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="email" placeholder="כתובת אימייל" required className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-gray-900 rounded-3xl outline-none font-bold transition-all"
            onChange={e => setCredentials({...credentials, email: e.target.value})}
          />
          <input 
            type="password" placeholder="סיסמה אישית" required className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-gray-900 rounded-3xl outline-none font-bold transition-all"
            onChange={e => setCredentials({...credentials, password: e.target.value})}
          />
          <button disabled={loading} className="w-full bg-gray-900 text-white p-6 rounded-3xl font-black text-2xl shadow-xl hover:scale-105 transition-all">
            {loading ? 'מתחבר...' : 'כניסה למערכת'}
          </button>
        </form>
      </div>
    </div>
  );
};
