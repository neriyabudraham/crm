import React, { useState, useEffect } from 'react';
import api from './services/api';
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
import { SuperAdminPage } from './pages/SuperAdminPage';
import './index.css';

// Helpers לטעינה מ-localStorage עם ניקוי אוטומטי של ערכים שבורים מסשנים ישנים
const safeParse = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch { return fallback; }
};

function App() {
  // ⚠️ כל ה-hooks חייבים להיות לפני כל early return — Rules of Hooks
  // (אפילו אם הnavigation יפתור public pages, ה-hooks חייבים לרוץ קודם)
  const [user, setUser] = useState(() => safeParse('user', null));
  const [accounts, setAccounts] = useState(() => {
    const v = safeParse('accounts', []);
    return Array.isArray(v) ? v : [];
  });
  const [currentAccount, setCurrentAccount] = useState(() => safeParse('currentAccount', null));
  const [authMode, setAuthMode] = useState(null);
  const [activeTab, setActiveTab] = useState('brides');
  const [view, setView] = useState('list');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  // טיפול ב-Google OAuth callback (החזרה מ-Google עם ?code=...)
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const isGoogleCallback = window.location.pathname === '/auth/google/callback';
    if (!code || !isGoogleCallback) return;

    api.post('/account/google/callback', { code })
      .then(res => {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        // נקה את ה-URL מהcode כדי שלא יישלח שוב
        window.history.replaceState({}, '', '/');
        setUser(res.data.user);
        setAccounts(res.data.accounts);
        const current = res.data.accounts.find(a => a.id === res.data.currentAccountId) || res.data.accounts[0];
        setCurrentAccount(current);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('accounts', JSON.stringify(res.data.accounts));
        localStorage.setItem('currentAccount', JSON.stringify(current));
      })
      .catch(err => {
        alert('שגיאה באימות Google: ' + (err.response?.data?.error || err.message));
        window.history.replaceState({}, '', '/');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // בדיקת token קיים בעלייה — מסנכרן עם השרת אם יש token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    api.get('/account/me').then(res => {
      setUser(res.data.user);
      setAccounts(res.data.accounts);
      setCurrentAccount(res.data.currentAccount);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('accounts', JSON.stringify(res.data.accounts));
      localStorage.setItem('currentAccount', JSON.stringify(res.data.currentAccount));
    }).catch(() => {
      // token פג תוקף או לא תקין (למשל מsession ישן) — נקה הכל
      ['accessToken','refreshToken','user','accounts','currentAccount','account','token'].forEach(k => localStorage.removeItem(k));
      setUser(null);
      setAccounts([]);
      setCurrentAccount(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = (data) => {
    setUser(data.user);
    setAccounts(data.accounts);
    const current = data.accounts.find(a => a.id === data.currentAccountId) || data.accounts[0];
    setCurrentAccount(current);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('accounts', JSON.stringify(data.accounts));
    localStorage.setItem('currentAccount', JSON.stringify(current));
    setAuthMode(null);
  };

  const switchAccount = async (accountId) => {
    if (accountId === currentAccount?.id) return;
    try {
      const res = await api.post('/account/switch', { accountId });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      const newCurrent = { ...res.data.account, role: res.data.role };
      setCurrentAccount(newCurrent);
      localStorage.setItem('currentAccount', JSON.stringify(newCurrent));
      setView('list');
      setActiveTab('brides');
    } catch (err) { alert(err.response?.data?.error || 'שגיאה בהחלפת חשבון'); }
  };

  const handleLogout = () => {
    ['accessToken','refreshToken','user','accounts','currentAccount','account','token','impersonatedBy'].forEach(k => localStorage.removeItem(k));
    setUser(null);
    setAccounts([]);
    setCurrentAccount(null);
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

  // --- דפים ציבוריים (אחרי ה-hooks כדי לא להפר Rules of Hooks) ---
  const path = window.location.pathname;
  const signMatch = path.match(/^\/sign\/(.+)$/);
  if (signMatch) return <SigningPage token={signMatch[1]} />;
  const questionnaireMatch = path.match(/^\/questionnaire\/(.+)$/);
  if (questionnaireMatch) return <QuestionnairePublicPage token={questionnaireMatch[1]} />;
  if (path.startsWith('/admin')) return <SuperAdminPage />;

  // --- אין משתמש מחובר: Landing / Auth ---
  if (!user || !currentAccount) {
    if (authMode) return <AuthPage mode={authMode} onSuccess={handleLoginSuccess} onBack={() => setAuthMode(null)} />;
    return <LandingPage onLogin={() => setAuthMode('login')} onSignup={() => setAuthMode('signup')} />;
  }

  // --- Dashboard ---
  return (
    <div className="min-h-screen bg-[#fafafa] flex" dir="rtl">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setView('list'); }} />
      <div className="flex-1 flex flex-col">
        <Header
          user={user}
          accounts={accounts}
          currentAccount={currentAccount}
          onSwitchAccount={switchAccount}
          onLogout={handleLogout}
        />
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
