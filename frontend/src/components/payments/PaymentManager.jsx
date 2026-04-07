import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const DEFAULT_METHODS = ['מזומן', 'העברה בנקאית', 'כרטיס אשראי', 'צ\'ק', 'ביט', 'פייבוקס', 'אחר'];

export const PaymentManager = ({ clientId, entityType }) => {
  const [payments, setPayments] = useState([]);
  const [showAdd, setShowAdd] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_METHODS);
  const [defaultAdvance, setDefaultAdvance] = useState('');

  // טפסים
  const [singleForm, setSingleForm] = useState({ amount: '', due_date: new Date().toISOString().split('T')[0], payment_method: '', notes: '' });
  const [advanceForm, setAdvanceForm] = useState({ amount: '', payment_method: '', notes: '' });
  const [scheduleForm, setScheduleForm] = useState({ totalAmount: '', installments: 3, startDate: new Date().toISOString().split('T')[0] });
  const [debtForm, setDebtForm] = useState({ amount: '', due_date: '', installments: 1, notes: '' });

  const today = new Date().toISOString().split('T')[0];
  const fetchPayments = () => api.get(`/admin/payments/client/${clientId}`).then(res => setPayments(res.data || []));
  useEffect(() => {
    fetchPayments();
    api.get('/admin/settings/payment_methods').then(res => { if (res.data?.length) setPaymentMethods(res.data); }).catch(() => {});
    const advKey = entityType ? `${entityType}_default_advance` : 'default_advance';
    const dealKey = entityType ? `${entityType}_default_deal` : 'default_deal';
    api.get(`/admin/settings/${advKey}`).then(res => { if (res.data) setDefaultAdvance(String(res.data)); }).catch(() => {});
    api.get(`/admin/settings/${dealKey}`).then(res => {
      if (res.data) setScheduleForm(f => ({ ...f, totalAmount: f.totalAmount || String(res.data) }));
    }).catch(() => {});
  }, [clientId]);

  const addPayment = async (amount, due_date, type, method, notes, status) => {
    await api.post('/admin/payments/schedule', {
      clientId,
      totalAmount: parseFloat(amount),
      installments: 1,
      startDate: due_date || new Date().toISOString().split('T')[0],
      payment_type: type,
      payment_method: method,
      notes,
      status: status || 'pending'
    });
    fetchPayments();
  };

  const handleSingle = async () => {
    if (!singleForm.amount) return;
    await addPayment(singleForm.amount, singleForm.due_date, 'regular', singleForm.payment_method, singleForm.notes);
    setSingleForm({ amount: '', due_date: '', payment_method: 'מזומן', notes: '' });
    setShowAdd(null);
  };

  const handleAdvance = async () => {
    if (!advanceForm.amount) return;
    await addPayment(advanceForm.amount, new Date().toISOString().split('T')[0], 'advance', advanceForm.payment_method, advanceForm.notes, 'paid');
    setAdvanceForm({ amount: '', payment_method: 'מזומן', notes: '' });
    setShowAdd(null);
  };

  const handleSchedule = async () => {
    if (!scheduleForm.totalAmount || !scheduleForm.installments) return;
    await api.post('/admin/payments/schedule', {
      clientId,
      totalAmount: parseFloat(scheduleForm.totalAmount),
      installments: parseInt(scheduleForm.installments),
      startDate: scheduleForm.startDate
    });
    setScheduleForm({ totalAmount: '', installments: 3, startDate: new Date().toISOString().split('T')[0] });
    setShowAdd(null);
    fetchPayments();
  };

  const handleDebt = async () => {
    if (!debtForm.amount) return;
    if (debtForm.installments > 1) {
      await api.post('/admin/payments/schedule', {
        clientId,
        totalAmount: parseFloat(debtForm.amount),
        installments: parseInt(debtForm.installments),
        startDate: debtForm.due_date || new Date().toISOString().split('T')[0],
        payment_type: 'debt',
        notes: debtForm.notes
      });
    } else {
      await addPayment(debtForm.amount, debtForm.due_date, 'debt', '', debtForm.notes);
    }
    setDebtForm({ amount: '', due_date: '', installments: 1, notes: '' });
    setShowAdd(null);
    fetchPayments();
  };

  const toggleStatus = async (id, current) => {
    await api.patch(`/admin/payments/${id}`, { status: current === 'paid' ? 'pending' : 'paid' });
    fetchPayments();
  };

  const updateMethod = async (id, method) => {
    await api.patch(`/admin/payments/${id}`, { payment_method: method });
    fetchPayments();
  };

  const deletePayment = async (id) => {
    await api.delete(`/admin/payments/${id}`);
    fetchPayments();
  };

  const totalAmount = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  const typeLabel = { regular: '', advance: 'מקדמה', debt: 'חוב' };
  const typeColor = { advance: 'bg-blue-100 text-blue-700', debt: 'bg-red-100 text-red-700' };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-gray-900">תשלומים</h3>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: 'advance', label: 'מקדמה', color: 'bg-blue-500' },
            { id: 'single', label: 'תשלום', color: 'bg-gray-900' },
            { id: 'schedule', label: 'פריסה', color: 'bg-gray-900' },
            { id: 'debt', label: 'חוב', color: 'bg-red-500' },
          ].map(btn => (
            <button key={btn.id} onClick={() => { const next = showAdd === btn.id ? null : btn.id; setShowAdd(next); if (next === 'advance' && defaultAdvance) setAdvanceForm(f => ({ ...f, amount: f.amount || defaultAdvance })); }}
              className={`${showAdd === btn.id ? btn.color + ' text-white' : 'bg-gray-100 text-gray-600'} px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all`}>
              + {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* סיכום */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 p-3 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 font-bold">סה"כ</p>
            <p className="font-black text-gray-900">{totalAmount.toLocaleString()} ₪</p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl text-center">
            <p className="text-[10px] text-green-600 font-bold">שולם</p>
            <p className="font-black text-green-600">{paidAmount.toLocaleString()} ₪</p>
          </div>
          <div className={`p-3 rounded-xl text-center ${pendingAmount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className={`text-[10px] font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>נותר</p>
            <p className={`font-black ${pendingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{pendingAmount.toLocaleString()} ₪</p>
          </div>
        </div>
      )}

      {/* מקדמה */}
      {showAdd === 'advance' && (
        <div className="bg-blue-50 p-5 rounded-2xl mb-6 space-y-3 border-2 border-blue-100">
          <h4 className="font-black text-sm text-blue-700">תשלום מקדמה (נרשם כשולם)</h4>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="סכום" className="p-3 rounded-xl outline-none font-bold bg-white" value={advanceForm.amount} onChange={e => setAdvanceForm({ ...advanceForm, amount: e.target.value })} />
            <select className="p-3 rounded-xl outline-none font-bold bg-white" value={advanceForm.payment_method} onChange={e => setAdvanceForm({ ...advanceForm, payment_method: e.target.value })}>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button onClick={handleAdvance} className="w-full bg-blue-500 text-white p-3 rounded-xl font-bold">הוסף מקדמה</button>
        </div>
      )}

      {/* תשלום בודד */}
      {showAdd === 'single' && (
        <div className="bg-gray-50 p-5 rounded-2xl mb-6 space-y-3">
          <h4 className="font-black text-sm text-gray-700">תשלום בודד</h4>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" placeholder="סכום" className="p-3 rounded-xl outline-none font-bold bg-white" value={singleForm.amount} onChange={e => setSingleForm({ ...singleForm, amount: e.target.value })} />
            <input type="date" className="p-3 rounded-xl outline-none font-bold bg-white" value={singleForm.due_date} onChange={e => setSingleForm({ ...singleForm, due_date: e.target.value })} />
            <select className="p-3 rounded-xl outline-none font-bold bg-white" value={singleForm.payment_method} onChange={e => setSingleForm({ ...singleForm, payment_method: e.target.value })}>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button onClick={handleSingle} className="w-full bg-gray-900 text-white p-3 rounded-xl font-bold">הוסף</button>
        </div>
      )}

      {/* פריסה */}
      {showAdd === 'schedule' && (
        <div className="bg-gray-50 p-5 rounded-2xl mb-6 space-y-3">
          <h4 className="font-black text-sm text-gray-700">פריסת תשלומים</h4>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] font-bold text-gray-400">סכום כולל</label><input type="number" className="w-full p-3 rounded-xl outline-none font-bold bg-white" value={scheduleForm.totalAmount} onChange={e => setScheduleForm({ ...scheduleForm, totalAmount: e.target.value })} /></div>
            <div><label className="text-[10px] font-bold text-gray-400">תשלומים</label><input type="number" min="1" max="36" className="w-full p-3 rounded-xl outline-none font-bold bg-white" value={scheduleForm.installments} onChange={e => setScheduleForm({ ...scheduleForm, installments: e.target.value })} /></div>
            <div><label className="text-[10px] font-bold text-gray-400">תאריך תחילה</label><input type="date" className="w-full p-3 rounded-xl outline-none font-bold bg-white" value={scheduleForm.startDate} onChange={e => setScheduleForm({ ...scheduleForm, startDate: e.target.value })} /></div>
          </div>
          {scheduleForm.totalAmount && scheduleForm.installments > 0 && (
            <p className="text-xs text-gray-500 font-bold text-center">{scheduleForm.installments} × {Math.round(parseFloat(scheduleForm.totalAmount) / parseInt(scheduleForm.installments))} ₪</p>
          )}
          <button onClick={handleSchedule} className="w-full bg-gray-900 text-white p-3 rounded-xl font-bold">צור פריסה</button>
        </div>
      )}

      {/* חוב */}
      {showAdd === 'debt' && (
        <div className="bg-red-50 p-5 rounded-2xl mb-6 space-y-3 border-2 border-red-100">
          <h4 className="font-black text-sm text-red-700">רישום חוב עתידי</h4>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" placeholder="סכום" className="p-3 rounded-xl outline-none font-bold bg-white" value={debtForm.amount} onChange={e => setDebtForm({ ...debtForm, amount: e.target.value })} />
            <input type="date" className="p-3 rounded-xl outline-none font-bold bg-white" value={debtForm.due_date} onChange={e => setDebtForm({ ...debtForm, due_date: e.target.value })} />
            <div><label className="text-[10px] font-bold text-gray-400">פריסה</label><input type="number" min="1" max="36" placeholder="1" className="w-full p-3 rounded-xl outline-none font-bold bg-white" value={debtForm.installments} onChange={e => setDebtForm({ ...debtForm, installments: e.target.value })} /></div>
          </div>
          <input placeholder="הערות" className="w-full p-3 rounded-xl outline-none font-bold bg-white" value={debtForm.notes} onChange={e => setDebtForm({ ...debtForm, notes: e.target.value })} />
          <button onClick={handleDebt} className="w-full bg-red-500 text-white p-3 rounded-xl font-bold">רשום חוב</button>
        </div>
      )}

      {/* רשימה */}
      <div className="space-y-2">
        {payments.map((p, idx) => (
          <div key={p.id} className="group flex items-center justify-between p-3 rounded-xl border-2 border-gray-50 hover:border-gray-200 transition-all bg-white">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs ${p.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                {idx + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black text-gray-900">{parseFloat(p.amount).toLocaleString()} ₪</p>
                  {p.payment_type && typeLabel[p.payment_type] && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeColor[p.payment_type] || ''}`}>{typeLabel[p.payment_type]}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  {p.due_date && <span>{new Date(p.due_date).toLocaleDateString('he-IL')}</span>}
                  {p.payment_method && <span>• {p.payment_method}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {p.status !== 'paid' && (
                <select className="text-[10px] p-1 rounded bg-gray-50 outline-none font-bold" value={p.payment_method || ''} onChange={e => updateMethod(p.id, e.target.value)}>
                  <option value="">צורת תשלום</option>
                  {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
              <button onClick={() => toggleStatus(p.id, p.status)}
                className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all ${
                  p.status === 'paid' ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-green-400'
                }`}>
                {p.status === 'paid' ? 'שולם' : 'סמן'}
              </button>
              <button onClick={() => deletePayment(p.id)} className="text-gray-300 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100">✕</button>
            </div>
          </div>
        ))}
        {payments.length === 0 && showAdd === null && (
          <div className="py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
            <p className="text-gray-300 font-bold">טרם הוגדרו תשלומים</p>
          </div>
        )}
      </div>
    </div>
  );
};
