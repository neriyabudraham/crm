import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const ContractManager = ({ clientId, clientName, phone }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sessions, setSessions] = useState([]);
  const [signedDocs, setSignedDocs] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [showDocHistory, setShowDocHistory] = useState(false);

  useEffect(() => {
    api.get('/admin/templates').then(res => {
      setTemplates(res.data || []);
      if (res.data?.[0]) setSelectedTemplate(res.data[0].id);
    });
    loadHistory();
  }, [clientId]);

  const loadHistory = () => {
    api.get(`/signing/client/${clientId}/sessions`).then(res => setSessions(res.data || []));
    api.get(`/signing/client/${clientId}/documents`).then(res => setSignedDocs(res.data || []));
  };

  const createContract = async () => {
    if (!selectedTemplate) return;
    setCreating(true);
    try {
      await api.post('/signing/sessions', { client_id: clientId, template_id: selectedTemplate });
      loadHistory();
    } catch (err) { alert('שגיאה'); }
    finally { setCreating(false); }
  };

  const copyLink = async (token) => {
    await navigator.clipboard.writeText(`https://crm.botomat.co.il/sign/${token}`);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendWhatsApp = (token) => {
    const url = `https://crm.botomat.co.il/sign/${token}`;
    const cleanPhone = phone?.replace(/^0/, '972');
    const s = sessions.find(s => s.token === token);
    const message = encodeURIComponent(`שלום ${clientName}, מצורף קישור לחתימה על ${s?.template_name || 'חוזה'}:\n${url}`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const downloadFile = (filePath) => {
    const a = document.createElement('a');
    a.href = `/uploads/${filePath.replace('uploads/', '')}`;
    a.download = filePath.split('/').pop();
    a.click();
  };

  const deleteDoc = async (id) => {
    if (!confirm('למחוק?')) return;
    await api.delete(`/signing/documents/${id}`);
    loadHistory();
  };

  const deleteSession = async (id) => {
    if (!confirm('למחוק?')) return;
    await api.delete(`/signing/sessions/${id}`);
    loadHistory();
  };

  // קיבוץ מסמכים חתומים — אחרון לכל תבנית
  const latestDocs = {};
  const olderDocs = [];
  signedDocs.forEach(doc => {
    if (!latestDocs[doc.template_id]) latestDocs[doc.template_id] = doc;
    else olderDocs.push(doc);
  });

  // קיבוץ sessions — אחרון לכל תבנית (pending בלבד)
  const latestSessions = {};
  const olderSessions = [];
  sessions.forEach(s => {
    const key = `${s.template_id}_${s.status}`;
    if (s.status === 'pending' && !latestSessions[s.template_id]) latestSessions[s.template_id] = s;
    else if (s.status === 'pending') olderSessions.push(s);
    // signed sessions כבר מוצגים כמסמכים
  });

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
      <h3 className="text-xl font-black text-gray-900 mb-6">חוזים וחתימה דיגיטלית</h3>

      {/* יצירת חוזה */}
      <div className="bg-gray-50 p-5 rounded-2xl mb-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-400 mb-1 block mr-1">תבנית</label>
            <select className="w-full p-3 rounded-xl outline-none font-bold bg-white" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
              {templates.length === 0 && <option value="">אין תבניות</option>}
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button onClick={createContract} disabled={creating || !selectedTemplate} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-black transition-all disabled:opacity-50 whitespace-nowrap">
            {creating ? 'יוצר...' : '+ צור חוזה'}
          </button>
        </div>
      </div>

      {/* מסמכים חתומים */}
      {Object.values(latestDocs).length > 0 && (
        <div className="mb-6">
          <h4 className="font-black text-sm text-gray-600 mb-3">מסמכים חתומים</h4>
          <div className="space-y-2">
            {Object.values(latestDocs).map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-green-600 font-bold text-sm">✅ {doc.template_name}</span>
                  <span className="text-[10px] text-gray-400">{new Date(doc.signed_at).toLocaleDateString('he-IL')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewUrl(`/uploads/${doc.file_path.replace('uploads/', '')}`)} className="text-blue-500 font-bold text-xs hover:underline">תצוגה</button>
                  <button onClick={() => downloadFile(doc.file_path)} className="text-accent font-bold text-xs hover:underline">הורד</button>
                  <button onClick={() => deleteDoc(doc.id)} className="text-red-400 font-bold text-xs hover:underline">מחק</button>
                </div>
              </div>
            ))}
          </div>
          {olderDocs.length > 0 && (
            <>
              <button onClick={() => setShowDocHistory(!showDocHistory)} className="text-gray-400 text-[11px] font-bold mt-2 hover:text-gray-600">
                {showDocHistory ? 'הסתר' : `היסטוריה (${olderDocs.length})`}
              </button>
              {showDocHistory && (
                <div className="space-y-1 mt-2">
                  {olderDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                      <span className="text-gray-500">{doc.template_name} — {new Date(doc.signed_at).toLocaleDateString('he-IL')}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setPreviewUrl(`/uploads/${doc.file_path.replace('uploads/', '')}`)} className="text-blue-400 hover:underline">תצוגה</button>
                        <button onClick={() => downloadFile(doc.file_path)} className="text-accent hover:underline">הורד</button>
                        <button onClick={() => deleteDoc(doc.id)} className="text-red-400 hover:underline">מחק</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* חוזים ממתינים (אחרון לכל תבנית) */}
      {Object.values(latestSessions).length > 0 && (
        <div className="mb-4">
          <h4 className="font-black text-sm text-gray-400 mb-3">ממתין לחתימה</h4>
          <div className="space-y-2">
            {Object.values(latestSessions).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="font-bold text-gray-600">{s.template_name}</span>
                  <span className="text-[10px] text-gray-400">{new Date(s.created_at).toLocaleDateString('he-IL')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(s.token)} className="text-accent font-bold text-xs hover:underline">
                    {copiedId === s.token ? '✓ הועתק' : 'העתק לינק'}
                  </button>
                  <button onClick={() => sendWhatsApp(s.token)} className="text-green-500 font-bold text-xs hover:underline">וואטסאפ</button>
                  <button onClick={() => deleteSession(s.id)} className="text-red-400 font-bold text-xs hover:underline">מחק</button>
                </div>
              </div>
            ))}
          </div>
          {olderSessions.length > 0 && (
            <>
              <button onClick={() => setShowSessionHistory(!showSessionHistory)} className="text-gray-400 text-[11px] font-bold mt-2 hover:text-gray-600">
                {showSessionHistory ? 'הסתר' : `היסטוריית לינקים (${olderSessions.length})`}
              </button>
              {showSessionHistory && (
                <div className="space-y-1 mt-2">
                  {olderSessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                      <span className="text-gray-500">{s.template_name} — {new Date(s.created_at).toLocaleDateString('he-IL')}</span>
                      <div className="flex gap-2">
                        <button onClick={() => copyLink(s.token)} className="text-accent hover:underline">{copiedId === s.token ? '✓' : 'העתק'}</button>
                        <button onClick={() => deleteSession(s.id)} className="text-red-400 hover:underline">מחק</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {Object.values(latestDocs).length === 0 && Object.values(latestSessions).length === 0 && (
        <p className="text-center text-gray-300 font-bold text-sm py-4">טרם נוצרו חוזים</p>
      )}

      {/* תצוגה מקדימה */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-black text-gray-900">תצוגה מקדימה</h3>
              <div className="flex gap-3">
                <button onClick={() => downloadFile(previewUrl)} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm">הורד</button>
                <button onClick={() => setPreviewUrl(null)} className="text-gray-400 text-xl font-bold">✕</button>
              </div>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full" />
          </div>
        </div>
      )}
    </div>
  );
};
