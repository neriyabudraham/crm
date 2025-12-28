import React, { useState } from 'react';

export const ColumnManager = ({ allColumns, visibleColumns, setVisibleColumns }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border-2 border-gray-100 px-4 py-3 rounded-2xl font-black text-gray-600 hover:border-accent hover:text-gray-900 transition-all shadow-sm shadow-gray-100"
      >
        <span className="text-lg">⚙️</span>
        <span className="text-xs">ניהול עמודות</span>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 mt-3 w-64 bg-white border border-gray-100 rounded-[2rem] shadow-2xl z-[110] p-6 animate-in fade-in zoom-in duration-200">
            <h4 className="text-[11px] font-black text-gray-400 uppercase mb-4 tracking-widest border-b pb-2">בחירת עמודות לתצוגה</h4>
            <div className="space-y-3">
              {allColumns.map(col => (
                <label key={col.id} className="flex items-center justify-between cursor-pointer group p-1 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{col.label}</span>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-accent cursor-pointer"
                    checked={visibleColumns.includes(col.id)}
                    onChange={() => {
                      if (visibleColumns.includes(col.id)) {
                        if (visibleColumns.length > 1) setVisibleColumns(visibleColumns.filter(c => c !== col.id));
                      } else {
                        setVisibleColumns([...visibleColumns, col.id]);
                      }
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
