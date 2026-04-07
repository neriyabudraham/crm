import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDialog } from '../components/ui/Dialog';

const adminApi = axios.create({ baseURL: 'https://crm.botomat.co.il/api/superadmin' });
adminApi.interceptors.request.use(c => {
  const t = localStorage.getItem('adminAccessToken');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

export const SuperAdminPage = () => {
  const { toast, confirm } = useDialog();
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('adminUser')); } catch { return null; }
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // אימות token קיים
  useEffect(() => {
    const t = localStorage.getItem('adminAccessToken');
    if (t && !admin) {
      adminApi.get('/me').then(r => setAdmin(r.data)).catch(() => {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminUser');
      });
    }
  }, []);

  // טעינת נתונים אחרי התחברות
  useEffect(() => {
    if (admin) {
      adminApi.get('/stats').then(r => setStats(r.data)).catch(console.error);
      adminApi.get('/accounts').then(r => setAccounts(r.data)).catch(console.error);
    }
  }, [admin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await adminApi.post('/login', loginForm);
      localStorage.setItem('adminAccessToken', r.data.accessToken);
      localStorage.setItem('adminUser', JSON.stringify(r.data.admin));
      setAdmin(r.data.admin);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  };

  const toggleAccount = async (id, is_active) => {
    if (!await confirm(is_active ? 'להפעיל מחדש את החשבון?' : 'לחסום את החשבון?', { confirmText: is_active ? 'הפעל' : 'חסום', destructive: !is_active })) return;
    try {
      await adminApi.patch(`/accounts/${id}`, { is_active });
      setAccounts(accounts.map(a => a.id === id ? { ...a, is_active } : a));
      toast.success(is_active ? 'החשבון הופעל' : 'החשבון נחסם');
    } catch (err) { toast.error(err.response?.data?.error || 'שגיאה'); }
  };

  const deleteAccount = async (id, name) => {
    if (!await confirm(`למחוק את החשבון "${name}" לצמיתות? פעולה זו תמחק את כל הנתונים.`, { destructive: true, confirmText: 'מחק' })) return;
    if (!await confirm('בטוח לחלוטין? אין דרך חזרה.', { destructive: true, confirmText: 'מחק לצמיתות' })) return;
    try {
      await adminApi.delete(`/accounts/${id}`);
      setAccounts(accounts.filter(a => a.id !== id));
      toast.success('החשבון נמחק');
    } catch (err) { toast.error(err.response?.data?.error || 'שגיאה'); }
  };

  const loginAsAccount = async (id, name) => {
    if (!await confirm(`להתחבר כ-"${name}"? תועבר לממשק שלו.`, { confirmText: 'התחבר', icon: '👁' })) return;
    try {
      const r = await adminApi.post(`/accounts/${id}/login-as`);
      localStorage.setItem('accessToken', r.data.accessToken);
      localStorage.setItem('account', JSON.stringify(r.data.account));
      localStorage.setItem('impersonatedBy', admin.email);
      window.location.href = '/';
    } catch (err) { toast.error(err.response?.data?.error || 'שגיאה'); }
  };

  // ---------- LOGIN SCREEN ----------
  if (!admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-1">Botomat<span className="text-accent">.</span>CRM</h1>
            <p className="text-gray-400 font-bold text-sm">ניהול מערכת — Super Admin</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="אימייל אדמין" className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-accent outline-none font-bold" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
            <input type="password" placeholder="סיסמה" className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-accent outline-none font-bold" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
            {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
            <button disabled={loading} className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black text-lg disabled:opacity-50">{loading ? '...' : 'כניסה'}</button>
          </form>
          <a href="/" className="block text-center text-gray-400 text-xs font-bold mt-6 hover:text-gray-700">חזרה לאתר</a>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD ----------
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black text-gray-900">Super Admin</h1>
            <nav className="flex gap-2">
              <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl font-bold text-sm ${activeTab === 'overview' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>סקירה</button>
              <button onClick={() => setActiveTab('accounts')} className={`px-4 py-2 rounded-xl font-bold text-sm ${activeTab === 'accounts' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>חשבונות ({accounts.length})</button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400">{admin.email}</span>
            <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:text-red-700">התנתק</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* ----- OVERVIEW ----- */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="חשבונות" value={stats.accounts_total} sub={`${stats.accounts_active} פעילים`} />
            <StatCard label="חשבונות חדשים (30 יום)" value={stats.new_accounts_30d} />
            <StatCard label="לקוחות במערכת" value={stats.clients_total} />
            <StatCard label="תשלומים" value={stats.payments_total} />
            <StatCard label="חתימות" value={stats.signed_docs_total} />
            <StatCard label="שאלונים שמולאו" value={stats.questionnaires_submitted} />
            <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-gray-400 uppercase mb-3">תוכניות</h3>
              <div className="space-y-2">
                {stats.plans.map(p => (
                  <div key={p.plan} className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">{p.plan}</span>
                    <span className="text-2xl font-black text-gray-900">{p.c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----- ACCOUNTS ----- */}
        {activeTab === 'accounts' && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-black text-gray-400 uppercase">
                <tr>
                  <th className="p-4 text-right">חשבון</th>
                  <th className="p-4">תוכנית</th>
                  <th className="p-4">לקוחות</th>
                  <th className="p-4">תשלומים</th>
                  <th className="p-4">סטטוס</th>
                  <th className="p-4">נוצר</th>
                  <th className="p-4">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 text-right">
                      <div className="font-bold text-gray-900">{a.name}</div>
                      <div className="text-xs text-gray-400">{a.email}</div>
                    </td>
                    <td className="p-4 text-center"><span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-bold">{a.plan}</span></td>
                    <td className="p-4 text-center font-bold">{a.clients_count}</td>
                    <td className="p-4 text-center font-bold">{a.payments_count}</td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {a.is_active ? 'פעיל' : 'חסום'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('he-IL')}</td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => loginAsAccount(a.id, a.name)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200">התחבר כ-</button>
                        <button onClick={() => toggleAccount(a.id, !a.is_active)} className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200">{a.is_active ? 'חסום' : 'הפעל'}</button>
                        <button onClick={() => deleteAccount(a.id, a.name)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200">מחק</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm">
    <div className="text-xs font-black text-gray-400 uppercase mb-2">{label}</div>
    <div className="text-3xl font-black text-gray-900">{value}</div>
    {sub && <div className="text-xs text-gray-400 font-bold mt-1">{sub}</div>}
  </div>
);
