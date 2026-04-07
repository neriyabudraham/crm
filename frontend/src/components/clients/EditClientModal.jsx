import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDialog } from '../ui/Dialog';

export const EditClientModal = ({ isOpen, onClose, client, onRefresh }) => {
  const { toast } = useDialog();
  const [formData, setFormData] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [sources, setSources] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (client && isOpen) {
      setFormData({ ...client, custom_fields_data: client.custom_fields_data || client.custom_fields || {} });
      api.get('/admin/fields').then(res => setCustomFields((res.data || []).sort((a, b) => a.field_order - b.field_order)));
      api.get('/admin/settings/client_sources').then(res => setSources(res.data || []));
      api.get('/admin/settings/client_statuses').then(res => setStatuses(res.data || []));
    }
  }, [client, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/clients/${client.id}`, formData);
      toast.success('הפרטים נשמרו');
      onRefresh(); onClose();
    } catch (err) { toast.error('שגיאה בעדכון'); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl p-12 relative max-h-[90vh] overflow-y-auto text-right">
        <button onClick={onClose} className="absolute left-10 top-10 text-gray-300 hover:text-gray-900 text-2xl font-bold">✕</button>
        <h2 className="text-3xl font-black mb-10">עריכת פרטים</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black mr-2">שם מלא</label>
            <input className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent" value={formData.full_name || ''} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black mr-2">טלפון</label>
            <input className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black mr-2">אימייל</label>
            <input type="email" className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black mr-2">סטטוס</label>
            <select className="p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.status_name || ''} onChange={e => setFormData({ ...formData, status_name: e.target.value })}>
              {statuses.map((s, i) => {
                const name = s.name || s;
                return <option key={i} value={name}>{name}</option>;
              })}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black mr-2">מקור הגעה</label>
            <select className="p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.source || ''} onChange={e => setFormData({ ...formData, source: e.target.value })}>
              {sources.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
          </div>

          {customFields.map(f => (
            <div key={f.id} className="flex flex-col gap-1">
              <label className="text-xs font-black mr-2">{f.field_name} {f.is_required && <span className="text-red-500">*</span>}</label>
              <input
                type={f.field_type === 'date' ? 'date' : f.field_type === 'number' ? 'number' : 'text'}
                className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent"
                value={formData.custom_fields_data?.[f.id] || ''}
                onChange={e => setFormData({
                  ...formData,
                  custom_fields_data: { ...formData.custom_fields_data, [f.id]: e.target.value }
                })}
              />
            </div>
          ))}

          <button className="col-span-2 bg-gray-900 text-white p-5 rounded-2xl font-black shadow-lg mt-4 hover:scale-[1.01] transition-all">עדכון פרטים</button>
        </form>
      </div>
    </div>
  );
};
