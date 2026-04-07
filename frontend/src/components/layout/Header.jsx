import React, { useState, useRef, useEffect } from 'react';

export const Header = ({ user, accounts = [], currentAccount, onSwitchAccount, onLogout }) => {
  const [openSwitcher, setOpenSwitcher] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const switcherRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) setOpenSwitcher(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpenProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || user?.email || '?')[0].toUpperCase();
  const isImpersonating = !!localStorage.getItem('impersonatedBy');

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md bg-white/80">
      {/* ----- account switcher ----- */}
      <div className="relative" ref={switcherRef}>
        <button
          onClick={() => setOpenSwitcher(!openSwitcher)}
          className="flex items-center gap-3 hover:bg-gray-50 rounded-2xl px-3 py-2 transition-all"
        >
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
            {currentAccount?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">חשבון פעיל</p>
            <h2 className="font-bold text-gray-900 leading-tight flex items-center gap-1">
              {currentAccount?.name}
              {accounts.length > 1 && <span className="text-xs text-gray-400">▾</span>}
            </h2>
          </div>
        </button>

        {openSwitcher && accounts.length > 0 && (
          <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 min-w-[280px] overflow-hidden z-50">
            <div className="p-3 border-b text-[10px] text-gray-400 font-black uppercase">החלף חשבון</div>
            {accounts.map(a => (
              <button
                key={a.id}
                onClick={() => { onSwitchAccount(a.id); setOpenSwitcher(false); }}
                className={`w-full flex items-center gap-3 p-3 text-right hover:bg-gray-50 transition-all ${a.id === currentAccount?.id ? 'bg-gray-50' : ''}`}
              >
                <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center text-white font-black text-sm">
                  {a.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 text-right">
                  <div className="font-bold text-gray-900 text-sm">{a.name}</div>
                  <div className="text-[10px] text-gray-400">{a.email} · {a.role}</div>
                </div>
                {a.id === currentAccount?.id && <span className="text-green-500 text-lg">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ----- impersonation banner ----- */}
      {isImpersonating && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold px-4 py-2 rounded-xl">
          👁 צופה כמנהל מערכת
          <button
            onClick={() => { localStorage.removeItem('impersonatedBy'); onLogout(); }}
            className="mr-2 underline hover:no-underline"
          >יציאה ממצב צפייה</button>
        </div>
      )}

      {/* ----- user profile ----- */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setOpenProfile(!openProfile)}
          className="flex items-center gap-3 hover:bg-gray-50 rounded-2xl px-3 py-2 transition-all"
        >
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">מחובר</p>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{user?.name || user?.email}</h3>
          </div>
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-yellow-100">
            {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" /> : initials}
          </div>
        </button>

        {openProfile && (
          <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 min-w-[220px] overflow-hidden z-50">
            <div className="p-4 border-b">
              <div className="font-bold text-gray-900 text-sm">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
            <button onClick={onLogout} className="w-full p-3 text-right text-red-500 font-bold text-sm hover:bg-red-50 transition-all">התנתקות</button>
          </div>
        )}
      </div>
    </header>
  );
};
