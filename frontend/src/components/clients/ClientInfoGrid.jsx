import React from 'react';

export const ClientInfoGrid = ({ client }) => {
  // פענוח נתוני ה-JSON מהשאלונים (ששמרנו בעמודת notes)
  let customData = {};
  try {
    customData = typeof client.notes === 'string' ? JSON.parse(client.notes) : client.notes || {};
  } catch (e) { customData = {}; }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full">
      <h3 className="text-xl font-black text-gray-900 mb-6">מידע מורחב ושאלונים</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(customData).length > 0 ? Object.entries(customData).map(([key, value]) => (
          <div key={key} className="border-r-4 border-yellow-400 pr-4 py-1">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{key}</p>
            <p className="font-bold text-gray-800 text-lg">{value || '-'}</p>
          </div>
        )) : (
          <div className="col-span-2 py-10 text-center text-gray-300 font-bold bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            טרם מולאו שאלונים עבור כלה זו
          </div>
        )}
      </div>
      
      <div className="mt-10 pt-8 border-t border-gray-50">
        <h4 className="text-sm font-black text-gray-400 mb-4 uppercase">הערות כלליות</h4>
        <div className="p-4 bg-gray-50 rounded-2xl text-gray-600 font-medium min-h-[100px]">
          {client.general_notes || 'אין הערות נוספות...'}
        </div>
      </div>
    </div>
  );
};
