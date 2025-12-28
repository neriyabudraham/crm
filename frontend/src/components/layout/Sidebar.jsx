import React from 'react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'brides', label: 'כלות ולידים', icon: '👰' },
    { id: 'courses', label: 'קורסים ותלמידות', icon: '🎓' },
    { id: 'payments', label: 'גבייה וכספים', icon: '💰' },
    { id: 'settings', label: 'הגדרות מערכת', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-white border-l border-gray-100 min-h-screen p-6 hidden md:block">
      <div className="mb-10 px-2">
        <h1 className="text-3xl font-black text-gray-900">Botomat<span className="text-accent">.</span></h1>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
              activeTab === item.id 
              ? 'bg-gray-900 text-white shadow-xl shadow-gray-200 scale-105' 
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
