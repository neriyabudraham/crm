import React, { useState, useEffect } from 'react';
import api from './services/api';
import { Logo } from './components/ui/Logo';
import { UserCard } from './components/auth/UserCard';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { EntityPage } from './pages/EntityPage';
import { ClientDetailsPage } from './pages/ClientDetailsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SigningPage } from './pages/SigningPage';
import { QuestionnairePublicPage } from './pages/QuestionnairePublicPage';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import './index.css';

function App() {
  // דפים ציבוריים
  const signMatch = window.location.pathname.match(/^\/sign\/(.+)$/);
  if (signMatch) return <SigningPage token={signMatch[1]} />;

  const questionnaireMatch = window.location.pathname.match(/^\/questionnaire\/(.+)$/);
  if (questionnaireMatch) return <QuestionnairePublicPage token={questionnaireMatch[1]} />;

  // מצב חשבון
  const [account, setAccount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('account')); } catch { return null; }
  });
  const [authMode, setAuthMode] = useState(null); // null=landing, 'login', 'signup'

  // מצב פנימי (בחירת משתמש בתוך חשבון)
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('brides');
  const [view, setView] = useState('list');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  // בדיקת token קיים
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !account) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/account/me').then(res => {
        setAccount(res.data.account);
        localStorage.setItem('account', JSON.stringify(res.data.account));
      }).catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('account');
      });
    }
  }, []);

  // טעינת משתמשים בתוך חשבון
  useEffect(() => {
    if (account) {
      const token = localStorage.getItem('accessToken');
      if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // legacy: טוען users של החשבון
      api.get('/auth/users').then(res => setUsers(res.data || [])).catch(() => {}).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [account]);

  const handleAccountLogin = (acc) => {
    setAccount(acc);
    setAuthMode(null);
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { userId: selectedUser.id, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) { alert('סיסמה שגויה'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('account');
    setUser(null);
    setAccount(null);
    setSelectedUser(null);
    setView('list');
  };

  const openClientCard = (id) => {
    setTransitioning(true);
    setTimeout(() => { setSelectedClientId(id); setView('details'); setTransitioning(false); }, 150);
  };
  const goBackToList = () => {
    setTransitioning(true);
    setTimeout(() => { setView('list'); setTransitioning(false); }, 150);
  };

  // --- אין חשבון: Landing / Auth ---
  if (!account) {
    if (authMode) return <AuthPage mode={authMode} onSuccess={handleAccountLogin} onBack={() => setAuthMode(null)} />;
    return <LandingPage onLogin={() => setAuthMode('login')} onSignup={() => setAuthMode('signup')} />;
  }

  // --- יש חשבון, אין user: בחירת משתמש ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black text-gray-900 mb-1">Botomat<span className="text-accent">.</span>CRM</h1>
            <p className="text-gray-400 font-bold text-sm">{account.name}</p>
          </div>
          {!selectedUser ? (
            isLoading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {users.map(u => <UserCard key={u.id} user={u} onClick={setSelectedUser} />)}
                </div>
                <button onClick={handleLogout} className="w-full text-gray-400 text-sm font-bold mt-6 hover:text-red-500">התנתק מהחשבון</button>
              </>
            )
          ) : (
            <form onSubmit={handleUserLogin} className="space-y-6">
              <input type="password" placeholder="סיסמה" className="w-full p-5 border-2 border-gray-100 rounded-2xl focus:border-accent outline-none text-center text-3xl bg-gray-50" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
              <button className="w-full bg-gray-900 text-white p-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-black transition-all">כניסה</button>
              <button type="button" onClick={() => setSelectedUser(null)} className="w-full text-gray-400 text-sm font-bold">ביטול</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- Dashboard ---
  return (
    <div className="min-h-screen bg-[#fafafa] flex" dir="rtl">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setView('list'); }} />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={handleLogout} />
        <main className={`p-10 max-w-7xl mx-auto w-full transition-opacity duration-150 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          {activeTab === 'brides' && (
            view === 'list'
              ? <EntityPage entityType="bride" title="ניהול כלות" onSelectClient={openClientCard} />
              : <ClientDetailsPage clientId={selectedClientId} onBack={goBackToList} />
          )}
          {activeTab === 'courses' && (
            view === 'list'
              ? <EntityPage entityType="course" title="קורסים ותלמידות" onSelectClient={openClientCard} />
              : <ClientDetailsPage clientId={selectedClientId} onBack={goBackToList} />
          )}
          {activeTab === 'payments' && <PaymentsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
