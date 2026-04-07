import React, { useState, useEffect, useRef } from 'react';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import api from '../../services/api';

export const ClientHeader = ({ client, onEdit, onDeleteSuccess, onRefresh }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [statusColors, setStatusColors] = useState({});
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const pickerRef = useRef(null);

  // סגירה בלחיצה בחוץ
  useEffect(() => {
    if (!showStatusPicker) return;
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowStatusPicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showStatusPicker]);

  useEffect(() => {
    api.get('/admin/settings/client_statuses').then(res => {
      const data = res.data || [];
      const map = {};
      data.forEach(s => { if (s.name) map[s.name] = s.color; });
      setStatuses(data);
      setStatusColors(map);
    });
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/clients/${client.id}`);
      setIsDeleteModalOpen(false);
      onDeleteSuccess();
    } catch (e) { alert('שגיאה במחיקה'); }
  };

  const changeStatus = async (newStatus) => {
    await api.patch(`/clients/${client.id}`, { status_name: newStatus });
    setShowStatusPicker(false);
    if (onRefresh) onRefresh();
  };

  const currentColor = statusColors[client.status_name] || '#9CA3AF';

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-accent rounded-[1.8rem] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-yellow-100">
            {client.full_name?.[0]}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">{client.full_name}</h1>
            <div className="flex gap-3 mt-2 items-center">
              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{client.phone}</span>
              {/* סטטוס עם אפשרות שינוי מהיר */}
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowStatusPicker(!showStatusPicker)}
                  className="px-4 py-1 rounded-full text-xs font-black text-white cursor-pointer hover:opacity-80 transition-all"
                  style={{ backgroundColor: currentColor }}
                >
                  {client.status_name} ▾
                </button>
                {showStatusPicker && (
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 min-w-[160px]">
                    {statuses.map((s, i) => {
                      const name = s.name || s;
                      const color = s.color || '#9CA3AF';
                      return (
                        <button
                          key={i}
                          onClick={() => changeStatus(name)}
                          className={`w-full flex items-center gap-2 p-2 rounded-xl text-right text-sm font-bold hover:bg-gray-50 transition-all ${client.status_name === name ? 'bg-gray-50' : ''}`}
                        >
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteModalOpen(true)} className="bg-red-50 text-red-400 px-5 py-3 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all">מחיקה</button>
          <button onClick={onEdit} className="bg-gray-100 text-gray-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">עריכה</button>
          <a href={`https://wa.me/972${client.phone?.replace(/^0/, '')}`} target="_blank" className="bg-green-500 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-lg shadow-green-100 flex items-center gap-2 transition-transform hover:scale-105">וואטסאפ</a>
        </div>
      </div>
      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} />
    </div>
  );
};
