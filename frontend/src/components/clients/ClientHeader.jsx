import React, { useState } from 'react';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import api from '../../services/api';

export const ClientHeader = ({ client, onEdit, onDeleteSuccess }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await api.delete(`/clients/${client.id}`);
      setIsDeleteModalOpen(false);
      onDeleteSuccess();
    } catch (e) { alert('שגיאה במחיקה'); }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-6 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-accent rounded-[1.8rem] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-yellow-100">
          {client.full_name?.[0]}
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">{client.full_name}</h1>
          <div className="flex gap-3 mt-2">
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{client.phone}</span>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black uppercase">{client.status_name}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setIsDeleteModalOpen(true)} className="bg-red-50 text-red-400 px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all">מחיקת ליד 🗑️</button>
        <button onClick={onEdit} className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">עריכת פרטים ✏️</button>
        <a href={`https://wa.me/972${client.phone?.replace(/^0/, '')}`} target="_blank" className="bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-green-100 flex items-center gap-2 transition-transform hover:scale-105"><span>💬</span> וואטסאפ</a>
      </div>
      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} />
    </div>
  );
};
