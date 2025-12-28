import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Input } from '../ui/Input';

export const EditClientModal = ({ isOpen, onClose, client, onRefresh }) => {
  const [formData, setFormData] = useState({ ...client });
  const statuses = ['חדש', 'פגישה נקבעה', 'סגור - חוזה נחתם', 'הסתיים', 'בוטל'];

  useEffect(() => {
    if (client) setFormData({ ...client });
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/clients/${client.id}`, formData);
      onRefresh();
      onClose();
    } catch (err) { alert('שגיאה בעדכון הנתונים'); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10" dir="rtl">
        <h2 className="text-3xl font-black mb-8 text-right">עריכת פרטי כלה</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-right">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="שם מלא" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            <Input label="טלפון" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input label="אימייל" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-700 mr-1">סטטוס לקוחה</label>
              <select 
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-accent rounded-2xl font-bold outline-none"
                value={formData.status_name}
                onChange={e => setFormData({...formData, status_name: e.target.value})}
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <button className="flex-1 bg-gray-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all">שמירת שינויים</button>
            <button type="button" onClick={onClose} className="px-8 py-5 border-2 border-gray-100 rounded-2xl font-bold text-gray-400">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};
