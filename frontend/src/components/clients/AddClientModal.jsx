import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Input } from '../ui/Input';

export const AddClientModal = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', source: '' });
  const [customFields, setCustomFields] = useState([]);
  const [customValues, setCustomValues] = useState({});

  useEffect(() => {
    if (isOpen) {
      api.get('/admin/fields?type=bride').then(res => setCustomFields(res.data));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. יצירת הלקוחה
      const res = await api.post('/clients', { ...formData, entity_type: 'bride' });
      const clientId = res.data.id;

      // 2. שמירת שדות דינמיים (אם יש)
      if (Object.keys(customValues).length > 0) {
        await api.post('/admin/questionnaire/submit', { clientId, answers: customValues });
      }

      onRefresh();
      onClose();
      setFormData({ full_name: '', phone: '', email: '', source: '' });
    } catch (err) { alert('שגיאה בשמירת הנתונים'); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black">הוספת כלה חדשה</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="שם מלא" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            <Input label="טלפון" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input label="אימייל" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <Input label="מקור הגעה" placeholder="לדוגמה: אינסטגרם" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
          </div>

          {customFields.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-accent">שדות מותאמים אישית</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customFields.map(field => (
                  <Input 
                    key={field.id}
                    label={field.field_name}
                    type={field.field_type === 'date' ? 'date' : 'text'}
                    required={field.is_required}
                    onChange={e => setCustomValues({...customValues, [field.field_name]: e.target.value})}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pt-8 flex gap-4">
            <button className="flex-1 bg-gray-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all">שמירת כלה</button>
            <button type="button" onClick={onClose} className="px-8 py-5 border-2 border-gray-100 rounded-2xl font-bold text-gray-400">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};
