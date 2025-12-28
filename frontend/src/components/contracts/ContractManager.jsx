import React, { useState } from 'react';
import api from '../../services/api';

export const ContractManager = ({ clientId, clientName, phone }) => {
  const [isSending, setIsSending] = useState(false);

  const sendContractLink = async () => {
    setIsSending(true);
    const message = `היי ${clientName}, מצורף קישור לחתימה על החוזה שלך: https://crm.botomat.co.il/sign/${clientId}`;
    
    try {
      await api.post('/auth/send-whatsapp', { phone, text: message });
      alert('הקישור נשלח בהצלחה בוואטסאפ!');
    } catch (err) {
      alert('שגיאה בשליחת הוואטסאפ');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-gray-900">חוזים וחתימה דיגיטלית</h3>
        <span className="bg-red-50 text-red-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">טרם נחתם</span>
      </div>

      <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50">
        <div className="text-4xl mb-4">✍️</div>
        <p className="text-gray-400 font-bold text-center max-w-xs mb-6">
          שלחי לכלה קישור אישי לחתימה מאובטחת על החוזה ישירות מהנייד.
        </p>
        
        <button 
          onClick={sendContractLink}
          disabled={isSending}
          className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isSending ? 'שולח...' : 'שלחי חוזה לחתימה בוואטסאפ'}
          <span className="text-xl">📱</span>
        </button>
      </div>
    </div>
  );
};
