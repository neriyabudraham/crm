import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const AddClientModal = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', source: '', status_name: '' });
  const [customFields, setCustomFields] = useState([]);
  const [customValues, setCustomValues] = useState({});
  const [sources, setSources] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [duplicateError, setDuplicateError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/admin/fields').then(res => setCustomFields(res.data.sort((a,b) => a.sort_order - b.sort_order)));
      api.get('/admin/settings/client_sources').then(res => {
        setSources(res.data || []);
        if (res.data?.[0]) setFormData(prev => ({...prev, source: res.data[0]}));
      });
      api.get('/admin/settings/client_statuses').then(res => {
        setStatuses(res.data || []);
        if (res.data?.[0]) setFormData(prev => ({...prev, status_name: res.data[0]}));
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e, options = {}) => {
    if (e) e.preventDefault();
    try {
      await api.post('/clients', { ...formData, custom_fields_data: customValues, ...options });
      onRefresh(); onClose(); setDuplicateError(null);
    } catch (err) {
      if (err.response?.status === 409) setDuplicateError(err.response.data.message);
      else alert('שגיאה בשמירה');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl p-12 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute left-10 top-10 text-gray-300 hover:text-gray-900 text-2xl font-bold">✕</button>
        <h2 className="text-4xl font-black mb-10 text-gray-900">הוספת כלה חדשה</h2>
        
        {duplicateError ? (
          <div className="bg-red-50 p-8 rounded-[2rem] border-2 border-red-100 text-center animate-in zoom-in">
             <h3 className="text-xl font-black text-red-900 mb-4 italic underline">מספר הטלפון כבר קיים במערכת!</h3>
             <div className="grid grid-cols-1 gap-3">
               <button onClick={() => handleSubmit(null, { merge: true })} className="bg-white border-2 border-red-200 text-red-900 p-4 rounded-2xl font-black hover:bg-red-100">מיזוג פרטים חדשים לקיים</button>
               <button onClick={() => handleSubmit(null, { forceUpdate: true })} className="bg-red-500 text-white p-4 rounded-2xl font-black">עדכון ודריסת הכל</button>
               <button onClick={() => setDuplicateError(null)} className="text-gray-400 font-bold mt-2">ביטול וחזרה</button>
             </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black mr-2">שם מלא</label>
                <input required className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black mr-2">טלפון</label>
                <input required className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black mr-2">סטטוס התחלתי</label>
                <select className="p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.status_name} onChange={e => setFormData({...formData, status_name: e.target.value})}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black mr-2">מקור הגעה</label>
                <select className="p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                  {sources.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {customFields.map(f => (
                <div key={f.id} className="flex flex-col gap-1">
                  <label className="text-xs font-black mr-2">{f.field_name}</label>
                  <input type={f.field_type === 'date' ? 'date' : 'text'} className="p-4 bg-yellow-50/20 rounded-2xl outline-none" onChange={e => setCustomValues({...customValues, [f.id]: e.target.value})} />
                </div>
              ))}
            </div>
            <button className="w-full bg-gray-900 text-white p-6 rounded-[2rem] font-black text-xl shadow-xl hover:scale-[1.02] transition-all">שמירת כלה</button>
          </form>
        )}
      </div>
    </div>
  );
};
