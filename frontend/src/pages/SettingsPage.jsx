import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TemplateEditor } from '../components/settings/TemplateEditor';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('statuses');
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [fields, setFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [defaultFields, setDefaultFields] = useState([]);
  const [entityTypes, setEntityTypes] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [newStatus, setNewStatus] = useState({ name: '', color: '#3B82F6' });
  const [newSource, setNewSource] = useState('');
  const [newField, setNewField] = useState({ field_name: '', field_type: 'text', is_required: false, options: [] });
  const [newFieldOption, setNewFieldOption] = useState('');
  const [editingFieldG, setEditingFieldG] = useState(null);
  const [editOptionG, setEditOptionG] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [editingUser, setEditingUser] = useState(null);
  const [newEntityType, setNewEntityType] = useState({ id: '', label: '', icon: '' });
  const [payMethods, setPayMethods] = useState([]);
  const [newPayMethod, setNewPayMethod] = useState('');
  const [newTemplate, setNewTemplate] = useState({ name: '' });
  const [templateFile, setTemplateFile] = useState(null);
  const [visualEditor, setVisualEditor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState(null);
  const [customFieldsList, setCustomFieldsList] = useState([]);

  const loadAll = async () => {
    try {
      const [st, so, f, u, df, et, tpl] = await Promise.all([
        api.get('/admin/settings/client_statuses'),
        api.get('/admin/settings/client_sources'),
        api.get('/admin/fields?type=global'),
        api.get('/auth/users'),
        api.get('/admin/settings/default_fields').catch(() => ({ data: null })),
        api.get('/admin/settings/entity_types').catch(() => ({ data: [] })),
        api.get('/admin/templates').catch(() => ({ data: [] })),
      ]);
      setStatuses(st.data || []);
      setSources(so.data || []);
      setFields((f.data || []).sort((a, b) => a.field_order - b.field_order));
      setUsers(u.data || []);
      setDefaultFields(df.data || [
        { id: 'full_name', label: 'שם מלא', required: true, visible: true, system: true },
        { id: 'phone', label: 'טלפון', required: true, visible: true, system: true },
        { id: 'email', label: 'אימייל', required: false, visible: true, system: false },
        { id: 'source', label: 'מקור הגעה', required: false, visible: true, system: false },
        { id: 'status_name', label: 'סטטוס', required: false, visible: true, system: false },
      ]);
      setEntityTypes(et.data || []);
      setTemplates(tpl.data || []);
      const pmRes = await api.get('/admin/settings/payment_methods').catch(() => ({ data: [] }));
      setPayMethods(pmRes.data || ['מזומן', 'העברה בנקאית', 'כרטיס אשראי', 'צ\'ק', 'ביט', 'פייבוקס', 'אחר']);
      setCustomFieldsList(f.data || []);
      const qRes = await api.get('/questionnaires').catch(() => ({ data: [] }));
      setQuestionnaires(qRes.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadAll(); }, []);

  // --- סטטוסים ---
  const addStatus = () => {
    if (!newStatus.name.trim()) return;
    const updated = [...statuses, { name: newStatus.name, color: newStatus.color }];
    api.post('/admin/settings/client_statuses', { values: updated }).then(() => {
      setNewStatus({ name: '', color: '#3B82F6' });
      loadAll();
    });
  };

  const removeStatus = (idx) => {
    api.post('/admin/settings/client_statuses', { values: statuses.filter((_, i) => i !== idx) }).then(loadAll);
  };

  // --- מקורות ---
  const addSource = () => {
    if (!newSource.trim()) return;
    api.post('/admin/settings/client_sources', { values: [...sources, newSource] }).then(() => {
      setNewSource('');
      loadAll();
    });
  };

  const removeSource = (idx) => {
    api.post('/admin/settings/client_sources', { values: sources.filter((_, i) => i !== idx) }).then(loadAll);
  };

  // --- שדות ---
  const addField = async () => {
    if (!newField.field_name.trim()) return;
    await api.post('/admin/fields', { ...newField, entity_type: 'global', field_order: fields.length, options: newField.field_type === 'select' ? JSON.stringify(newField.options) : null });
    setNewField({ field_name: '', field_type: 'text', is_required: false, options: [] });
    setNewFieldOption('');
    loadAll();
  };

  const toggleRequired = async (field) => {
    await api.patch(`/admin/fields/${field.id}`, { is_required: !field.is_required });
    loadAll();
  };

  const saveEditFieldG = async () => {
    if (!editingFieldG) return;
    await api.patch(`/admin/fields/${editingFieldG.id}`, { field_name: editingFieldG.field_name, is_required: editingFieldG.is_required });
    if (editingFieldG.field_type === 'select') {
      await api.patch(`/admin/fields/${editingFieldG.id}/options`, { options: editingFieldG.options });
    }
    setEditingFieldG(null);
    setEditOptionG('');
    loadAll();
  };

  // --- שדות ברירת מחדל ---
  const toggleDefaultField = async (fieldId, prop) => {
    const updated = defaultFields.map(f => {
      if (f.id === fieldId) {
        if (prop === 'required' && f.system) return f;
        return { ...f, [prop]: !f[prop] };
      }
      return f;
    });
    setDefaultFields(updated);
    await api.post('/admin/settings/default_fields', { values: updated });
  };

  // --- משתמשים ---
  const addUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim()) return;
    try {
      await api.post('/auth/users', newUser);
      setNewUser({ username: '', password: '', role: 'user' });
      loadAll();
    } catch (err) { alert(err.response?.data?.error || 'שגיאה'); }
  };

  const saveUser = async () => {
    if (!editingUser) return;
    try {
      await api.patch(`/auth/users/${editingUser.id}`, editingUser);
      setEditingUser(null);
      loadAll();
    } catch (err) { alert(err.response?.data?.error || 'שגיאה'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('למחוק את המשתמש?')) return;
    await api.delete(`/auth/users/${id}`);
    loadAll();
  };

  // --- תבניות חתימה ---
  const uploadTemplate = async () => {
    if (!newTemplate.name.trim() || !templateFile) return alert('נא להזין שם ולהעלות קובץ PDF');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', templateFile);
      formData.append('name', newTemplate.name);
      formData.append('entity_type', 'bride');
      formData.append('signature_positions', JSON.stringify([]));
      await api.post('/admin/templates/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewTemplate({ name: '' });
      setTemplateFile(null);
      loadAll();
    } catch (err) { alert('שגיאה בהעלאה'); }
    finally { setUploading(false); }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('למחוק את התבנית?')) return;
    await api.delete(`/admin/templates/${id}`);
    loadAll();
  };

  // --- שאלונים ---
  const createQuestionnaire = async () => {
    const name = prompt('שם השאלון:');
    if (!name) return;
    const res = await api.post('/questionnaires', { name, entity_type: 'bride', fields: [], field_mapping: {} });
    setEditingQuestionnaire(res.data);
    loadAll();
  };

  const saveQuestionnaire = async () => {
    if (!editingQuestionnaire) return;
    await api.patch(`/questionnaires/${editingQuestionnaire.id}`, {
      name: editingQuestionnaire.name,
      fields: editingQuestionnaire.fields,
      field_mapping: editingQuestionnaire.field_mapping
    });
    setEditingQuestionnaire(null);
    loadAll();
  };

  const addQuestionnaireField = () => {
    const f = editingQuestionnaire;
    setEditingQuestionnaire({
      ...f,
      fields: [...(f.fields || []), { id: 'f_' + Date.now(), label: '', type: 'text', required: false, placeholder: '', options: [] }]
    });
  };

  const updateQField = (idx, key, value) => {
    const fields = [...(editingQuestionnaire.fields || [])];
    fields[idx] = { ...fields[idx], [key]: value };
    setEditingQuestionnaire({ ...editingQuestionnaire, fields });
  };

  const removeQField = (idx) => {
    const fields = editingQuestionnaire.fields.filter((_, i) => i !== idx);
    setEditingQuestionnaire({ ...editingQuestionnaire, fields });
  };

  const updateQMapping = (fieldId, targetField) => {
    setEditingQuestionnaire({
      ...editingQuestionnaire,
      field_mapping: { ...editingQuestionnaire.field_mapping, [fieldId]: targetField }
    });
  };

  const deleteQuestionnaire = async (id) => {
    if (!confirm('למחוק את השאלון?')) return;
    await api.delete(`/questionnaires/${id}`);
    loadAll();
  };

  // --- entity types ---
  const addEntityType = () => {
    if (!newEntityType.id.trim() || !newEntityType.label.trim()) return;
    const updated = [...entityTypes, { ...newEntityType }];
    api.post('/admin/settings/entity_types', { values: updated }).then(() => {
      setNewEntityType({ id: '', label: '', icon: '' });
      loadAll();
    });
  };

  const removeEntityType = (idx) => {
    api.post('/admin/settings/entity_types', { values: entityTypes.filter((_, i) => i !== idx) }).then(loadAll);
  };

  const tabs = [
    { id: 'statuses', label: 'סטטוסים', icon: '🏷️' },
    { id: 'sources', label: 'מקורות הגעה', icon: '📍' },
    { id: 'default_fields', label: 'שדות ברירת מחדל', icon: '📋' },
    { id: 'fields', label: 'שדות מותאמים', icon: '📝' },
    { id: 'users', label: 'משתמשים והרשאות', icon: '👥' },
    { id: 'payments_settings', label: 'אמצעי תשלום', icon: '💳' },
    { id: 'templates', label: 'תבניות חתימה', icon: '✍️' },
    { id: 'questionnaires', label: 'שאלונים', icon: '📋' },
    { id: 'entity_types', label: 'מודולים נוספים', icon: '🧩' },
  ];

  return (
    <div className="animate-in fade-in duration-500 text-right" dir="rtl">
      <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-8">הגדרות מערכת</h2>

      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100 hover:text-gray-600'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* סטטוסים */}
      {activeTab === 'statuses' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <h3 className="text-2xl font-black mb-2">ניהול סטטוסים</h3>
          <p className="text-gray-400 text-sm mb-8">הסטטוס הראשון ברשימה הוא ברירת המחדל עבור לידים חדשים.</p>
          <div className="flex gap-3 mb-8">
            <input placeholder="שם הסטטוס" className="flex-1 p-4 bg-gray-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-accent" value={newStatus.name} onChange={e => setNewStatus({ ...newStatus, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addStatus()} />
            <input type="color" className="w-14 h-14 rounded-xl cursor-pointer border-0" value={newStatus.color} onChange={e => setNewStatus({ ...newStatus, color: e.target.value })} />
            <button onClick={addStatus} className="bg-gray-900 text-white px-8 rounded-xl font-black">הוסף</button>
          </div>
          <div className="space-y-2">
            {statuses.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color || '#ccc' }} />
                  <span className="font-bold text-gray-800">{s.name || s}</span>
                  {idx === 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ברירת מחדל</span>}
                </div>
                <button onClick={() => removeStatus(idx)} className="text-red-400 hover:text-red-600 font-bold text-sm">מחק</button>
              </div>
            ))}
            {statuses.length === 0 && <p className="text-gray-300 text-center py-8">אין סטטוסים. הוסף את הראשון.</p>}
          </div>
        </div>
      )}

      {/* מקורות */}
      {activeTab === 'sources' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <h3 className="text-2xl font-black mb-2">מקורות הגעה</h3>
          <p className="text-gray-400 text-sm mb-8">הרשימה תופיע כאפשרויות בחירה בטופס הוספת ליד.</p>
          <div className="flex gap-3 mb-8">
            <input placeholder="שם המקור" className="flex-1 p-4 bg-gray-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-accent" value={newSource} onChange={e => setNewSource(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSource()} />
            <button onClick={addSource} className="bg-gray-900 text-white px-8 rounded-xl font-black">הוסף</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {sources.map((s, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                {s} <button onClick={() => removeSource(idx)} className="text-gray-400 hover:text-red-500 mr-1">✕</button>
              </span>
            ))}
            {sources.length === 0 && <p className="text-gray-300 text-center py-8 w-full">אין מקורות. הוסף את הראשון.</p>}
          </div>
        </div>
      )}

      {/* שדות ברירת מחדל */}
      {activeTab === 'default_fields' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <h3 className="text-2xl font-black mb-2">שדות ברירת מחדל</h3>
          <p className="text-gray-400 text-sm mb-8">שדות אלה מובנים במערכת. ניתן לקבוע אם הם חובה ואם הם מוצגים בטפסים. שדה "שם מלא" ו"טלפון" הם שדות מערכת ולא ניתן לבטל את חובתם.</p>
          <div className="space-y-3">
            {defaultFields.map(f => (
              <div key={f.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800">{f.label}</span>
                  {f.system && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">שדה מערכת</span>}
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-gray-500">חובה</span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-red-500"
                      checked={f.required}
                      disabled={f.system}
                      onChange={() => toggleDefaultField(f.id, 'required')}
                    />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-gray-500">מוצג</span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-accent"
                      checked={f.visible}
                      disabled={f.system}
                      onChange={() => toggleDefaultField(f.id, 'visible')}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* שדות מותאמים */}
      {activeTab === 'fields' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <h3 className="text-2xl font-black mb-2">שדות מותאמים</h3>
          <p className="text-gray-400 text-sm mb-8">שדות נוספים שיופיעו בטופס הוספת ליד ובכרטיס הליד.</p>
          <div className="bg-gray-50 p-6 rounded-3xl mb-8">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input placeholder="שם השדה" className="p-4 rounded-xl outline-none font-bold" value={newField.field_name} onChange={e => setNewField({ ...newField, field_name: e.target.value })} />
              <select className="p-4 rounded-xl outline-none font-bold" value={newField.field_type} onChange={e => setNewField({ ...newField, field_type: e.target.value, options: [] })}>
                <option value="text">טקסט</option>
                <option value="number">מספר</option>
                <option value="date">תאריך</option>
                <option value="select">רשימה נפתחת</option>
                <option value="file">קובץ</option>
              </select>
              <label className="flex items-center gap-2 px-4 font-bold text-sm cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-accent" checked={newField.is_required} onChange={e => setNewField({ ...newField, is_required: e.target.checked })} /> שדה חובה
              </label>
            </div>
            {newField.field_type === 'select' && (
              <div className="bg-white p-3 rounded-xl space-y-2 mt-3">
                <p className="text-[10px] font-bold text-gray-400">אפשרויות לבחירה:</p>
                <div className="flex flex-wrap gap-1.5">
                  {newField.options.map((opt, i) => (
                    <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      {opt} <button onClick={() => setNewField({ ...newField, options: newField.options.filter((_, j) => j !== i) })} className="text-gray-400 hover:text-red-500">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input placeholder="הקלד אפשרות ולחץ Enter" className="flex-1 p-2 rounded-lg outline-none text-sm" value={newFieldOption} onChange={e => setNewFieldOption(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && newFieldOption.trim()) { setNewField({ ...newField, options: [...newField.options, newFieldOption.trim()] }); setNewFieldOption(''); }
                  }} />
                  <button onClick={() => { if (newFieldOption.trim()) { setNewField({ ...newField, options: [...newField.options, newFieldOption.trim()] }); setNewFieldOption(''); } }} className="bg-gray-200 px-3 rounded-lg text-xs font-bold">+</button>
                </div>
              </div>
            )}
            <button onClick={addField} className="w-full bg-gray-900 text-white p-4 rounded-xl font-black mt-3">הוסף שדה</button>
          </div>
          <div className="space-y-2">
            {fields.map(f => {
              const isEd = editingFieldG?.id === f.id;
              const opts = isEd ? (editingFieldG.options || []) : (typeof f.options === 'string' ? JSON.parse(f.options || '[]') : f.options || []);
              return (
                <div key={f.id} className={`p-3 rounded-xl transition-all ${isEd ? 'bg-accent/5 border-2 border-accent/20' : 'bg-gray-50'}`}>
                  {isEd ? (
                    <div className="space-y-3">
                      <div className="flex gap-3 items-center">
                        <input className="flex-1 p-2 rounded-lg outline-none font-bold bg-white" value={editingFieldG.field_name} onChange={e => setEditingFieldG({ ...editingFieldG, field_name: e.target.value })} />
                        <label className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer whitespace-nowrap">
                          <input type="checkbox" className="accent-red-500" checked={editingFieldG.is_required} onChange={e => setEditingFieldG({ ...editingFieldG, is_required: e.target.checked })} /> חובה
                        </label>
                      </div>
                      {editingFieldG.field_type === 'select' && (
                        <div className="bg-white p-3 rounded-lg space-y-2">
                          <p className="text-[10px] font-bold text-gray-400">אפשרויות:</p>
                          <div className="space-y-1">
                            {opts.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg">
                                <div className="flex flex-col gap-0.5">
                                  <button onClick={() => { if (i === 0) return; const a = [...opts]; [a[i-1], a[i]] = [a[i], a[i-1]]; setEditingFieldG({ ...editingFieldG, options: a }); }} className="text-[8px] text-gray-400 hover:text-accent leading-none">▲</button>
                                  <button onClick={() => { if (i === opts.length-1) return; const a = [...opts]; [a[i], a[i+1]] = [a[i+1], a[i]]; setEditingFieldG({ ...editingFieldG, options: a }); }} className="text-[8px] text-gray-400 hover:text-accent leading-none">▼</button>
                                </div>
                                <input className="flex-1 p-1 rounded text-xs outline-none bg-white font-bold" value={opt} onChange={e => { const a = [...opts]; a[i] = e.target.value; setEditingFieldG({ ...editingFieldG, options: a }); }} />
                                <button onClick={() => setEditingFieldG({ ...editingFieldG, options: opts.filter((_, j) => j !== i) })} className="text-red-400 text-xs">✕</button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input placeholder="+ אפשרות" className="flex-1 p-1.5 rounded-lg outline-none text-xs" value={editOptionG} onChange={e => setEditOptionG(e.target.value)} onKeyDown={e => {
                              if (e.key === 'Enter' && editOptionG.trim()) { setEditingFieldG({ ...editingFieldG, options: [...opts, editOptionG.trim()] }); setEditOptionG(''); }
                            }} />
                            <button onClick={() => { if (editOptionG.trim()) { setEditingFieldG({ ...editingFieldG, options: [...opts, editOptionG.trim()] }); setEditOptionG(''); } }} className="bg-gray-200 px-2 rounded text-xs font-bold">+</button>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={saveEditFieldG} className="bg-green-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs">שמור</button>
                        <button onClick={() => { setEditingFieldG(null); setEditOptionG(''); }} className="text-gray-400 font-bold text-xs">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">{f.field_name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{f.field_type === 'select' ? `רשימה (${opts.length})` : f.field_type}</span>
                        {f.is_required && <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-bold">חובה</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingFieldG({ ...f, options: opts })} className="text-accent text-xs font-bold hover:underline">ערוך</button>
                        <button onClick={() => api.delete(`/admin/fields/${f.id}`).then(loadAll)} className="text-red-400 text-xs font-bold">מחק</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {fields.length === 0 && <p className="text-gray-300 text-center py-8">אין שדות מותאמים.</p>}
          </div>
        </div>
      )}

      {/* משתמשים */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <h3 className="text-2xl font-black mb-2">ניהול משתמשים</h3>
          <p className="text-gray-400 text-sm mb-8">הוספה, עריכה ומחיקה של משתמשי המערכת.</p>
          <div className="bg-gray-50 p-6 rounded-3xl mb-8">
            <h4 className="font-black text-gray-600 text-sm mb-4">הוסף משתמש חדש</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input placeholder="שם משתמש" className="p-4 rounded-xl outline-none font-bold" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
              <input placeholder="סיסמה" type="password" className="p-4 rounded-xl outline-none font-bold" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
              <select className="p-4 rounded-xl outline-none font-bold" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="admin">מנהל</option>
                <option value="user">משתמש רגיל</option>
              </select>
            </div>
            <button onClick={addUser} className="w-full bg-gray-900 text-white p-4 rounded-xl font-black">הוסף משתמש</button>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="p-5 bg-gray-50 rounded-2xl">
                {editingUser?.id === u.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <input className="p-3 rounded-xl outline-none font-bold bg-white" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} />
                      <input placeholder="סיסמה חדשה (ריק = ללא שינוי)" type="password" className="p-3 rounded-xl outline-none font-bold bg-white" value={editingUser.password || ''} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} />
                      <select className="p-3 rounded-xl outline-none font-bold bg-white" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                        <option value="admin">מנהל</option>
                        <option value="user">משתמש רגיל</option>
                      </select>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                      <h5 className="font-bold text-sm text-gray-500 mb-3">הרשאות עמודים</h5>
                      <div className="flex flex-wrap gap-3">
                        {['brides', 'courses', 'payments', 'settings'].map(page => {
                          const perms = editingUser.permissions || {};
                          const pages = perms.pages || ['brides', 'courses', 'payments', 'settings'];
                          return (
                            <label key={page} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 accent-accent" checked={pages.includes(page)} onChange={() => {
                                const newPages = pages.includes(page) ? pages.filter(p => p !== page) : [...pages, page];
                                setEditingUser({ ...editingUser, permissions: { ...perms, pages: newPages } });
                              }} />
                              <span className="font-bold text-sm">{{ brides: 'כלות', courses: 'קורסים', payments: 'גבייה', settings: 'הגדרות' }[page]}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={saveUser} className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold">שמור</button>
                      <button onClick={() => setEditingUser(null)} className="text-gray-400 font-bold">ביטול</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-black">{u.username.charAt(0).toUpperCase()}</div>
                      <div>
                        <span className="font-bold text-gray-800">{u.username}</span>
                        <span className={`mr-3 text-[10px] px-2 py-0.5 rounded-full font-bold ${u.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'}`}>{u.role === 'admin' ? 'מנהל' : 'משתמש'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setEditingUser({ ...u, password: '' })} className="text-accent font-bold text-sm hover:underline">ערוך</button>
                      <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-600 font-bold text-sm">מחק</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* אמצעי תשלום */}
      {activeTab === 'payments_settings' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <h3 className="text-2xl font-black mb-2">אמצעי תשלום</h3>
          <p className="text-gray-400 text-sm mb-8">הגדר אילו אמצעי תשלום יהיו זמינים במערכת.</p>
          <div className="flex gap-3 mb-6">
            <input placeholder="שם אמצעי תשלום" className="flex-1 p-4 bg-gray-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-accent" value={newPayMethod} onChange={e => setNewPayMethod(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter' && newPayMethod.trim()) {
                const updated = [...payMethods, newPayMethod.trim()];
                api.post('/admin/settings/payment_methods', { values: updated }).then(() => { setNewPayMethod(''); loadAll(); });
              }
            }} />
            <button onClick={() => {
              if (!newPayMethod.trim()) return;
              api.post('/admin/settings/payment_methods', { values: [...payMethods, newPayMethod.trim()] }).then(() => { setNewPayMethod(''); loadAll(); });
            }} className="bg-gray-900 text-white px-8 rounded-xl font-black">הוסף</button>
          </div>
          <div className="space-y-2">
            {payMethods.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="font-bold text-gray-800">{m}</span>
                <button onClick={() => {
                  api.post('/admin/settings/payment_methods', { values: payMethods.filter((_, i) => i !== idx) }).then(loadAll);
                }} className="text-red-400 hover:text-red-600 font-bold text-sm">מחק</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* תבניות חתימה */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <h3 className="text-2xl font-black mb-2">תבניות חתימה דיגיטלית</h3>
          <p className="text-gray-400 text-sm mb-8">העלה PDF, פתח את העורך הוויזואלי, וגרור אלמנטים (חתימה, תאריך, צ'קבוקס, טקסט) ישירות על המסמך.</p>

          <div className="bg-gray-50 p-6 rounded-3xl mb-8">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input placeholder="שם התבנית" className="p-4 rounded-xl outline-none font-bold" value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} />
              <label className="p-4 rounded-xl bg-white border-2 border-dashed border-gray-200 cursor-pointer flex items-center justify-center font-bold text-gray-400 hover:border-accent transition-all">
                {templateFile ? templateFile.name : 'בחר קובץ PDF'}
                <input type="file" accept=".pdf" className="hidden" onChange={e => setTemplateFile(e.target.files[0])} />
              </label>
            </div>
            <button onClick={uploadTemplate} disabled={uploading} className="w-full bg-gray-900 text-white p-4 rounded-xl font-black disabled:opacity-50">
              {uploading ? 'מעלה...' : 'העלה תבנית'}
            </button>
          </div>

          <div className="space-y-3">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <span className="font-black text-gray-800">{t.name}</span>
                    <span className="text-[10px] text-gray-400 mr-3">{(t.elements || []).length} אלמנטים</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setVisualEditor(t)} className="bg-accent text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all">
                    עורך ויזואלי
                  </button>
                  <a href={`/${t.file_path}`} target="_blank" rel="noreferrer" className="text-gray-400 font-bold text-sm hover:text-gray-600">צפה</a>
                  <button onClick={() => deleteTemplate(t.id)} className="text-red-400 hover:text-red-600 font-bold text-sm">מחק</button>
                </div>
              </div>
            ))}
            {templates.length === 0 && <p className="text-gray-300 text-center py-8">אין תבניות. העלה את הראשונה.</p>}
          </div>
        </div>
      )}

      {/* עורך ויזואלי */}
      {visualEditor && (
        <TemplateEditor
          template={visualEditor}
          onSave={() => { setVisualEditor(null); loadAll(); }}
          onClose={() => setVisualEditor(null)}
        />
      )}

      {/* שאלונים */}
      {activeTab === 'questionnaires' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-black">ניהול שאלונים</h3>
              <p className="text-gray-400 text-sm mt-1">צור שאלונים מותאמים, הגדר מיפוי לשדות הליד, ושלח ללקוח לינק למילוי.</p>
            </div>
            <button onClick={createQuestionnaire} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black">+ שאלון חדש</button>
          </div>

          {editingQuestionnaire ? (
            <div className="border-2 border-accent/30 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <input
                  className="text-xl font-black outline-none bg-transparent border-b-2 border-transparent focus:border-accent pb-1"
                  value={editingQuestionnaire.name}
                  onChange={e => setEditingQuestionnaire({ ...editingQuestionnaire, name: e.target.value })}
                />
                <div className="flex gap-3">
                  <button onClick={saveQuestionnaire} className="bg-green-500 text-white px-5 py-2 rounded-xl font-bold">שמור</button>
                  <button onClick={() => setEditingQuestionnaire(null)} className="text-gray-400 font-bold">ביטול</button>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {(editingQuestionnaire.fields || []).map((f, idx) => (
                  <div key={f.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="grid grid-cols-4 gap-3 mb-2">
                      <input placeholder="שם השדה" className="p-3 rounded-lg outline-none font-bold col-span-2" value={f.label} onChange={e => updateQField(idx, 'label', e.target.value)} />
                      <select className="p-3 rounded-lg outline-none font-bold" value={f.type} onChange={e => updateQField(idx, 'type', e.target.value)}>
                        <option value="text">טקסט</option>
                        <option value="textarea">טקסט ארוך</option>
                        <option value="number">מספר</option>
                        <option value="date">תאריך</option>
                        <option value="select">רשימה</option>
                        <option value="checkbox">צ'קבוקס</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer text-xs font-bold">
                          <input type="checkbox" className="accent-red-500" checked={f.required} onChange={e => updateQField(idx, 'required', e.target.checked)} /> חובה
                        </label>
                        <button onClick={() => removeQField(idx)} className="text-red-400 mr-auto">✕</button>
                      </div>
                    </div>
                    {f.type === 'select' && (
                      <input placeholder="אפשרויות (מופרדות בפסיק)" className="w-full p-2 rounded-lg outline-none text-sm bg-white" value={(f.options || []).join(', ')} onChange={e => updateQField(idx, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400">מיפוי לשדה:</span>
                      <select className="p-1 rounded text-xs outline-none bg-white font-bold" value={editingQuestionnaire.field_mapping?.[f.id] || ''} onChange={e => updateQMapping(f.id, e.target.value)}>
                        <option value="">ללא מיפוי</option>
                        <option value="full_name">שם מלא</option>
                        <option value="phone">טלפון</option>
                        <option value="email">אימייל</option>
                        <option value="source">מקור</option>
                        {customFieldsList.map(cf => <option key={cf.id} value={String(cf.id)}>{cf.field_name}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addQuestionnaireField} className="w-full border-2 border-dashed border-gray-200 p-4 rounded-xl text-gray-400 font-bold hover:border-accent hover:text-accent transition-all">
                + הוסף שדה לשאלון
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {questionnaires.map(q => (
                <div key={q.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📋</span>
                    <div>
                      <span className="font-black text-gray-800">{q.name}</span>
                      <span className="text-[10px] text-gray-400 mr-3">{(q.fields || []).length} שדות</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditingQuestionnaire({ ...q })} className="text-accent font-bold text-sm hover:underline">ערוך</button>
                    <button onClick={() => deleteQuestionnaire(q.id)} className="text-red-400 hover:text-red-600 font-bold text-sm">מחק</button>
                  </div>
                </div>
              ))}
              {questionnaires.length === 0 && <p className="text-gray-300 text-center py-8">אין שאלונים. צור את הראשון.</p>}
            </div>
          )}
        </div>
      )}

      {/* מודולים נוספים */}
      {activeTab === 'entity_types' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <h3 className="text-2xl font-black mb-2">מודולים נוספים</h3>
          <p className="text-gray-400 text-sm mb-8">הוסף חלקים נוספים למערכת בדומה ל"כלות" ו"קורסים". כל מודול חדש יופיע בתפריט הצד ויכלול ניהול לידים עצמאי.</p>

          <div className="bg-gray-50 p-6 rounded-3xl mb-8">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input placeholder="מזהה (באנגלית, לדוג: events)" className="p-4 rounded-xl outline-none font-bold" value={newEntityType.id} onChange={e => setNewEntityType({ ...newEntityType, id: e.target.value.replace(/[^a-z_]/g, '') })} />
              <input placeholder="שם תצוגה (לדוג: אירועים)" className="p-4 rounded-xl outline-none font-bold" value={newEntityType.label} onChange={e => setNewEntityType({ ...newEntityType, label: e.target.value })} />
              <input placeholder="אייקון (לדוג: 🎪)" className="p-4 rounded-xl outline-none font-bold text-2xl text-center" value={newEntityType.icon} onChange={e => setNewEntityType({ ...newEntityType, icon: e.target.value })} />
            </div>
            <button onClick={addEntityType} className="w-full bg-gray-900 text-white p-4 rounded-xl font-black">הוסף מודול</button>
          </div>

          <div className="space-y-3">
            <div className="p-5 bg-gray-50 rounded-2xl flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3"><span className="text-xl">👰</span><span className="font-bold">כלות ולידים</span></div>
              <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">מובנה</span>
            </div>
            <div className="p-5 bg-gray-50 rounded-2xl flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3"><span className="text-xl">🎓</span><span className="font-bold">קורסים ותלמידות</span></div>
              <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">מובנה</span>
            </div>
            {entityTypes.map((et, idx) => (
              <div key={idx} className="p-5 bg-gray-50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3"><span className="text-xl">{et.icon || '📂'}</span><span className="font-bold">{et.label}</span><span className="text-[10px] text-gray-400">({et.id})</span></div>
                <button onClick={() => removeEntityType(idx)} className="text-red-400 hover:text-red-600 font-bold text-sm">מחק</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
