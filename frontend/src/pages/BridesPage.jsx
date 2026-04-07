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
  const [statusColors, setStatusColors] = useState({});
  const [statusList, setStatusList] = useState([]);

  const allColumns = [
    { id: 'full_name', label: 'שם' },
    { id: 'phone', label: 'טלפון' },
    { id: 'status_name', label: 'סטטוס' },
    { id: 'source', label: 'מקור' },
    { id: 'created_at', label: 'תאריך' }
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('bride_columns_view');
    return saved ? JSON.parse(saved) : ['full_name', 'phone', 'status_name', 'source'];
  });

  useEffect(() => {
    localStorage.setItem('bride_columns_view', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const fetchClients = () => api.get('/clients?entity_type=bride').then(res => setClients(res.data));

  useEffect(() => {
    fetchClients();
    api.get('/admin/settings/client_statuses').then(res => {
      const data = res.data || [];
      const map = {};
      const names = [];
      data.forEach(s => {
        if (s.name) { map[s.name] = s.color; names.push(s.name); }
        else { names.push(s); }
      });
      setStatusColors(map);
      setStatusList(names);
    });
  }, []);

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
              {statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-accent shadow-sm transition-all font-bold">הגדרות</button>
          <button onClick={() => setIsModalOpen(true)} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">+ ליד חדש</button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        {processedClients.length > 0 ? (
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
                <tr key={client.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => onSelectClient(client.id)}>
                  {visibleColumns.includes('full_name') && <td className="px-6 py-5 font-bold text-gray-900">{client.full_name}</td>}
                  {visibleColumns.includes('phone') && <td className="px-6 py-5 text-gray-500 font-medium">{client.phone}</td>}
                  {visibleColumns.includes('status_name') && (
                    <td className="px-6 py-5">
                      <span className="px-4 py-1.5 rounded-full text-[10px] font-black text-white" style={{ backgroundColor: statusColors[client.status_name] || '#9CA3AF' }}>
                        {client.status_name}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('source') && <td className="px-6 py-5 text-gray-400 text-sm font-bold">{client.source}</td>}
                  {visibleColumns.includes('created_at') && <td className="px-6 py-5 text-gray-400 text-xs">{new Date(client.created_at).toLocaleDateString('he-IL')}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-400 font-bold text-lg mb-2">
              {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'עדיין אין לידים במערכת'}
            </p>
            <p className="text-gray-300 text-sm">
              {searchTerm || statusFilter !== 'all' ? 'נסה לשנות את החיפוש או הסינון' : 'לחץ על "+ ליד חדש" כדי להוסיף את הראשון'}
            </p>
          </div>
        )}
      </div>

      <SystemSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} allColumns={allColumns} visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchClients} />
    </div>
  );
};
