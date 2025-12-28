import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const SettingsPage = () => {
  const [fields, setFields] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [newField, setNewField] = useState({ field_name: '', field_type: 'text', is_required: false });

  const loadAll = async () => {
    const [f, st, so] = await Promise.all([
      api.get('/admin/fields'),
      api.get('/admin/settings/client_statuses'),
      api.get('/admin/settings/client_sources')
    ]);
    setFields(f.data);
    setStatuses(st.data);
    setSources(so.data);
  };

  useEffect(() => { loadAll(); }, []);

  const addField = async (e) => {
    e.preventDefault();
    await api.post('/admin/fields', { ...newField, entity_type: 'bride' });
    setNewField({ field_name: '', field_type: 'text', is_required: false });
    loadAll();
  };

  return (
    <div className="max-w-6xl mx-auto p-8 text-right" dir="rtl">
      <h2 className="text-4xl font-black mb-10 text-gray-900 tracking-tight">הגדרות ליבה</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ניהול שדות */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black mb-6">שדות בטפסים ושאלונים</h3>
          <form onSubmit={addField} className="space-y-4 mb-8 bg-gray-50 p-6 rounded-3xl">
            <input placeholder="שם השדה" className="w-full p-4 rounded-xl outline-none" value={newField.field_name} onChange={e => setNewField({...newField, field_name: e.target.value})} required />
            <select className="w-full p-4 rounded-xl outline-none" value={newField.field_type} onChange={e => setNewField({...newField, field_type: e.target.value})}>
              <option value="text">טקסט</option>
              <option value="number">מספר</option>
              <option value="date">תאריך</option>
              <option value="file">קובץ מצורף</option>
              <option value="checkbox">תיבת סימון</option>
            </select>
            <label className="flex items-center gap-2 font-bold text-sm px-2">
              <input type="checkbox" checked={newField.is_required} onChange={e => setNewField({...newField, is_required: e.target.checked})} /> שדה חובה
            </label>
            <button className="w-full bg-gray-900 text-white p-4 rounded-xl font-black">הוספת שדה</button>
          </form>
          <div className="space-y-2">
            {fields.map(f => (
              <div key={f.id} className="flex justify-between p-4 bg-gray-50 rounded-2xl items-center">
                <span className="font-bold">{f.field_name} <span className="text-[10px] text-gray-400">({f.field_type})</span></span>
                <button onClick={() => api.delete(`/admin/fields/${f.id}`).then(loadAll)} className="text-red-400 font-bold text-xs">מחק</button>
              </div>
            ))}
          </div>
        </section>

        {/* ניהול רשימות */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black mb-4">ניהול סטטוסים</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {statuses.map(s => <span key={s} className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-bold text-xs">{s}</span>)}
            </div>
            <input placeholder="הוספת סטטוס..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-accent border-2 border-transparent" onKeyDown={e => e.key === 'Enter' && api.post('/admin/settings/client_statuses', { values: [...statuses, e.target.value] }).then(() => {e.target.value=''; loadAll();})} />
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black mb-4">מקורות הגעה</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {sources.map(s => <span key={s} className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold text-xs">{s}</span>)}
            </div>
            <input placeholder="הוספת מקור..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none" onKeyDown={e => e.key === 'Enter' && api.post('/admin/settings/client_sources', { values: [...sources, e.target.value] }).then(() => {e.target.value=''; loadAll();})} />
          </section>
        </div>
      </div>
    </div>
  );
};
