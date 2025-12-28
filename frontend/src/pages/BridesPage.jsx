import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AddClientModal } from '../components/clients/AddClientModal';

export const BridesPage = ({ onSelectClient }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClients = () => {
    setLoading(true);
    api.get('/clients?entity_type=bride')
      .then(res => {
        setClients(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, []);

  return (
    <div className="animate-in fade-in duration-500 text-right">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black text-gray-900 mb-2">ניהול כלות</h2>
          <p className="text-gray-400 font-medium text-lg">מעקב לידים, סגירות ותאריכי אירועים.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-yellow-100 hover:scale-105 transition-transform"
        >
          + הוספת כלה חדשה
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 font-black text-gray-400 text-xs uppercase">שם הכלה</th>
              <th className="px-8 py-5 font-black text-gray-400 text-xs uppercase">טלפון</th>
              <th className="px-8 py-5 font-black text-gray-400 text-xs uppercase">סטטוס</th>
              <th className="px-8 py-5 font-black text-gray-400 text-xs uppercase">מקור הגעה</th>
              <th className="px-8 py-5 font-black text-gray-400 text-xs uppercase text-left">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => onSelectClient(client.id)}>
                <td className="px-8 py-6 font-bold text-gray-900">{client.full_name}</td>
                <td className="px-8 py-6 text-gray-500 font-medium">{client.phone}</td>
                <td className="px-8 py-6">
                  <span className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-black uppercase">
                    {client.status_name || 'חדש'}
                  </span>
                </td>
                <td className="px-8 py-6 text-gray-400 font-bold text-sm">{client.source || '-'}</td>
                <td className="px-8 py-6 text-left">
                   <button className="text-gray-900 bg-gray-100 px-4 py-2 rounded-xl text-sm font-black opacity-0 group-hover:opacity-100 transition-opacity">
                     צפייה בכרטיס
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && !loading && (
          <div className="py-20 text-center text-gray-300 font-bold">אין נתונים להצגה</div>
        )}
      </div>

      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchClients} 
      />
    </div>
  );
};
