import React from 'react';

export const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-2 w-full text-right">
    <label className="text-sm font-black text-gray-700 mr-1">{label}</label>
    <input 
      {...props}
      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white outline-none rounded-2xl transition-all font-medium"
    />
  </div>
);
