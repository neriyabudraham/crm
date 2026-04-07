import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { AddClientModal } from '../components/clients/AddClientModal';

export const CoursesPage = ({ onSelectClient }) => {
  const [clients, setClients] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: '' });
  const [enrollModal, setEnrollModal] = useState(null);
  const [enrollCourse, setEnrollCourse] = useState('');
  const [enrollPrice, setEnrollPrice] = useState('');
  const [statusColors, setStatusColors] = useState({});
  const [statusList, setStatusList] = useState([]);

  const fetchData = async () => {
    const [c, co] = await Promise.all([
      api.get('/clients?entity_type=course'),
      api.get('/courses')
    ]);
    setClients(c.data || []);
    setCourses(co.data || []);
  };

  useEffect(() => {
    fetchData();
    api.get('/admin/settings/course_statuses').then(res => {
      const data = res.data || [];
      const map = {}, names = [];
      data.forEach(s => { if (s.name) { map[s.name] = s.color; names.push(s.name); } else names.push(s); });
      setStatusColors(map);
      setStatusList(names);
    });
  }, []);

  const processedClients = useMemo(() => {
    return clients.filter(c =>
      (statusFilter === 'all' || c.status_name === statusFilter) &&
      (c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm))
    );
  }, [clients, searchTerm, statusFilter]);

  const handleAddCourse = async () => {
    if (!newCourse.title) return;
    await api.post('/courses', newCourse);
    setNewCourse({ title: '', description: '', price: '' });
    setShowCourseForm(false);
    fetchData();
  };

  const handleEnroll = async () => {
    if (!enrollModal || !enrollCourse) return;
    await api.post('/courses/enroll', {
      client_id: enrollModal,
      course_id: parseInt(enrollCourse),
      custom_price: enrollPrice ? parseFloat(enrollPrice) : null
    });
    setEnrollModal(null);
    setEnrollCourse('');
    setEnrollPrice('');
    fetchData();
  };

  return (
    <div className="animate-in fade-in duration-500 text-right">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">קורסים ותלמידות</h2>
          <div className="flex gap-3 mt-4">
            <input type="text" placeholder="חיפוש לפי שם או טלפון..." className="p-3 bg-white border border-gray-100 rounded-2xl text-sm w-64 outline-none focus:border-accent shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select className="p-3 bg-white border border-gray-100 rounded-2xl text-sm outline-none shadow-sm font-bold" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">כל הסטטוסים</option>
              {statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCourseForm(!showCourseForm)} className="bg-white border border-gray-100 text-gray-600 px-5 py-3 rounded-2xl font-bold text-sm hover:border-accent transition-all">
            ניהול קורסים
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">
            + תלמידה חדשה
          </button>
        </div>
      </div>

      {/* ניהול קורסים */}
      {showCourseForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h3 className="font-black text-lg mb-4">קורסים קיימים</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {courses.map(c => (
              <div key={c.id} className="bg-gray-50 px-4 py-3 rounded-xl flex items-center gap-3">
                <div>
                  <span className="font-bold text-sm">{c.title}</span>
                  {c.price > 0 && <span className="text-[10px] text-gray-400 mr-2">({c.price} ₪)</span>}
                </div>
                <button onClick={async () => { if (confirm('למחוק?')) { await api.delete(`/courses/${c.id}`); fetchData(); } }} className="text-red-400 text-xs hover:text-red-600">✕</button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="שם הקורס" className="p-3 rounded-xl outline-none font-bold bg-gray-50" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} />
            <input placeholder="תיאור" className="p-3 rounded-xl outline-none font-bold bg-gray-50" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} />
            <div className="flex gap-2">
              <input type="number" placeholder="מחיר בסיס" className="flex-1 p-3 rounded-xl outline-none font-bold bg-gray-50" value={newCourse.price} onChange={e => setNewCourse({ ...newCourse, price: e.target.value })} />
              <button onClick={handleAddCourse} className="bg-gray-900 text-white px-4 rounded-xl font-bold">הוסף</button>
            </div>
          </div>
        </div>
      )}

      {/* טבלת תלמידות */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        {processedClients.length > 0 ? (
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-black tracking-widest uppercase">
              <tr>
                <th className="px-6 py-5">שם</th>
                <th className="px-6 py-5">טלפון</th>
                <th className="px-6 py-5">סטטוס</th>
                <th className="px-6 py-5">מקור</th>
                <th className="px-6 py-5">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processedClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors">
                  <td className="px-6 py-5 font-bold text-gray-900" onClick={() => onSelectClient?.(client.id)}>{client.full_name}</td>
                  <td className="px-6 py-5 text-gray-500">{client.phone}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black text-white" style={{ backgroundColor: statusColors[client.status_name] || '#9CA3AF' }}>
                      {client.status_name}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-gray-400 text-sm font-bold">{client.source}</td>
                  <td className="px-6 py-5">
                    <button onClick={() => { setEnrollModal(client.id); if (courses[0]) setEnrollCourse(courses[0].id.toString()); }}
                      className="text-accent font-bold text-xs hover:underline">
                      שייך לקורס
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">🎓</p>
            <p className="text-gray-400 font-bold text-lg mb-2">
              {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'עדיין אין תלמידות במערכת'}
            </p>
            <p className="text-gray-300 text-sm">לחץ על "+ תלמידה חדשה"</p>
          </div>
        )}
      </div>

      {/* Modal שיוך לקורס */}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8">
            <h2 className="text-2xl font-black mb-6">שיוך לקורס</h2>
            <div className="space-y-4">
              <select className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none" value={enrollCourse} onChange={e => { setEnrollCourse(e.target.value); const c = courses.find(x => x.id === parseInt(e.target.value)); if (c) setEnrollPrice(c.price?.toString() || ''); }}>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.price} ₪)</option>)}
              </select>
              <div>
                <label className="text-xs font-bold text-gray-400 mr-1">מחיר אישי (ניתן לשנות)</label>
                <input type="number" placeholder="מחיר" className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none" value={enrollPrice} onChange={e => setEnrollPrice(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleEnroll} className="flex-1 bg-gray-900 text-white p-4 rounded-xl font-black">שייך</button>
                <button onClick={() => setEnrollModal(null)} className="text-gray-400 font-bold px-4">ביטול</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchData} entityType="course" />
    </div>
  );
};
