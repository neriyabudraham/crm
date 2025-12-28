import React from 'react';
import { UserCard } from './UserCard';

export const LoginView = ({ users, selectedUser, setSelectedUser, password, setPassword, handleLogin, error }) => {
  if (!selectedUser) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {users.map(u => (
          <button 
            key={u.id}
            onClick={() => setSelectedUser(u)}
            className="group flex flex-col items-center p-6 border-2 border-transparent hover:border-yellow-400 rounded-[2rem] bg-gray-50 transition-all hover:bg-white hover:shadow-xl"
          >
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-3 group-hover:scale-110 transition-transform">
              {u.username[0].toUpperCase()}
            </div>
            <span className="font-bold text-gray-800">{u.username}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
        <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-white text-xl font-black">
          {selectedUser.username[0].toUpperCase()}
        </div>
        <div className="flex-1 text-right">
          <p className="text-[10px] text-yellow-600 font-black uppercase">מתחברת כ:</p>
          <h2 className="font-bold text-gray-900">{selectedUser.username}</h2>
        </div>
        <button type="button" onClick={() => setSelectedUser(null)} className="text-xs text-gray-400 underline font-bold">החלף</button>
      </div>
      <input 
        type="password"
        placeholder="הזיני סיסמה"
        className="w-full p-5 border-2 border-gray-100 rounded-2xl focus:border-yellow-400 outline-none text-center text-3xl tracking-widest bg-gray-50 focus:bg-white"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
      <button className="w-full bg-gray-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all active:scale-95">
        כניסה למערכת
      </button>
    </form>
  );
};
