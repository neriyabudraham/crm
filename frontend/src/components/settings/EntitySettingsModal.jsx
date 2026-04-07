import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDialog } from '../ui/Dialog';

export const EntitySettingsModal = ({ isOpen, onClose, entityType, allColumns, visibleColumns, setVisibleColumns }) => {
  const { toast } = useDialog();
  const [activeTab, setActiveTab] = useState('columns');
  const [fields, setFields] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [newField, setNewField] = useState({ field_name: '', field_type: 'text', is_required: false, options: [] });
  const [newOption, setNewOption] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [editOption, setEditOption] = useState('');
  const [newStatus, setNewStatus] = useState({ name: '', color: '#3B82F6' });
  const [newSource, setNewSource] = useState('');
  const [questionnaires, setQuestionnaires] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [defaultAdvance, setDefaultAdvance] = useState('');
  const [defaultDeal, setDefaultDeal] = useState('');

  const statusKey = entityType === 'bride' ? 'client_statuses' : `${entityType}_statuses`;
  const sourceKey = entityType === 'bride' ? 'client_sources' : `${entityType}_sources`;

  const loadData = async () => {
    try {
      const [f, st, so, q, t] = await Promise.all([
        api.get(`/admin/fields?type=${entityType}`),
        api.get(`/admin/settings/${statusKey}`),
        api.get(`/admin/settings/${sourceKey}`),
        api.get('/questionnaires').catch(() => ({ data: [] })),
        api.get('/admin/templates').catch(() => ({ data: [] }))
      ]);
      setFields((f.data || []).sort((a, b) => a.field_order - b.field_order));
      setStatuses(st.data || []);
      setSources(so.data || []);
      setQuestionnaires(q.data || []);
      setTemplates(t.data || []);

      api.get(`/admin/settings/${entityType}_default_advance`).then(r => setDefaultAdvance(r.data || '')).catch(() => {});
      api.get(`/admin/settings/${entityType}_default_deal`).then(r => setDefaultDeal(r.data || '')).catch(() => {});
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (isOpen) loadData(); }, [isOpen]);

  // --- שדות ---
  const handleAddField = async () => {
    if (!newField.field_name) return;
    await api.post('/admin/fields', { ...newField, entity_type: entityType, field_order: fields.length, options: newField.field_type === 'select' ? JSON.stringify(newField.options) : null });
    setNewField({ field_name: '', field_type: 'text', is_required: false, options: [] });
    setNewOption('');
    loadData();
  };

  const saveEditField = async () => {
    if (!editingField) return;
    await api.patch(`/admin/fields/${editingField.id}`, { field_name: editingField.field_name, is_required: editingField.is_required });
    if (editingField.field_type === 'select') await api.patch(`/admin/fields/${editingField.id}/options`, { options: editingField.options });
    setEditingField(null);
    loadData();
  };

  // --- סטטוסים ---
  const addStatus = () => {
    if (!newStatus.name.trim()) return;
    api.post(`/admin/settings/${statusKey}`, { values: [...statuses, { name: newStatus.name, color: newStatus.color }] }).then(() => { setNewStatus({ name: '', color: '#3B82F6' }); loadData(); });
  };
  const removeStatus = (idx) => api.post(`/admin/settings/${statusKey}`, { values: statuses.filter((_, i) => i !== idx) }).then(loadData);

  // --- מקורות ---
  const addSource = () => {
    if (!newSource.trim()) return;
    api.post(`/admin/settings/${sourceKey}`, { values: [...sources, newSource] }).then(() => { setNewSource(''); loadData(); });
  };
  const removeSource = (idx) => api.post(`/admin/settings/${sourceKey}`, { values: sources.filter((_, i) => i !== idx) }).then(loadData);

  // --- תשלומים ---
  const savePaymentDefaults = async () => {
    await api.post(`/admin/settings/${entityType}_default_advance`, { values: defaultAdvance });
    await api.post(`/admin/settings/${entityType}_default_deal`, { values: defaultDeal });
    toast.success('נשמר!');
  };

  // --- שיוך שאלון/תבנית ---
  const toggleQuestionnaireEntity = async (q) => {
    const newType = q.entity_type === entityType ? null : entityType;
    await api.patch(`/questionnaires/${q.id}`, { entity_type: newType });
    loadData();
  };

  const toggleTemplateEntity = async (t) => {
    const newType = t.entity_type === entityType ? null : entityType;
    await api.patch(`/admin/templates/${t.id}`, { entity_type: newType });
    loadData();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'columns', label: 'עמודות' },
    { id: 'fields', label: 'שדות' },
    { id: 'statuses', label: 'סטטוסים' },
    { id: 'sources', label: 'מקורות' },
    { id: 'payments', label: 'תשלומים' },
    { id: 'questionnaires', label: 'שאלונים' },
    { id: 'templates', label: 'חתימות' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl h-[85vh] flex flex-col overflow-hidden text-right" dir="rtl">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-black text-gray-900">הגדרות — {entityType === 'bride' ? 'כלות ולידים' : entityType === 'course' ? 'קורסים ותלמידות' : entityType}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-900 text-2xl font-bold">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-44 bg-gray-50 p-3 space-y-1 border-l">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-right p-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-accent' : 'text-gray-400'}`}>{tab.label}</button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-white">

            {/* עמודות */}
            {activeTab === 'columns' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400 font-bold mb-3">בחר עמודות לתצוגה בטבלה.</p>
                {allColumns.map(col => (
                  <label key={col.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-accent/20">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700 text-sm">{col.label}</span>
                      {col.custom && <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">מותאם</span>}
                    </div>
                    <input type="checkbox" className="w-5 h-5 accent-accent" checked={visibleColumns.includes(col.id)} onChange={() => setVisibleColumns(visibleColumns.includes(col.id) ? visibleColumns.filter(c => c !== col.id) : [...visibleColumns, col.id])} />
                  </label>
                ))}
              </div>
            )}

            {/* שדות */}
            {activeTab === 'fields' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400 font-bold">שדות ספציפיים לחלק זה.</p>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <input placeholder="שם השדה" className="p-3 rounded-xl outline-none font-bold text-sm" value={newField.field_name} onChange={e => setNewField({ ...newField, field_name: e.target.value })} />
                    <select className="p-3 rounded-xl outline-none font-bold text-sm" value={newField.field_type} onChange={e => setNewField({ ...newField, field_type: e.target.value, options: [] })}>
                      <option value="text">טקסט</option><option value="number">מספר</option><option value="date">תאריך</option><option value="select">רשימה</option>
                    </select>
                    <label className="flex items-center gap-2 font-bold text-xs cursor-pointer"><input type="checkbox" className="accent-red-500 w-4 h-4" checked={newField.is_required} onChange={e => setNewField({ ...newField, is_required: e.target.checked })} /> חובה</label>
                  </div>
                  {newField.field_type === 'select' && (
                    <div className="bg-white p-3 rounded-xl space-y-2">
                      <div className="flex flex-wrap gap-1">{newField.options.map((o, i) => (<span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">{o}<button onClick={() => setNewField({ ...newField, options: newField.options.filter((_, j) => j !== i) })} className="text-red-400">✕</button></span>))}</div>
                      <div className="flex gap-2"><input placeholder="+ Enter" className="flex-1 p-2 rounded-lg outline-none text-xs" value={newOption} onChange={e => setNewOption(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newOption.trim()) { setNewField({ ...newField, options: [...newField.options, newOption.trim()] }); setNewOption(''); } }} /><button onClick={() => { if (newOption.trim()) { setNewField({ ...newField, options: [...newField.options, newOption.trim()] }); setNewOption(''); } }} className="bg-gray-200 px-2 rounded text-xs font-bold">+</button></div>
                    </div>
                  )}
                  <button onClick={handleAddField} className="w-full bg-gray-900 text-white p-2.5 rounded-xl font-black text-sm">הוסף</button>
                </div>
                <div className="space-y-2">
                  {fields.map(f => {
                    const isEd = editingField?.id === f.id;
                    const opts = isEd ? (editingField.options || []) : (typeof f.options === 'string' ? JSON.parse(f.options || '[]') : f.options || []);
                    return (
                      <div key={f.id} className={`p-3 rounded-xl ${isEd ? 'bg-accent/5 border-2 border-accent/20' : 'bg-gray-50'}`}>
                        {isEd ? (
                          <div className="space-y-2">
                            <div className="flex gap-2 items-center">
                              <input className="flex-1 p-2 rounded-lg outline-none font-bold bg-white text-sm" value={editingField.field_name} onChange={e => setEditingField({ ...editingField, field_name: e.target.value })} />
                              <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer whitespace-nowrap"><input type="checkbox" className="accent-red-500" checked={editingField.is_required} onChange={e => setEditingField({ ...editingField, is_required: e.target.checked })} /> חובה</label>
                            </div>
                            {editingField.field_type === 'select' && (
                              <div className="bg-white p-2 rounded-lg space-y-1">
                                {opts.map((o, i) => (
                                  <div key={i} className="flex items-center gap-1 bg-gray-50 p-1 rounded">
                                    <div className="flex flex-col"><button onClick={() => { if (i > 0) { const a = [...opts]; [a[i-1],a[i]]=[a[i],a[i-1]]; setEditingField({ ...editingField, options: a }); }}} className="text-[7px] text-gray-400 hover:text-accent">▲</button><button onClick={() => { if (i < opts.length-1) { const a = [...opts]; [a[i],a[i+1]]=[a[i+1],a[i]]; setEditingField({ ...editingField, options: a }); }}} className="text-[7px] text-gray-400 hover:text-accent">▼</button></div>
                                    <input className="flex-1 p-1 rounded text-xs outline-none bg-white font-bold" value={o} onChange={e => { const a = [...opts]; a[i] = e.target.value; setEditingField({ ...editingField, options: a }); }} />
                                    <button onClick={() => setEditingField({ ...editingField, options: opts.filter((_, j) => j !== i) })} className="text-red-400 text-xs">✕</button>
                                  </div>
                                ))}
                                <div className="flex gap-1"><input placeholder="+" className="flex-1 p-1 rounded text-xs outline-none" value={editOption} onChange={e => setEditOption(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && editOption.trim()) { setEditingField({ ...editingField, options: [...opts, editOption.trim()] }); setEditOption(''); } }} /><button onClick={() => { if (editOption.trim()) { setEditingField({ ...editingField, options: [...opts, editOption.trim()] }); setEditOption(''); }}} className="bg-gray-200 px-2 rounded text-xs">+</button></div>
                              </div>
                            )}
                            <div className="flex gap-2"><button onClick={saveEditField} className="bg-green-500 text-white px-3 py-1 rounded-lg font-bold text-xs">שמור</button><button onClick={() => setEditingField(null)} className="text-gray-400 text-xs font-bold">ביטול</button></div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><span className="font-bold text-gray-800 text-sm">{f.field_name}</span><span className="text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">{f.field_type === 'select' ? `רשימה (${opts.length})` : f.field_type}</span>{f.is_required && <span className="text-[8px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full font-bold">חובה</span>}</div>
                            <div className="flex gap-2"><button onClick={() => setEditingField({ ...f, options: opts })} className="text-accent text-xs font-bold">ערוך</button><button onClick={() => api.delete(`/admin/fields/${f.id}`).then(loadData)} className="text-red-400 text-xs font-bold">מחק</button></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {fields.length === 0 && <p className="text-gray-300 text-center py-6 text-sm">אין שדות מותאמים.</p>}
                </div>
              </div>
            )}

            {/* סטטוסים */}
            {activeTab === 'statuses' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 font-bold">הראשון = ברירת מחדל.</p>
                <div className="flex gap-2">
                  <input placeholder="סטטוס" className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-accent" value={newStatus.name} onChange={e => setNewStatus({ ...newStatus, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addStatus()} />
                  <input type="color" className="w-11 h-11 rounded-xl cursor-pointer" value={newStatus.color} onChange={e => setNewStatus({ ...newStatus, color: e.target.value })} />
                  <button onClick={addStatus} className="bg-gray-900 text-white px-5 rounded-xl font-black text-sm">+</button>
                </div>
                {statuses.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || '#ccc' }} /><span className="font-bold text-gray-800 text-sm">{s.name || s}</span>{i === 0 && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">דיפולט</span>}</div>
                    <button onClick={() => removeStatus(i)} className="text-red-400 text-xs font-bold">מחק</button>
                  </div>
                ))}
              </div>
            )}

            {/* מקורות */}
            {activeTab === 'sources' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input placeholder="מקור" className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-accent" value={newSource} onChange={e => setNewSource(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSource()} />
                  <button onClick={addSource} className="bg-gray-900 text-white px-5 rounded-xl font-black text-sm">+</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, i) => (<span key={i} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5">{s}<button onClick={() => removeSource(i)} className="text-gray-400 hover:text-red-500">✕</button></span>))}
                </div>
              </div>
            )}

            {/* תשלומים */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <p className="text-sm text-gray-400 font-bold">הגדרות ברירת מחדל לתשלומים בחלק זה.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">סכום מקדמה דיפולטיבי</label>
                    <input type="number" placeholder="לדוג: 500" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold" value={defaultAdvance} onChange={e => setDefaultAdvance(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">סכום עסקה דיפולטיבי</label>
                    <input type="number" placeholder="לדוג: 5000" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold" value={defaultDeal} onChange={e => setDefaultDeal(e.target.value)} />
                  </div>
                  <button onClick={savePaymentDefaults} className="w-full bg-gray-900 text-white p-3 rounded-xl font-black">שמור הגדרות</button>
                </div>
              </div>
            )}

            {/* שאלונים */}
            {activeTab === 'questionnaires' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 font-bold">בחר אילו שאלונים יוצגו בחלק זה.</p>
                {questionnaires.length > 0 ? questionnaires.map(q => (
                  <label key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-accent/20">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700 text-sm">{q.name}</span>
                      <span className="text-[8px] text-gray-400">{(q.fields || []).length} שדות</span>
                      {q.entity_type && q.entity_type !== entityType && <span className="text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">{q.entity_type}</span>}
                    </div>
                    <input type="checkbox" className="w-5 h-5 accent-accent" checked={!q.entity_type || q.entity_type === entityType} onChange={() => toggleQuestionnaireEntity(q)} />
                  </label>
                )) : <p className="text-gray-300 text-center py-6 text-sm">אין שאלונים. ניתן ליצור בהגדרות ראשיות.</p>}
              </div>
            )}

            {/* חתימות */}
            {activeTab === 'templates' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 font-bold">בחר אילו תבניות חתימה יוצגו בחלק זה.</p>
                {templates.length > 0 ? templates.map(t => (
                  <label key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-accent/20">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700 text-sm">{t.name}</span>
                      {t.entity_type && t.entity_type !== entityType && <span className="text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">{t.entity_type}</span>}
                    </div>
                    <input type="checkbox" className="w-5 h-5 accent-accent" checked={!t.entity_type || t.entity_type === entityType} onChange={() => toggleTemplateEntity(t)} />
                  </label>
                )) : <p className="text-gray-300 text-center py-6 text-sm">אין תבניות. ניתן ליצור בהגדרות ראשיות.</p>}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
