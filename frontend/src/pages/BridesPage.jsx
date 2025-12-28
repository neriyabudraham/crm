import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { AddClientModal } from '../components/clients/AddClientModal';
import { SystemSettingsModal } from '../components/settings/SystemSettingsModal';

export const BridesPage = ({ onSelectClient }) => {
  const [clients, setClients] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const allColumns = [
    { id: 'full_name', label: 'שם הכלה' },
    { id: 'phone', label: 'טלפון' },
    { id: 'status_name', label: 'סטטוס' },
    { id: 'source', label: 'מקור' },
    { id: 'created_at', label: 'תאריך הצטרפות' }
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('bride_columns_view');
    return saved ? JSON.parse(saved) : ['full_name', 'phone', 'status_name', 'source'];
  });

  useEffect(() => {
    localStorage.setItem('bride_columns_view', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const fetchClients = () => api.get('/clients?entity_type=bride').then(res => setClients(res.data));
  useEffect(() => { fetchClients(); }, []);

  const statuses = useMemo(() => ['all', ...new Set(clients.map(c => c.status_name).filter(Boolean))], [clients]);

  const processedClients = useMemo(() => {
    let result = clients.filter(c => 
      (statusFilter === 'all' || c.status_name === statusFilter) &&
      (c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm))
    );
    result.sort((a, b) => {
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [clients, searchTerm, statusFilter, sortConfig]);

  return (
    <div className="animate-in fade-in duration-500 text-right">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">ניהול כלות</h2>
          <div className="flex gap-3 mt-4">
             <input 
               type="text" 
               placeholder="חיפוש לפי שם או טלפון..." 
               className="p-3 bg-white border border-gray-100 rounded-2xl text-sm w-64 outline-none focus:border-accent shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <select 
               className="p-3 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:border-accent shadow-sm font-bold"
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
             >
               <option value="all">כל הסטטוסים</option>
               {statuses.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-accent shadow-sm transition-all font-bold">⚙️ הגדרות</button>
          <button onClick={() => setIsModalOpen(true)} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">+ כלה חדשה</button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-black tracking-widest uppercase">
            <tr>
              {allColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
                <th key={col.id} onClick={() => {
                  let dir = 'asc';
                  if (sortConfig.key === col.id && sortConfig.direction === 'asc') dir = 'desc';
                  setSortConfig({ key: col.id, direction: dir });
                }} className="px-6 py-6 cursor-pointer hover:text-gray-900 transition-colors">
                  {col.label} {sortConfig.key === col.id ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {processedClients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => onSelectClient(client.id)}>
                {visibleColumns.includes('full_name') && <td className="px-6 py-6 font-bold text-gray-900">{client.full_name}</td>}
                {visibleColumns.includes('phone') && <td className="px-6 py-6 text-gray-500 font-medium">{client.phone}</td>}
                {visibleColumns.includes('status_name') && <td className="px-6 py-6"><span className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-[10px] font-black">{client.status_name}</span></td>}
                {visibleColumns.includes('source') && <td className="px-6 py-6 text-gray-400 text-sm font-bold">{client.source}</td>}
                {visibleColumns.includes('created_at') && <td className="px-6 py-6 text-gray-400 text-xs">{new Date(client.created_at).toLocaleDateString('he-IL')}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SystemSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} allColumns={allColumns} visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchClients} />
    </div>
  );
};
