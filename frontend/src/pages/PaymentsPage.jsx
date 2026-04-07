import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

export const PaymentsPage = () => {
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      const clientsRes = await api.get('/clients');
      setClients(clientsRes.data || []);

      const allPayments = [];
      for (const c of clientsRes.data || []) {
        try {
          const res = await api.get(`/admin/payments/client/${c.id}`);
          (res.data || []).forEach(p => allPayments.push({ ...p, client_name: c.full_name, client_phone: c.phone, entity_type: c.entity_type }));
        } catch (e) {}
      }
      setPayments(allPayments);
    };
    loadData();
  }, []);

  const toggleStatus = async (paymentId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await api.patch(`/admin/payments/${paymentId}`, { status: newStatus });
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: newStatus } : p));
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return payments;
    return payments.filter(p => p.status === filter);
  }, [payments, filter]);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  return (
    <div className="animate-in fade-in duration-500 text-right" dir="rtl">
      <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-8">גבייה וכספים</h2>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-400 text-xs font-bold mb-1">סה"כ שולם</p>
          <p className="text-3xl font-black text-green-600">{totalPaid.toLocaleString()} ₪</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-400 text-xs font-bold mb-1">ממתין לתשלום</p>
          <p className="text-3xl font-black text-yellow-600">{totalPending.toLocaleString()} ₪</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-400 text-xs font-bold mb-1">סה"כ לקוחות</p>
          <p className="text-3xl font-black text-gray-900">{new Set(payments.map(p => p.client_id)).size}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {[
          { id: 'all', label: 'הכל' },
          { id: 'pending', label: 'ממתין' },
          { id: 'paid', label: 'שולם' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${filter === f.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-black tracking-widest uppercase">
              <tr>
                <th className="px-6 py-5">לקוח</th>
                <th className="px-6 py-5">טלפון</th>
                <th className="px-6 py-5">סכום</th>
                <th className="px-6 py-5">מועד</th>
                <th className="px-6 py-5">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-5 font-bold text-gray-900">{p.client_name}</td>
                  <td className="px-6 py-5 text-gray-500">{p.client_phone}</td>
                  <td className="px-6 py-5 font-black">{p.amount} ₪</td>
                  <td className="px-6 py-5 text-gray-400 text-sm">{p.due_date ? new Date(p.due_date).toLocaleDateString('he-IL') : '-'}</td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => toggleStatus(p.id, p.status)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                        p.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      {p.status === 'paid' ? 'שולם' : 'ממתין'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <p className="text-gray-300 font-bold text-lg">אין תשלומים {filter !== 'all' ? 'במצב זה' : 'במערכת'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
