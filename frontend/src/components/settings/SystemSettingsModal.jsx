import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const SystemSettingsModal = ({ isOpen, onClose, allColumns, visibleColumns, setVisibleColumns }) => {
  const [activeTab, setActiveTab] = useState('columns');
  const [fields, setFields] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [newField, setNewField] = useState({ field_name: '', field_type: 'text', is_required: false });

  const loadData = async () => {
    try {
      const [f, st, so] = await Promise.all([
        api.get('/admin/fields'),
        api.get('/admin/settings/client_statuses'),
        api.get('/admin/settings/client_sources')
      ]);
      setFields((f.data || []).sort((a, b) => a.sort_order - b.sort_order));
      setStatuses(st.data || []);
      setSources(so.data || []);
    } catch (e) { console.error("Error loading settings", e); }
  };

  useEffect(() => { if (isOpen) loadData(); }, [isOpen]);

  const updateList = async (key, values) => {
    await api.post(`/admin/settings/${key}`, { values });
    loadData();
  };

  const handleAddField = async () => {
    if (!newField.field_name) return alert("נא להזין שם שדה");
    if (newField.field_type === 'payment_total' && fields.some(f => f.field_type === 'payment_total')) {
      return alert("ניתן להגדיר רק שדה 'סך תשלום' אחד במערכת");
    }
    try {
      await api.post('/admin/fields', { ...newField, entity_type: 'bride', sort_order: fields.length });
      setNewField({ field_name: '', field_type: 'text', is_required: false });
      loadData();
    } catch (e) { alert("שגיאה בהוספת השדה"); }
  };

  const moveField = async (id, direction) => {
    const idx = fields.findIndex(f => f.id === id);
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === fields.length - 1)) return;
    const list = [...fields];
    [list[idx], list[idx + direction]] = [list[idx + direction], list[idx]];
    await Promise.all(list.map((f, i) => api.patch(`/admin/fields/${f.id}`, { sort_order: i })));
    loadData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl h-[85vh] flex flex-col overflow-hidden text-right" dir="rtl">
        <div className="p-8 border-b flex justify-between items-center">
          <h2 className="text-3xl font-black text-gray-900">הגדרות מערכת</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-900 text-2xl font-bold">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 bg-gray-50 p-6 space-y-2 border-l">
            <button onClick={() => setActiveTab('columns')} className={`w-full text-right p-4 rounded-2xl font-bold transition-all ${activeTab === 'columns' ? 'bg-white shadow-sm text-accent' : 'text-gray-400'}`}>📋 עמודות טבלה</button>
            <button onClick={() => setActiveTab('fields')} className={`w-full text-right p-4 rounded-2xl font-bold transition-all ${activeTab === 'fields' ? 'bg-white shadow-sm text-accent' : 'text-gray-400'}`}>🏗️ שדות מותאמים</button>
            <button onClick={() => setActiveTab('lists')} className={`w-full text-right p-4 rounded-2xl font-bold transition-all ${activeTab === 'lists' ? 'bg-white shadow-sm text-accent' : 'text-gray-400'}`}>⚙️ רשימות בחירה</button>
          </div>

          <div className="flex-1 p-10 overflow-y-auto bg-white">
            {activeTab === 'columns' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                {allColumns.map(col => (
                  <label key={col.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl cursor-pointer border-2 border-transparent hover:border-accent/20">
                    <span className="font-bold text-gray-700">{col.label}</span>
                    <input type="checkbox" className="w-6 h-6 accent-accent" checked={visibleColumns.includes(col.id)} onChange={() => setVisibleColumns(visibleColumns.includes(col.id) ? visibleColumns.filter(c => c !== col.id) : [...visibleColumns, col.id])} />
                  </label>
                ))}
              </div>
            )}

            {activeTab === 'fields' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                  <h4 className="font-black text-gray-700">הוספת שדה חדש</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="שם השדה" className="p-4 rounded-xl outline-none font-bold" value={newField.field_name} onChange={e => setNewField({...newField, field_name: e.target.value})} />
                    <select className="p-4 rounded-xl outline-none font-bold" value={newField.field_type} onChange={e => setNewField({...newField, field_type: e.target.value})}>
                      <option value="text">טקסט</option>
                      <option value="number">מספר</option>
                      <option value="date">תאריך</option>
                      <option value="checkbox">צ'קבוקס (V)</option>
                      <option value="payment_total">💰 סך תשלום לעסקה</option>
                    </select>
                  </div>
                  <button onClick={handleAddField} className="w-full bg-gray-900 text-white p-4 rounded-xl font-black shadow-lg">הוספת שדה</button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-gray-400 text-xs mr-2">סדר שדות ושדות קיימים</h4>
                  {fields.map((f, i) => (
                    <div key={f.id} className="flex justify-between items-center p-4 border-2 border-gray-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveField(f.id, -1)} className="text-[10px] hover:text-accent">▲</button>
                          <button onClick={() => moveField(f.id, 1)} className="text-[10px] hover:text-accent">▼</button>
                        </div>
                        <span className="font-bold text-gray-800">{f.field_name} <span className="text-[9px] text-gray-400">({f.field_type})</span></span>
                      </div>
                      <button onClick={() => api.delete(`/admin/fields/${f.id}`).then(loadData)} className="text-red-400 font-bold text-xs">מחק</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'lists' && (
              <div className="space-y-10 animate-in fade-in">
                <section>
                  <h4 className="font-black text-gray-800 mb-4">ניהול סטטוסים</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {statuses.map(s => <span key={s} className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">{s} <button onClick={() => updateList('client_statuses', statuses.filter(x => x !== s))}>✕</button></span>)}
                  </div>
                  <input placeholder="הוספת סטטוס + Enter" className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold" onKeyDown={e => { if(e.key === 'Enter' && e.target.value) { updateList('client_statuses', [...statuses, e.target.value]); e.target.value = ''; } }} />
                </section>
                <section>
                  <h4 className="font-black text-gray-800 mb-4">ניהול מקורות הגעה</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {sources.map(s => <span key={s} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">{s} <button onClick={() => updateList('client_sources', sources.filter(x => x !== s))}>✕</button></span>)}
                  </div>
                  <input placeholder="הוספת מקור + Enter" className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold" onKeyDown={e => { if(e.key === 'Enter' && e.target.value) { updateList('client_sources', [...sources, e.target.value]); e.target.value = ''; } }} />
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
