import React, { useState, useEffect } from 'react';
import api from './services/api';
import { Logo } from './components/ui/Logo';
import { UserCard } from './components/auth/UserCard';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BridesPage } from './pages/BridesPage';
import { ClientDetailsPage } from './pages/ClientDetailsPage';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('brides');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  
  // ניהול ניווט פנימי בתוך הטאב
  const [view, setView] = useState('list'); // 'list' or 'details'
  const [selectedClientId, setSelectedClientId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      api.get('/auth/users').then(res => setUsers(res.data)).catch(() => {});
    }
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { userId: selectedUser.id, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsLoggedIn(true);
    } catch (err) { alert('סיסמה שגויה'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setView('list');
  };

  const openClientCard = (id) => {
    setSelectedClientId(id);
    setView('details');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100">
          <Logo />
          {!selectedUser ? (
            <div className="grid grid-cols-2 gap-4">
              {users.map(u => <UserCard key={u.id} user={u} onClick={setSelectedUser} />)}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <input 
                type="password" placeholder="סיסמה" 
                className="w-full p-5 border-2 border-gray-100 rounded-2xl focus:border-accent outline-none text-center text-3xl bg-gray-50"
                value={password} onChange={(e) => setPassword(e.target.value)} autoFocus
              />
              <button className="w-full bg-gray-900 text-white p-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-black transition-all">כניסה</button>
              <button type="button" onClick={() => setSelectedUser(null)} className="w-full text-gray-400 text-sm font-bold">ביטול</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex" dir="rtl">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setView('list'); }} />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={handleLogout} />
        <main className="p-10 max-w-7xl mx-auto w-full">
          {activeTab === 'brides' && (
            view === 'list' 
              ? <BridesPage onSelectClient={openClientCard} /> 
              : <ClientDetailsPage clientId={selectedClientId} onBack={() => setView('list')} />
          )}
          {activeTab === 'courses' && <div className="text-center py-20 text-gray-300 font-bold text-2xl tracking-tight">עולם הקורסים בבנייה...</div>}
        </main>
      </div>
    </div>
  );
}

export default App;
