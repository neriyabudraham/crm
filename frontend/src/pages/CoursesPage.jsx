import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: '' });

  const loadCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadCourses(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/courses', newCourse);
    setNewCourse({ title: '', description: '', price: '' });
    setShowAddModal(false);
    loadCourses();
  };

  const handleDelete = async (id) => {
    if (window.confirm('האם את בטוחה שברצונך למחוק את הקורס?')) {
      await api.delete('/courses/' + id);
      loadCourses();
    }
  };

  return (
    <div className="animate-in fade-in duration-500 text-right" dir="rtl">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-4xl font-black text-gray-900 tracking-tighter italic">ניהול קורסים</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
        >
          + קורס חדש
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="h-48 bg-gray-100 relative overflow-hidden">
               {course.thumbnail_url ? (
                 <img src={course.thumbnail_url} className="w-full h-full object-cover" alt="" />
               ) : (
                 <div className="flex items-center justify-center h-full text-4xl">🎬</div>
               )}
               <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-1 rounded-full text-xs font-black shadow-sm">
                 ₪{course.price}
               </div>
            </div>
            <div className="p-8">
              <h3 className="text-xl font-black mb-2 text-gray-900">{course.title}</h3>
              <p className="text-gray-400 text-sm font-medium mb-6 line-clamp-2">{course.description}</p>
              <div className="flex justify-between items-center border-t pt-6 border-gray-50">
                <button className="text-accent font-black text-xs underline">ניהול רשומות</button>
                <button 
                  onClick={() => handleDelete(course.id)} 
                  className="text-red-300 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute left-8 top-8 text-gray-300 text-2xl">✕</button>
            <h2 className="text-3xl font-black mb-8 italic">הוספת קורס חדש</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                placeholder="שם הקורס" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
                onChange={e => setNewCourse({...newCourse, title: e.target.value})}
              />
              <textarea 
                placeholder="תיאור קצר" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold h-32"
                onChange={e => setNewCourse({...newCourse, description: e.target.value})}
              />
              <input 
                placeholder="מחיר" type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
                onChange={e => setNewCourse({...newCourse, price: e.target.value})}
              />
              <button className="w-full bg-gray-900 text-white p-5 rounded-2xl font-black text-xl shadow-lg mt-4">יצירת קורס</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
