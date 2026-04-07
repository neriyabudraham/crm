import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const QuestionnairePublicPage = ({ token }) => {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState({});
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    api.get(`/questionnaires/session/${token}`)
      .then(res => {
        setSession(res.data);
        // אם יש תשובות קיימות, טען אותן
        if (res.data.answers && Object.keys(res.data.answers).length > 0) {
          setAnswers(res.data.answers);
          setIsUpdate(true);
        }
      })
      .catch(err => {
        setError('הקישור לא תקין או שפג תוקפו');
      });
  }, [token]);

  const handleUpload = async (fieldId, file) => {
    // בדיקת גודל
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (isImage && file.size > 5 * 1024 * 1024) return alert('תמונה מעל 5MB');
    if (isVideo && file.size > 10 * 1024 * 1024) return alert('סרטון מעל 10MB');

    setUploading(prev => ({ ...prev, [fieldId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/questionnaires/session/${token}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnswers(prev => ({ ...prev, [fieldId]: res.data.url }));
    } catch (err) { alert('שגיאה בהעלאה'); }
    finally { setUploading(prev => ({ ...prev, [fieldId]: false })); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fields = session.fields || [];
    for (const f of fields) {
      if (f.required && (!answers[f.id] || !answers[f.id].toString().trim())) {
        alert(`השדה "${f.label}" הוא שדה חובה`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await api.post(`/questionnaires/session/${token}/submit`, { answers });
      setSubmitted(true);
    } catch (err) {
      alert('שגיאה: ' + (err.response?.data?.error || err.message));
    } finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">תודה!</h1>
        <p className="text-gray-400 font-bold">{isUpdate ? 'התשובות עודכנו בהצלחה.' : 'השאלון נשלח בהצלחה.'}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-black text-gray-900">{error}</h1>
      </div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
    </div>
  );

  const fields = session.fields || [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">{session.questionnaire_name}</h1>
          <p className="text-gray-400 font-bold text-sm">שלום {session.client_name}</p>
          {isUpdate && <p className="text-accent text-xs font-bold mt-2">ניתן לעדכן את התשובות</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map(f => (
            <div key={f.id} className="flex flex-col gap-1">
              <label className="text-xs font-black text-gray-600 mr-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>

              {f.type === 'text' && (
                <input className="p-4 bg-gray-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-accent" placeholder={f.placeholder || ''} value={answers[f.id] || ''} onChange={e => setAnswers({ ...answers, [f.id]: e.target.value })} />
              )}

              {f.type === 'textarea' && (
                <textarea className="p-4 bg-gray-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-accent h-28 resize-none" placeholder={f.placeholder || ''} value={answers[f.id] || ''} onChange={e => setAnswers({ ...answers, [f.id]: e.target.value })} />
              )}

              {f.type === 'number' && (
                <input type="number" className="p-4 bg-gray-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-accent" value={answers[f.id] || ''} onChange={e => setAnswers({ ...answers, [f.id]: e.target.value })} />
              )}

              {f.type === 'date' && (
                <input type="date" className="p-4 bg-gray-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-accent" value={answers[f.id] || ''} onChange={e => setAnswers({ ...answers, [f.id]: e.target.value })} />
              )}

              {f.type === 'select' && (
                <select className="p-4 bg-gray-50 rounded-xl outline-none font-bold" value={answers[f.id] || ''} onChange={e => setAnswers({ ...answers, [f.id]: e.target.value })}>
                  <option value="">בחר...</option>
                  {(f.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
              )}

              {f.type === 'checkbox' && (
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-accent" checked={answers[f.id] || false} onChange={e => setAnswers({ ...answers, [f.id]: e.target.checked })} />
                  <span className="font-bold text-sm text-gray-600">{f.placeholder || ''}</span>
                </label>
              )}

              {(f.type === 'image' || f.type === 'video' || f.type === 'file') && (
                <div>
                  {answers[f.id] && (
                    <div className="mb-2">
                      {f.type === 'image' ? (
                        <img src={answers[f.id]} className="w-full max-h-48 object-cover rounded-xl" alt="" />
                      ) : f.type === 'video' ? (
                        <video src={answers[f.id]} controls className="w-full max-h-48 rounded-xl" />
                      ) : (
                        <a href={answers[f.id]} target="_blank" rel="noreferrer" className="text-accent font-bold text-sm hover:underline">קובץ מצורף</a>
                      )}
                    </div>
                  )}
                  <label className="block p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer text-center hover:border-accent transition-all">
                    <span className="font-bold text-gray-400 text-sm">
                      {uploading[f.id] ? 'מעלה...' : answers[f.id] ? 'החלף קובץ' : `העלה ${f.type === 'image' ? 'תמונה' : f.type === 'video' ? 'סרטון' : 'קובץ'}`}
                    </span>
                    <input type="file" className="hidden"
                      accept={f.type === 'image' ? 'image/*' : f.type === 'video' ? 'video/*' : '*'}
                      onChange={e => e.target.files[0] && handleUpload(f.id, e.target.files[0])}
                      disabled={uploading[f.id]}
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1">{f.type === 'image' ? 'עד 5MB' : f.type === 'video' ? 'עד 10MB' : ''}</p>
                </div>
              )}
            </div>
          ))}

          <button type="submit" disabled={submitting}
            className="w-full bg-gray-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all disabled:opacity-50 mt-4">
            {submitting ? 'שולח...' : isUpdate ? 'עדכן תשובות' : 'שלח שאלון'}
          </button>
        </form>
      </div>
    </div>
  );
};
