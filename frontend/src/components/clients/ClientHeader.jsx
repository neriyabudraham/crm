import React from 'react';

export const ClientHeader = ({ client }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-6 flex justify-between items-center">
    <div className="flex items-center gap-6">
      <div className="w-20 h-20 bg-accent rounded-[1.8rem] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-yellow-100">
        {client.full_name?.[0]}
      </div>
      <div>
        <h1 className="text-3xl font-black text-gray-900">{client.full_name}</h1>
        <div className="flex gap-3 mt-2">
          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{client.phone}</span>
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black uppercase">{client.status_name || 'חדש'}</span>
        </div>
      </div>
    </div>
    <div className="flex gap-3">
      <button className="bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-green-100 flex items-center gap-2">
        <span>💬</span> וואטסאפ
      </button>
      <button className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-gray-200">
        עריכת פרטים
      </button>
    </div>
  </div>
);
