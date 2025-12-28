import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const EditClientModal = ({ isOpen, onClose, client, onRefresh }) => {
  const [formData, setFormData] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [sources, setSources] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (client && isOpen) {
      setFormData({ ...client, custom_fields: client.custom_fields || {} });
      api.get('/admin/fields').then(res => setCustomFields(res.data.sort((a,b) => a.sort_order - b.sort_order)));
      api.get('/admin/settings/client_sources').then(res => setSources(res.data || []));
      api.get('/admin/settings/client_statuses').then(res => setStatuses(res.data || []));
    }
  }, [client, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/clients/${client.id}`, formData);
      onRefresh(); onClose();
    } catch (err) { alert('שגיאה בעדכון'); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl p-12 relative max-h-[90vh] overflow-y-auto text-right">
        <h2 className="text-3xl font-black mb-10">עריכת פרטי כלה</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black mr-2">שם מלא</label>
            <input className="p-4 bg-gray-50 rounded-2xl" value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black mr-2">סטטוס</label>
            <select className="p-4 bg-gray-50 rounded-2xl font-bold" value={formData.status_name || ''} onChange={e => setFormData({...formData, status_name: e.target.value})}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* שדות דינמיים בעריכה */}
          {customFields.map(f => (
            <div key={f.id} className="flex flex-col gap-1">
              <label className="text-xs font-black mr-2">{f.field_name}</label>
              <input 
                type={f.field_type === 'date' ? 'date' : 'text'}
                className="p-4 bg-yellow-50/20 border border-yellow-100 rounded-2xl"
                value={formData.custom_fields?.[f.id] || ''}
                onChange={e => setFormData({
                  ...formData, 
                  custom_fields: { ...formData.custom_fields, [f.id]: e.target.value }
                })}
              />
            </div>
          ))}

          <button className="col-span-2 bg-gray-900 text-white p-5 rounded-2xl font-black shadow-lg mt-4">עדכון פרטים</button>
        </form>
      </div>
    </div>
  );
};
