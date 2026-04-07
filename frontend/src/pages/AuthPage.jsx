import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const AuthPage = ({ mode, onSuccess, onModeChange, onBack }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Reset transient state when mode changes (also clears stale loading from bfcache)
  useEffect(() => {
    setLoading(false);
    setError('');
  }, [mode]);

  // Handle browser bfcache (back button after Google redirect): force loading off
  useEffect(() => {
    const onPageShow = (e) => { if (e.persisted) { setLoading(false); setError(''); } };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const setMode = (newMode) => onModeChange(newMode);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.post('/account/login', { email: form.email, password: form.password });
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        onSuccess(res.data);
      } else if (mode === 'signup') {
        const res = await api.post('/account/signup', { name: form.name, email: form.email, password: form.password });
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        // signup returns {account, accounts, currentAccountId} — wrap as user too
        onSuccess({ user: res.data.account, accounts: res.data.accounts, currentAccountId: res.data.currentAccountId });
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

  // Google OAuth — full-window redirect (no popup)
  const handleGoogleRedirect = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/account/google/url');
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.error || 'Google OAuth לא מוגדר');
      setLoading(false);
    }
  };

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
            <button
              type="button"
              onClick={handleGoogleRedirect}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 p-4 rounded-2xl font-bold text-gray-700 transition-all disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span>{mode === 'signup' ? 'הרשמה עם Google' : 'התחברות עם Google'}</span>
            </button>
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
