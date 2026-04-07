import React, { useState } from 'react';
import api from '../services/api';

export const AuthPage = ({ mode: initialMode, onSuccess, onBack }) => {
  const [mode, setMode] = useState(initialMode || 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.post('/account/login', { email: form.email, password: form.password });
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('account', JSON.stringify(res.data.account));
        onSuccess(res.data.account);
      } else if (mode === 'signup') {
        const res = await api.post('/account/signup', { name: form.name, email: form.email, password: form.password });
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('account', JSON.stringify(res.data.account));
        onSuccess(res.data.account);
      } else if (mode === 'forgot') {
        await api.post('/account/forgot-password', { email: form.email });
        setResetSent(true);
      } else if (mode === 'reset') {
        await api.post('/account/reset-password', { email: form.email, code: form.code, newPassword: form.password });
        setResetDone(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה');
    } finally { setLoading(false); }
  };

  const handleGoogle = async (response) => {
    setLoading(true);
    try {
      const res = await api.post('/account/google', { credential: response.credential });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('account', JSON.stringify(res.data.account));
      onSuccess(res.data.account);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה באימות Google');
    } finally { setLoading(false); }
  };

  // Google Sign-In button
  React.useEffect(() => {
    if (window.google && document.getElementById('google-btn')) {
      window.google.accounts.id.initialize({
        client_id: window.__GOOGLE_CLIENT_ID || '',
        callback: handleGoogle
      });
      window.google.accounts.id.renderButton(document.getElementById('google-btn'), {
        theme: 'outline', size: 'large', width: '100%', text: mode === 'signup' ? 'signup_with' : 'signin_with', locale: 'he'
      });
    }
  }, [mode]);

  if (resetDone) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center">
        <div className="text-5xl mb-6">✅</div>
        <h1 className="text-2xl font-black mb-4">הסיסמה שונתה!</h1>
        <button onClick={() => { setMode('login'); setResetDone(false); }} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black">להתחברות</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10">
        <div className="text-center mb-8">
          <button onClick={onBack} className="text-gray-400 text-sm font-bold hover:text-gray-600 mb-4 block">← חזרה</button>
          <h1 className="text-3xl font-black text-gray-900 mb-1">
            Botomat<span className="text-accent">.</span>CRM
          </h1>
          <p className="text-gray-400 font-bold text-sm">
            {mode === 'login' ? 'התחברות לחשבון' : mode === 'signup' ? 'יצירת חשבון חדש' : mode === 'forgot' ? 'איפוס סיסמה' : 'הזנת קוד איפוס'}
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl font-bold text-sm mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input placeholder="שם העסק" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-accent" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          )}

          <input type="email" placeholder="אימייל" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-accent" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />

          {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
            <input type="password" placeholder={mode === 'reset' ? 'סיסמה חדשה' : 'סיסמה'} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-accent" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          )}

          {mode === 'reset' && (
            <input placeholder="קוד 6 ספרות" maxLength={6} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-accent text-center text-2xl tracking-widest" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
          )}

          {mode === 'forgot' && resetSent && (
            <div className="bg-green-50 text-green-700 p-3 rounded-xl font-bold text-sm text-center">
              קוד איפוס נשלח לאימייל שלך
              <button type="button" onClick={() => setMode('reset')} className="block mx-auto mt-2 text-accent font-black">הזן קוד →</button>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all disabled:opacity-50">
            {loading ? '...' : mode === 'login' ? 'התחבר' : mode === 'signup' ? 'צור חשבון' : mode === 'forgot' ? 'שלח קוד' : 'אפס סיסמה'}
          </button>
        </form>

        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="flex items-center gap-3 my-6"><div className="flex-1 border-t border-gray-100" /><span className="text-xs text-gray-400 font-bold">או</span><div className="flex-1 border-t border-gray-100" /></div>
            <div id="google-btn" className="flex justify-center" />
          </>
        )}

        <div className="text-center mt-6 space-y-2">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('forgot')} className="text-gray-400 text-sm font-bold hover:text-accent block mx-auto">שכחתי סיסמה</button>
              <p className="text-gray-400 text-sm">אין לך חשבון? <button onClick={() => setMode('signup')} className="text-accent font-black">הרשם עכשיו</button></p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-gray-400 text-sm">יש לך חשבון? <button onClick={() => setMode('login')} className="text-accent font-black">התחבר</button></p>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <button onClick={() => setMode('login')} className="text-gray-400 text-sm font-bold hover:text-accent">חזרה להתחברות</button>
          )}
        </div>
      </div>
    </div>
  );
};
