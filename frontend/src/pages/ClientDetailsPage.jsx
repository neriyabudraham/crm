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

  const fetchClient = () => {
    api.get(`/clients/${clientId}`).then(res => setClient(res.data));
  };

  useEffect(() => { 
    if (clientId) fetchClient(); 
  }, [clientId]);

  if (!client) return <div className="p-20 text-center font-bold text-gray-400">טוען נתונים...</div>;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700 text-right" dir="rtl">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold transition-all">
        <span className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shadow-sm">→</span>
        חזרה לרשימה
      </button>

      <ClientHeader client={client} onEdit={() => setIsEditOpen(true)} onDeleteSuccess={onBack} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8 space-y-8">
          <PaymentManager clientId={clientId} />
          <ContractManager clientId={clientId} clientName={client.full_name} phone={client.phone} />
          
          {/* שאלונים ומידע דינמי בלבד (ללא הערות כפולות) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <h3 className="text-xl font-black text-gray-900 mb-6">מידע נוסף משאלונים</h3>
             <p className="text-gray-400 font-bold text-sm italic text-center py-10">המידע יוצג כאן לאחר מילוי שאלון על ידי הכלה</p>
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
              <div className="flex justify-between border-b pb-2"><span className="text-gray-400 font-bold">מקור:</span><span className="font-black text-gray-700">{client.source}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-400 font-bold">סטטוס:</span><span className="font-black text-accent">{client.status_name}</span></div>
              <div className="flex justify-between pb-2"><span className="text-gray-400 font-bold">נוצרה:</span><span className="font-black text-gray-700">{new Date(client.created_at).toLocaleDateString('he-IL')}</span></div>
            </div>
          </div>
        </div>
      </div>

      <EditClientModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} client={client} onRefresh={fetchClient} />
    </div>
  );
};
