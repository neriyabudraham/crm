import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const PaymentManager = ({ clientId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = () => {
    api.get(`/admin/payments/client/${clientId}`).then(res => {
      setPayments(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchPayments(); }, [clientId]);

  const toggleStatus = async (paymentId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      await api.patch(`/admin/payments/${paymentId}`, { status: newStatus });
      fetchPayments();
    } catch (err) { alert('שגיאה בעדכון הסטטוס'); }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-gray-900">ניהול גבייה ותשלומים</h3>
        <div className="bg-gray-50 px-4 py-2 rounded-xl">
           <span className="text-xs text-gray-400 font-bold ml-2">סה"כ שולם:</span>
           <span className="font-black text-green-600">
             {payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0)} ₪
           </span>
        </div>
      </div>

      <div className="space-y-3">
        {payments.length > 0 ? payments.map((p, idx) => (
          <div key={p.id} className="group flex items-center justify-between p-4 rounded-2xl border-2 border-gray-50 hover:border-yellow-100 transition-all bg-white hover:shadow-md">
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${p.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                {idx + 1}
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg">{p.amount} ₪</p>
                <p className="text-xs text-gray-400 font-bold">מועד: {new Date(p.due_date).toLocaleDateString('he-IL')}</p>
              </div>
            </div>
            
            <button 
              onClick={() => toggleStatus(p.id, p.status)}
              className={`px-6 py-2 rounded-xl font-black text-xs transition-all ${
                p.status === 'paid' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-100' 
                : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-yellow-400 hover:text-yellow-600'
              }`}
            >
              {p.status === 'paid' ? 'שולם ✅' : 'סמן כסולק'}
            </button>
          </div>
        )) : (
          <div className="py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
            <p className="text-gray-300 font-bold text-lg">טרם הוגדרו תשלומים</p>
          </div>
        )}
      </div>
    </div>
  );
};
