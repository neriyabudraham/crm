import React from 'react';

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, count = 1 }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 italic">!</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">בטוחה שברצונך למחוק?</h2>
        <p className="text-gray-400 font-medium mb-8">פעולה זו תמחק {count === 1 ? 'ליד אחד' : count + ' לידים'} לצמיתות ולא ניתן יהיה לשחזר.</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full bg-red-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-100 hover:bg-red-600 transition-all">כן, למחוק לצמיתות</button>
          <button onClick={onClose} className="w-full bg-gray-50 text-gray-400 py-4 rounded-2xl font-black hover:bg-gray-100 transition-all">ביטול</button>
        </div>
      </div>
    </div>
  );
};
