import React from 'react';

export const UserCard = ({ user, onClick }) => (
  <button 
    onClick={() => onClick(user)}
    className="group flex flex-col items-center p-6 border-2 border-transparent hover:border-accent rounded-[2.5rem] bg-gray-50 transition-all hover:bg-white hover:shadow-xl"
  >
    <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-100">
      {user.username[0].toUpperCase()}
    </div>
    <span className="font-bold text-gray-800">{user.username}</span>
  </button>
);
