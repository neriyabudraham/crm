import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const AddClientModal = ({ isOpen, onClose, onRefresh, entityType = 'bride' }) => {
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', source: '', status_name: '' });
  const [customFields, setCustomFields] = useState([]);
  const [customValues, setCustomValues] = useState({});
  const [sources, setSources] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [duplicateError, setDuplicateError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const statusKey = entityType === 'bride' ? 'client_statuses' : `${entityType}_statuses`;
      const sourceKey = entityType === 'bride' ? 'client_sources' : `${entityType}_sources`;

      // שדות ספציפיים + גלובליים
      Promise.all([
        api.get(`/admin/fields?type=${entityType}`),
        api.get('/admin/fields?type=global')
      ]).then(([r1, r2]) => {
        setCustomFields([...(r1.data || []), ...(r2.data || [])].sort((a, b) => a.field_order - b.field_order));
      });

      api.get(`/admin/settings/${sourceKey}`).then(res => {
        const data = res.data || [];
        setSources(data);
        if (data[0]) setFormData(prev => ({ ...prev, source: data[0] }));
      });
      api.get(`/admin/settings/${statusKey}`).then(res => {
        const data = res.data || [];
        setStatuses(data);
        const defaultName = data[0]?.name || data[0] || '';
        setFormData(prev => ({ ...prev, status_name: defaultName }));
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e, options = {}) => {
    if (e) e.preventDefault();
    // בדיקת שדות חובה
    const requiredFields = customFields.filter(f => f.is_required);
    for (const f of requiredFields) {
      if (!customValues[f.id] || !customValues[f.id].toString().trim()) {
        alert(`השדה "${f.field_name}" הוא שדה חובה`);
        return;
      }
    }
    try {
      await api.post('/clients', { ...formData, custom_fields_data: customValues, entity_type: entityType, ...options });
      onRefresh(); onClose(); setDuplicateError(null);
      setFormData({ full_name: '', phone: '', email: '', source: '', status_name: '' });
      setCustomValues({});
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
        <h2 className="text-4xl font-black mb-10 text-gray-900">הוספת ליד חדש</h2>

        {duplicateError ? (
          <div className="bg-red-50 p-8 rounded-[2rem] border-2 border-red-100 text-center animate-in zoom-in">
            <h3 className="text-xl font-black text-red-900 mb-4">מספר הטלפון כבר קיים במערכת!</h3>
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
                <label className="text-xs font-black mr-2">שם מלא *</label>
                <input required className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black mr-2">טלפון *</label>
                <input required className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black mr-2">אימייל</label>
                <input type="email" className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black mr-2">סטטוס</label>
                <select className="p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.status_name} onChange={e => setFormData({ ...formData, status_name: e.target.value })}>
                  {statuses.map((s, i) => {
                    const name = s.name || s;
                    return <option key={i} value={name}>{name}</option>;
                  })}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black mr-2">מקור הגעה</label>
                <select className="p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}>
                  {sources.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
              {customFields.map(f => (
                <div key={f.id} className="flex flex-col gap-1">
                  <label className="text-xs font-black mr-2">{f.field_name} {f.is_required && <span className="text-red-500">*</span>}</label>
                  <input
                    type={f.field_type === 'date' ? 'date' : f.field_type === 'number' ? 'number' : 'text'}
                    className="p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-accent"
                    value={customValues[f.id] || ''}
                    onChange={e => setCustomValues({ ...customValues, [f.id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <button className="w-full bg-gray-900 text-white p-6 rounded-[2rem] font-black text-xl shadow-xl hover:scale-[1.02] transition-all">שמירה</button>
          </form>
        )}
      </div>
    </div>
  );
};
