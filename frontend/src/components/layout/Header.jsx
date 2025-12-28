import React from 'react';

export const Header = ({ user, onLogout }) => (
  <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md bg-white/80">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-yellow-100">
        {user?.username?.[0].toUpperCase()}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">מחוברת כ:</p>
        <h2 className="font-bold text-gray-900 leading-tight">{user?.username}</h2>
      </div>
    </div>
    
    <div className="flex items-center gap-6">
      <button onClick={onLogout} className="text-gray-400 hover:text-red-500 text-sm font-bold transition-colors">
        התנתקות
      </button>
    </div>
  </header>
);
