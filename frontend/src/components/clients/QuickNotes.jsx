import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import _ from 'lodash';

export const QuickNotes = ({ clientId, initialNotes }) => {
  const [notes, setNotes] = useState(initialNotes || '');
  const [status, setStatus] = useState('');

  const debouncedSave = useCallback(
    _.debounce(async (val) => {
      setStatus('שומר...');
      try {
        await api.patch(`/clients/${clientId}`, { general_notes: val });
        setStatus('נשמר');
        setTimeout(() => setStatus(''), 2000);
      } catch (err) {
        setStatus('שגיאה בשמירה');
      }
    }, 800),
    [clientId]
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    debouncedSave(val);
  };

  return (
    <div className="relative">
      <textarea
        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-yellow-400 rounded-2xl h-40 outline-none font-medium resize-none transition-all text-gray-700"
        value={notes}
        onChange={handleChange}
        placeholder="כתבי כאן הערות עבודה..."
      />
      <div className="absolute bottom-3 left-4 text-[10px] font-black text-gray-300 uppercase">
        {status}
      </div>
    </div>
  );
};
