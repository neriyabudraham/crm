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

  const generateSchedule = async () => {
    const total = prompt('הזיני סכום כולל לגבייה:');
    if (!total) return;
    try {
      await api.post('/admin/payments/schedule', {
        clientId,
        totalAmount: parseFloat(total),
        installments: 3,
        startDate: new Date().toISOString().split('T')[0]
      });
      fetchPayments();
    } catch (err) { alert('שגיאה בהפקת תשלומים'); }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-gray-900">לוח תשלומים וגבייה</h3>
        <button onClick={generateSchedule} className="text-accent font-black text-sm hover:underline">
          + הפקת לוח תשלומים אוטומטי
        </button>
      </div>

      <div className="space-y-4">
        {payments.length > 0 ? payments.map((p, idx) => (
          <div key={p.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-bold text-gray-400">
                {idx + 1}
              </div>
              <div>
                <p className="font-bold text-gray-900">{p.amount} ₪</p>
                <p className="text-xs text-gray-400">מועד פירעון: {new Date(p.due_date).toLocaleDateString('he-IL')}</p>
              </div>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
              p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'
            }`}>
              {p.status === 'paid' ? 'שולם' : 'ממתין'}
            </span>
          </div>
        )) : (
          <div className="text-center py-10 text-gray-300 font-bold">טרם הופקו תשלומים ללקוחה זו</div>
        )}
      </div>
    </div>
  );
};
