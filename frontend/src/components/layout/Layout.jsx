import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { name: '👰 ניהול כלות', path: '/brides' },
    { name: '🎬 קורסים', path: '/courses' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-right font-sans" dir="rtl">
      {/* Sidebar */}
      <div className="w-72 bg-white border-l border-gray-100 p-10 flex flex-col shadow-xl z-20 relative">
        <h1 className="text-3xl font-black mb-12 italic tracking-tighter text-gray-900">
          BOTOMAT <span className="text-accent underline">CRM</span>
        </h1>
        <nav className="flex-1 space-y-3">
          {menuItems.map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 p-5 rounded-[2rem] font-black transition-all hover:scale-[1.02] ${
                location.pathname.startsWith(item.path) 
                ? 'bg-gray-900 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <button 
          onClick={handleLogout} 
          className="p-5 text-red-400 font-black hover:bg-red-50 rounded-[2rem] transition-all flex items-center justify-center gap-2 border-2 border-transparent hover:border-red-100"
        >
          התנתקות ✕
        </button>
      </div>
      {/* Content */}
      <main className="flex-1 p-16 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
