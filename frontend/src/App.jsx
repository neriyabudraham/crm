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

// ========== helpers ==========

const safeParse = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch { return fallback; }
};

// Parse window.location.pathname into a route descriptor
const parsePath = (pathname) => {
  if (pathname === '/login' || pathname === '/') return { type: 'auth', mode: 'login' };
  if (pathname === '/signup') return { type: 'auth', mode: 'signup' };
  if (pathname === '/forgot-password') return { type: 'auth', mode: 'forgot' };
  if (pathname === '/reset-password') return { type: 'auth', mode: 'reset' };
  if (pathname === '/landing') return { type: 'landing' };

  if (pathname === '/brides') return { type: 'app', tab: 'brides', view: 'list' };
  if (pathname === '/courses') return { type: 'app', tab: 'courses', view: 'list' };
  if (pathname === '/payments') return { type: 'app', tab: 'payments', view: 'list' };
  if (pathname === '/settings') return { type: 'app', tab: 'settings', view: 'list' };

  let m = pathname.match(/^\/brides\/(\d+)$/);
  if (m) return { type: 'app', tab: 'brides', view: 'details', clientId: parseInt(m[1], 10) };
  m = pathname.match(/^\/courses\/(\d+)$/);
  if (m) return { type: 'app', tab: 'courses', view: 'details', clientId: parseInt(m[1], 10) };

  // Public token-based pages and admin handled by special early returns
  return { type: 'app', tab: 'brides', view: 'list' };
};

function App() {
  // ========== auth + account state ==========
  const [user, setUser] = useState(() => safeParse('user', null));
  const [accounts, setAccounts] = useState(() => {
    const v = safeParse('accounts', []);
    return Array.isArray(v) ? v : [];
  });
  const [currentAccount, setCurrentAccount] = useState(() => safeParse('currentAccount', null));
  const [authChecked, setAuthChecked] = useState(false);

  // ========== route state ==========
  const [route, setRoute] = useState(() => parsePath(window.location.pathname));

  const navigate = (path, { replace = false } = {}) => {
    if (path !== window.location.pathname) {
      if (replace) window.history.replaceState({}, '', path);
      else window.history.pushState({}, '', path);
    }
    setRoute(parsePath(path));
  };

  // Browser back/forward
  useEffect(() => {
    const onPop = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ========== Google OAuth callback ==========
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const isGoogleCallback = window.location.pathname === '/auth/google/callback';
    if (!code || !isGoogleCallback) return;

    api.post('/account/google/callback', { code })
      .then(res => {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setUser(res.data.user);
        setAccounts(res.data.accounts);
        const current = res.data.accounts.find(a => a.id === res.data.currentAccountId) || res.data.accounts[0];
        setCurrentAccount(current);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('accounts', JSON.stringify(res.data.accounts));
        localStorage.setItem('currentAccount', JSON.stringify(current));
        navigate('/brides', { replace: true });
      })
      .catch(err => {
        alert('שגיאה באימות Google: ' + (err.response?.data?.error || err.message));
        navigate('/login', { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== hydrate /me on load ==========
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setAuthChecked(true); return; }
    api.get('/account/me').then(res => {
      setUser(res.data.user);
      setAccounts(res.data.accounts);
      setCurrentAccount(res.data.currentAccount);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('accounts', JSON.stringify(res.data.accounts));
      localStorage.setItem('currentAccount', JSON.stringify(res.data.currentAccount));
    }).catch(() => {
      ['accessToken','refreshToken','user','accounts','currentAccount','account','token'].forEach(k => localStorage.removeItem(k));
      setUser(null);
      setAccounts([]);
      setCurrentAccount(null);
    }).finally(() => setAuthChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== route guards ==========
  // Once auth is checked, redirect mismatched routes:
  // - Logged in user on /login|/signup|/forgot|/reset → /brides
  // - Logged out user trying /brides|/courses|... → /login
  useEffect(() => {
    if (!authChecked) return;
    const loggedIn = !!(user && currentAccount);
    if (loggedIn && route.type === 'auth') {
      navigate('/brides', { replace: true });
    } else if (!loggedIn && route.type === 'app') {
      navigate('/login', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, user, currentAccount, route.type]);

  // ========== handlers ==========
  const handleLoginSuccess = (data) => {
    setUser(data.user);
    setAccounts(data.accounts);
    const current = data.accounts.find(a => a.id === data.currentAccountId) || data.accounts[0];
    setCurrentAccount(current);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('accounts', JSON.stringify(data.accounts));
    localStorage.setItem('currentAccount', JSON.stringify(current));
    navigate('/brides');
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
      navigate('/brides');
    } catch (err) { alert(err.response?.data?.error || 'שגיאה בהחלפת חשבון'); }
  };

  const handleLogout = () => {
    ['accessToken','refreshToken','user','accounts','currentAccount','account','token','impersonatedBy'].forEach(k => localStorage.removeItem(k));
    setUser(null);
    setAccounts([]);
    setCurrentAccount(null);
    navigate('/login');
  };

  // ========== public pages — handled before route guards ==========
  const path = window.location.pathname;
  const signMatch = path.match(/^\/sign\/(.+)$/);
  if (signMatch) return <SigningPage token={signMatch[1]} />;
  const questionnaireMatch = path.match(/^\/questionnaire\/(.+)$/);
  if (questionnaireMatch) return <QuestionnairePublicPage token={questionnaireMatch[1]} />;
  if (path.startsWith('/admin')) return <SuperAdminPage />;

  // While the initial /me check is in flight, show nothing (avoids flicker)
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" dir="rtl">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  // ========== auth pages ==========
  if (route.type === 'landing') {
    return <LandingPage onLogin={() => navigate('/login')} onSignup={() => navigate('/signup')} />;
  }

  if (route.type === 'auth') {
    return (
      <AuthPage
        mode={route.mode}
        onSuccess={handleLoginSuccess}
        onModeChange={(newMode) => {
          const pathByMode = { login: '/login', signup: '/signup', forgot: '/forgot-password', reset: '/reset-password' };
          navigate(pathByMode[newMode] || '/login');
        }}
        onBack={() => navigate('/landing')}
      />
    );
  }

  // ========== Dashboard ==========
  const { tab, view, clientId } = route;
  return (
    <div className="min-h-screen bg-[#fafafa] flex" dir="rtl">
      <Sidebar
        activeTab={tab}
        setActiveTab={(newTab) => navigate('/' + newTab)}
      />
      <div className="flex-1 flex flex-col">
        <Header
          user={user}
          accounts={accounts}
          currentAccount={currentAccount}
          onSwitchAccount={switchAccount}
          onLogout={handleLogout}
        />
        <main className="p-10 max-w-7xl mx-auto w-full">
          {tab === 'brides' && (
            view === 'list'
              ? <EntityPage entityType="bride" title="ניהול כלות" onSelectClient={(id) => navigate(`/brides/${id}`)} />
              : <ClientDetailsPage clientId={clientId} onBack={() => navigate('/brides')} />
          )}
          {tab === 'courses' && (
            view === 'list'
              ? <EntityPage entityType="course" title="קורסים ותלמידות" onSelectClient={(id) => navigate(`/courses/${id}`)} />
              : <ClientDetailsPage clientId={clientId} onBack={() => navigate('/courses')} />
          )}
          {tab === 'payments' && <PaymentsPage />}
          {tab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
