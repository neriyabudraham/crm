import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ClientHeader } from '../components/clients/ClientHeader';
import { PaymentManager } from '../components/payments/PaymentManager';
import { ContractManager } from '../components/contracts/ContractManager';
import { EditClientModal } from '../components/clients/EditClientModal';
import { QuickNotes } from '../components/clients/QuickNotes';

export const ClientDetailsPage = ({ clientId, onBack }) => {
  const [client, setClient] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [qSessions, setQSessions] = useState([]);
  const [copiedQId, setCopiedQId] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [showQHistory, setShowQHistory] = useState(false);
  const [qExistingModal, setQExistingModal] = useState(null); // { url, qId }

  const fetchClient = () => api.get(`/clients/${clientId}`).then(res => setClient(res.data));
  const loadQuestionnaires = () => {
    api.get('/questionnaires').then(res => setQuestionnaires(res.data || []));
    api.get(`/questionnaires/client/${clientId}/sessions`).then(res => setQSessions(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
      loadQuestionnaires();
      api.get('/admin/fields').then(res => setCustomFields(res.data || []));

      // WebSocket לעדכונים בזמן אמת
      const ws = new WebSocket(`wss://crm.botomat.co.il/ws?clientId=${clientId}`);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'questionnaire_updated' || data.type === 'client_updated') {
          fetchClient();
          loadQuestionnaires();
        }
      };
      ws.onerror = () => {};
      return () => ws.close();
    }
  }, [clientId]);

  const sendQuestionnaire = async (qId) => {
    try {
      const res = await api.post('/questionnaires/sessions', { questionnaire_id: qId, client_id: clientId });
      const { url, existing } = res.data;

      if (existing) {
        setQExistingModal({ url, qId });
        return;
      } else {
        const cleanPhone = client.phone?.replace(/^0/, '972');
        const qName = questionnaires.find(q => q.id === qId)?.name || 'שאלון';
        const message = encodeURIComponent(`שלום ${client.full_name}, מצורף קישור למילוי ${qName}:\n${url}`);
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
      }
      loadQuestionnaires();
      fetchClient(); // רענון פרטי לקוח (שדות ממופים)
    } catch (err) { alert('שגיאה'); }
  };

  const copyQLink = async (token) => {
    await navigator.clipboard.writeText(`https://crm.botomat.co.il/questionnaire/${token}`);
    setCopiedQId(token);
    setTimeout(() => setCopiedQId(null), 2000);
  };

  if (!client) return <div className="p-20 text-center font-bold text-gray-400">טוען נתונים...</div>;

  // שדות ממופים — מה-client עצמו (כבר מעודכן מהשאלון)
  const mappedFields = {};

  // שדות מותאמים מ-custom_fields_data
  const customData = client.custom_fields_data || {};
  customFields.forEach(cf => {
    const val = customData[cf.id] || customData[String(cf.id)];
    if (val) {
      mappedFields[String(cf.id)] = {
        label: cf.field_name,
        value: typeof val === 'boolean' ? (val ? 'כן' : 'לא') : val
        };
      }
    });

  // גם תשובות שאלונים שלא מופו לשדות ספציפיים
  qSessions.filter(s => s.status === 'submitted' && s.answers).forEach(s => {
    const q = questionnaires.find(q => q.id === s.questionnaire_id);
    if (!q?.fields) return;
    Object.entries(s.answers).forEach(([fieldId, answer]) => {
      const field = q.fields.find(f => f.id === fieldId);
      const targetField = q.field_mapping?.[fieldId];
      // רק שדות שלא כבר ממופים ומוצגים
      if (field && answer && !targetField) {
        const key = `q_${s.questionnaire_id}_${fieldId}`;
        if (!mappedFields[key]) {
          mappedFields[key] = {
            label: field.label,
            value: typeof answer === 'boolean' ? (answer ? 'כן' : 'לא') : answer
          };
        }
      }
    });
  });

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700 text-right" dir="rtl">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold transition-all">
        <span className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shadow-sm">→</span>
        חזרה לרשימה
      </button>

      <ClientHeader client={client} onEdit={() => setIsEditOpen(true)} onDeleteSuccess={onBack} onRefresh={fetchClient} />

      {/* שדות ממופים - חלק עליון */}
      {Object.keys(mappedFields).length > 0 && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mt-6">
          <h3 className="text-lg font-black text-gray-900 mb-5">פרטים נוספים</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(mappedFields).map(([key, { label, value }]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
                <p className="font-black text-gray-900 text-lg">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8 space-y-8">
          <PaymentManager clientId={clientId} entityType={client.entity_type} />
          <ContractManager clientId={clientId} clientName={client.full_name} phone={client.phone} />

          {/* שאלונים */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6">שאלונים</h3>

            {questionnaires.length > 0 ? (
              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-gray-400">שלח שאלון:</p>
                <div className="flex flex-wrap gap-2">
                  {questionnaires.filter(q => !q.entity_type || q.entity_type === client.entity_type).map(q => (
                    <button key={q.id} onClick={() => sendQuestionnaire(q.id)} className="bg-gray-100 hover:bg-accent hover:text-white text-gray-600 px-4 py-2 rounded-xl font-bold text-sm transition-all">
                      {q.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-300 font-bold text-sm text-center py-4">אין שאלונים מוגדרים.</p>
            )}

            {(() => {
              // קיבוץ — אחרון לכל שאלון
              const latestQ = {};
              const olderQ = [];
              qSessions.forEach(s => {
                if (!latestQ[s.questionnaire_id]) latestQ[s.questionnaire_id] = s;
                else olderQ.push(s);
              });
              const latestList = Object.values(latestQ);
              if (latestList.length === 0) return null;
              return (
                <div className="space-y-3">
                  {latestList.map(s => {
                    const q = questionnaires.find(q => q.id === s.questionnaire_id);
                    return (
                      <div key={s.id} className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${s.status === 'submitted' ? 'bg-green-500' : 'bg-yellow-400'}`} />
                            <span className="font-bold text-gray-600 text-sm">{s.questionnaire_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {s.status === 'pending' && (
                              <button onClick={() => copyQLink(s.token)} className="text-accent font-bold text-xs hover:underline">
                                {copiedQId === s.token ? 'הועתק!' : 'העתק לינק'}
                              </button>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {s.status === 'submitted' ? 'הושלם' : 'ממתין'}
                            </span>
                          </div>
                        </div>
                        {s.status === 'submitted' && s.answers && Object.keys(s.answers).length > 0 && (
                          <div className="p-4 space-y-2">
                            {Object.entries(s.answers).map(([fieldId, answer]) => {
                              const field = (s.questionnaire_fields || q?.fields)?.find(f => f.id === fieldId);
                              return (
                                <div key={fieldId} className="flex justify-between text-sm border-b border-gray-50 pb-1 last:border-0">
                                  <span className="text-gray-400 font-bold">{field?.label || fieldId}</span>
                                  <span className="font-black text-gray-700">{typeof answer === 'boolean' ? (answer ? 'כן' : 'לא') : answer}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {olderQ.length > 0 && (
                    <>
                      <button onClick={() => setShowQHistory(!showQHistory)} className="text-gray-400 text-[11px] font-bold hover:text-gray-600">
                        {showQHistory ? 'הסתר היסטוריה' : `היסטוריית שאלונים (${olderQ.length})`}
                      </button>
                      {showQHistory && (
                        <div className="space-y-1">
                          {olderQ.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                              <span className="text-gray-500">{s.questionnaire_name} — {new Date(s.created_at).toLocaleDateString('he-IL')}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {s.status === 'submitted' ? 'הושלם' : 'ממתין'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-2">הערות עבודה</h3>
            <p className="text-[10px] text-gray-400 mb-4 font-bold uppercase tracking-widest">נשמר אוטומטית</p>
            <QuickNotes clientId={clientId} initialNotes={client.general_notes} />
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-lg font-black text-gray-900 mb-4">פרטי ליד</h3>
            <div className="space-y-4 text-sm">
              {client.email && <div className="flex justify-between border-b pb-2"><span className="text-gray-400 font-bold">אימייל:</span><span className="font-black text-gray-700">{client.email}</span></div>}
              <div className="flex justify-between border-b pb-2"><span className="text-gray-400 font-bold">מקור:</span><span className="font-black text-gray-700">{client.source || '-'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-400 font-bold">סטטוס:</span><span className="font-black text-accent">{client.status_name}</span></div>
              <div className="flex justify-between pb-2"><span className="text-gray-400 font-bold">נוצר:</span><span className="font-black text-gray-700">{new Date(client.created_at).toLocaleDateString('he-IL')}</span></div>
            </div>
          </div>
        </div>
      </div>

      <EditClientModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} client={client} onRefresh={fetchClient} />

      {/* Modal שאלון קיים */}
      {qExistingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4" dir="rtl" onClick={() => setQExistingModal(null)}>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">השאלון כבר קיים</h3>
            <p className="text-gray-400 text-sm font-bold mb-6">שאלון זה כבר נשלח או מולא. מה תרצה לעשות?</p>
            <div className="space-y-3">
              <button onClick={() => {
                const cleanPhone = client.phone?.replace(/^0/, '972');
                const qName = questionnaires.find(q => q.id === qExistingModal.qId)?.name || 'שאלון';
                const message = encodeURIComponent(`שלום ${client.full_name}, מצורף קישור לעדכון ${qName}:\n${qExistingModal.url}`);
                window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
                setQExistingModal(null);
              }} className="w-full bg-green-500 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-green-600 transition-all">
                שלח שוב בוואטסאפ
              </button>
              <button onClick={async () => {
                await navigator.clipboard.writeText(qExistingModal.url);
                setQExistingModal(null);
                setCopiedQId('modal');
                setTimeout(() => setCopiedQId(null), 2000);
              }} className="w-full bg-gray-100 text-gray-700 p-4 rounded-2xl font-black hover:bg-gray-200 transition-all">
                העתק לינק
              </button>
              <button onClick={() => setQExistingModal(null)} className="w-full text-gray-400 font-bold text-sm mt-2">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
