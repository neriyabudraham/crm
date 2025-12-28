import React from 'react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm font-bold">{title}</p>
      <h3 className="text-2xl font-black">{value}</h3>
    </div>
  </div>
);

export default StatCard;
