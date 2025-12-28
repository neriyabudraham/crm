import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const PublicQuestionnaire = () => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({ phone: '', full_name: '' });
  const [customData, setCustomData] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get('/admin/fields').then(res => setFields(res.data.sort((a,b) => a.sort_order - b.sort_order)));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/clients', { ...formData, custom_fields_data: customData, merge: true });
    setSubmitted(true);
  };

  if (submitted) return <div className="p-20 text-center font-black text-2xl">תודה! הנתונים נשמרו במערכת.</div>;

  return (
    <div className="max-w-xl mx-auto p-10 text-right" dir="rtl">
      <h1 className="text-3xl font-black mb-10">שאלון פרטים אישיים</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input required placeholder="שם מלא" className="w-full p-4 bg-gray-50 rounded-2xl" onChange={e => setFormData({...formData, full_name: e.target.value})} />
        <input required placeholder="מספר טלפון" className="w-full p-4 bg-gray-50 rounded-2xl" onChange={e => setFormData({...formData, phone: e.target.value})} />
        <hr />
        {fields.map(f => (
          <div key={f.id} className="flex flex-col gap-2">
            <label className="font-bold">{f.field_name}</label>
            <input 
              type={f.field_type === 'date' ? 'date' : 'text'} 
              className="p-4 bg-gray-50 rounded-2xl" 
              onChange={e => setCustomData({...customData, [f.id]: e.target.value})}
            />
          </div>
        ))}
        <button className="w-full bg-accent text-white p-5 rounded-2xl font-black text-xl">שלחי פרטים</button>
      </form>
    </div>
  );
};
