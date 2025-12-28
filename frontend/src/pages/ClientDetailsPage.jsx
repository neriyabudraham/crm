import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ClientHeader } from '../components/clients/ClientHeader';
import { PaymentManager } from '../components/payments/PaymentManager';
import { ContractManager } from '../components/contracts/ContractManager';
import { ClientInfoGrid } from '../components/clients/ClientInfoGrid';
import { EditClientModal } from '../components/clients/EditClientModal';

export const ClientDetailsPage = ({ clientId, onBack }) => {
  const [client, setClient] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchClient = () => {
    api.get(`/clients/${clientId}`).then(res => setClient(res.data));
  };

  useEffect(() => { fetchClient(); }, [clientId]);

  if (!client) return <div className="p-20 text-center font-bold text-gray-400 animate-pulse">טוען נתונים...</div>;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 text-right" dir="rtl">
      {/* כפתור חזרה מעוצב */}
      <button onClick={onBack} className="mb-8 group flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-all font-bold">
        <span className="w-8 h-8 rounded-full bg-white border flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all shadow-sm">→</span>
        חזרה לרשימת הכלות
      </button>

      {/* כותרת הכרטיס עם כפתור עריכה */}
      <div className="relative">
        <ClientHeader client={client} />
        <button 
          onClick={() => setIsEditOpen(true)}
          className="absolute left-8 top-1/2 -translate-y-1/2 bg-gray-50 hover:bg-yellow-400 hover:text-white p-3 rounded-xl transition-all font-black text-xs text-gray-400 border border-gray-100"
        >
          עריכת פרטים ✏️
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* עמודה מרכזית - תשלומים וחוזים */}
        <div className="lg:col-span-8 space-y-8">
          <PaymentManager clientId={clientId} />
          <ContractManager clientId={clientId} clientName={client.full_name} phone={client.phone} />
          <ClientInfoGrid client={client} />
        </div>

        {/* עמודה צדדית - מידע מהיר */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-xl font-black text-gray-900 mb-6">סיכום כלה</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold text-sm">סטטוס נוכחי</span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg font-black text-xs uppercase">{client.status_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold text-sm">מקור הגעה</span>
                <span className="font-black text-gray-700">{client.source || 'אורגני'}</span>
              </div>
              <div className="pt-6 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 font-black uppercase mb-2">פעולות מהירות</p>
                <button className="w-full text-right p-3 hover:bg-gray-50 rounded-xl transition-colors font-bold text-gray-700 flex items-center gap-2">
                  <span>📅</span> קביעת פגישת ניסיון
                </button>
                <button className="w-full text-right p-3 hover:bg-gray-50 rounded-xl transition-colors font-bold text-gray-700 flex items-center gap-2">
                  <span>💌</span> שליחת הודעת מזל טוב
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditClientModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        client={client} 
        onRefresh={fetchClient} 
      />
    </div>
  );
};
