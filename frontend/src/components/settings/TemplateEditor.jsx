import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import api from '../../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const ELEMENT_TYPES = [
  { type: 'signature', label: 'חתימה', icon: '✍️', color: '#3B82F6', defaultW: 150, defaultH: 60 },
  { type: 'date', label: 'תאריך', icon: '📅', color: '#10B981', defaultW: 120, defaultH: 25 },
  { type: 'time', label: 'שעה', icon: '🕐', color: '#06B6D4', defaultW: 80, defaultH: 25 },
  { type: 'checkbox', label: 'צ\'קבוקס', icon: '☑️', color: '#8B5CF6', defaultW: 20, defaultH: 20 },
  { type: 'text', label: 'שדה טקסט', icon: '📝', color: '#F59E0B', defaultW: 200, defaultH: 25 },
  { type: 'select', label: 'רשימה נפתחת', icon: '📋', color: '#EC4899', defaultW: 160, defaultH: 25 },
];

export const TemplateEditor = ({ template, onSave, onClose }) => {
  const [pages, setPages] = useState([]);
  const [elements, setElements] = useState(template.elements || []);
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [pdfDims, setPdfDims] = useState({ width: 0, height: 0 });
  const [dragNewType, setDragNewType] = useState(null);
  const containerRef = useRef(null);
  const dragPageRef = useRef(null);
  const selectedRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // טעינת PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const response = await fetch(`/${template.file_path}`);
        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageImages = [];
        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width; canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          pageImages.push({ dataUrl: canvas.toDataURL(), width: viewport.width, height: viewport.height, origW: viewport.width / 1.5, origH: viewport.height / 1.5 });
        }
        setPages(pageImages);
        if (pageImages[0]) setPdfDims({ width: pageImages[0].origW, height: pageImages[0].origH });
      } catch (err) { console.error('PDF load error:', err); }
    };
    loadPdf();
  }, [template]);

  // scroll to selected element
  useEffect(() => {
    if (selectedId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  const addElement = (type, x = 100, y = 100, page = 1) => {
    const config = ELEMENT_TYPES.find(t => t.type === type);
    const newEl = {
      id: Date.now(), type, page, x, y,
      width: config.defaultW, height: config.defaultH,
      label: config.label,
      placeholder: type === 'text' ? 'הזן טקסט...' : type === 'select' ? 'בחר...' : '',
      checkboxLabel: type === 'checkbox' ? 'אני מאשר/ת' : '',
      required: false,
      options: type === 'select' ? ['אפשרות 1', 'אפשרות 2'] : [],
      defaultValue: '',
      clientField: '',
      autoDate: false,
      dateRule: '', // '' | 'today' | '+30' | specific date
      defaultTime: '',
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    return newEl;
  };

  // --- גרירה רגילה ---
  const handleMouseDown = (e, el) => {
    e.preventDefault();
    setSelectedId(el.id);
    const pageDiv = e.currentTarget.parentElement;
    dragPageRef.current = pageDiv;
    const rect = pageDiv.getBoundingClientRect();
    const pageData = pages[el.page - 1];
    const realScale = pageData ? rect.width / pageData.origW : 1;
    setDragging(el.id);
    setDragOffset({ x: e.clientX - rect.left - (el.x * realScale), y: e.clientY - rect.top - (el.y * realScale) });
  };

  const handleResizeDown = (e, el) => {
    e.preventDefault(); e.stopPropagation();
    dragPageRef.current = e.currentTarget.closest('[data-page]');
    setResizing(el.id);
    setResizeStart({ x: e.clientX, y: e.clientY, w: el.width, h: el.height });
  };

  const handleMouseMove = useCallback((e) => {
    if (resizing) {
      const resizedEl = elements.find(el => el.id === resizing);
      if (!resizedEl || !dragPageRef.current) return;
      const pageData = pages[resizedEl.page - 1];
      if (!pageData) return;
      const realScale = dragPageRef.current.getBoundingClientRect().width / pageData.origW;
      setElements(prev => prev.map(el => el.id === resizing ? {
        ...el,
        width: Math.max(15, Math.round(resizeStart.w + (e.clientX - resizeStart.x) / realScale)),
        height: Math.max(10, Math.round(resizeStart.h + (e.clientY - resizeStart.y) / realScale))
      } : el));
      return;
    }
    if (!dragging || !dragPageRef.current) return;
    const rect = dragPageRef.current.getBoundingClientRect();
    const draggedEl = elements.find(el => el.id === dragging);
    if (!draggedEl) return;
    const pageData = pages[draggedEl.page - 1];
    if (!pageData) return;
    const realScale = rect.width / pageData.origW;
    setElements(prev => prev.map(el => el.id === dragging ? {
      ...el,
      x: Math.max(0, Math.round((e.clientX - rect.left - dragOffset.x) / realScale)),
      y: Math.max(0, Math.round((e.clientY - rect.top - dragOffset.y) / realScale))
    } : el));
  }, [dragging, resizing, dragOffset, resizeStart, elements, pages]);

  const handleMouseUp = useCallback(() => { setDragging(null); setResizing(null); }, []);

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  // --- Drop מסיידבר ל-PDF ---
  const handleDrop = (e, pageIdx) => {
    e.preventDefault();
    if (!dragNewType) return;
    const pageDiv = e.currentTarget;
    const rect = pageDiv.getBoundingClientRect();
    const pageData = pages[pageIdx];
    if (!pageData) return;
    const realScale = rect.width / pageData.origW;
    const x = Math.max(0, Math.round((e.clientX - rect.left) / realScale));
    const y = Math.max(0, Math.round((e.clientY - rect.top) / realScale));
    addElement(dragNewType, x, y, pageIdx + 1);
    setDragNewType(null);
  };

  // שמירה
  const handleSave = async () => {
    setSaving(true);
    const pdfElements = elements.map(el => ({ ...el, pdfY: pdfDims.height - el.y - el.height }));
    try {
      await api.patch(`/admin/templates/${template.id}`, {
        signature_positions: pdfElements.filter(e => e.type === 'signature'),
        elements: pdfElements
      });
      onSave();
    } catch (err) { alert('שגיאה בשמירה'); }
    finally { setSaving(false); }
  };

  const removeElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateElement = (id, field, value) => {
    setElements(elements.map(el => el.id === id ? { ...el, [field]: value } : el));
  };

  const selectedEl = elements.find(el => el.id === selectedId);
  const selectedConfig = selectedEl ? ELEMENT_TYPES.find(t => t.type === selectedEl.type) : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex" dir="rtl">
      {/* Sidebar */}
      <div className="w-80 bg-white h-full overflow-y-auto p-5 border-l border-gray-100 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-gray-900">עורך תבנית</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-900 text-xl font-bold">✕</button>
        </div>
        <p className="text-xs text-gray-400 font-bold mb-4">{template.name}</p>

        {/* כפתורי הוספה - ניתנים לגרירה */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {ELEMENT_TYPES.map(t => (
            <button
              key={t.type}
              draggable
              onDragStart={() => setDragNewType(t.type)}
              onDragEnd={() => setDragNewType(null)}
              onClick={() => addElement(t.type)}
              className="flex items-center gap-2 p-2 rounded-xl text-right font-bold text-[11px] border-2 border-gray-100 hover:border-accent/40 transition-all cursor-grab active:cursor-grabbing"
            >
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] flex-shrink-0" style={{ backgroundColor: t.color }}>{t.icon}</span>
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>

        {/* רשימת אלמנטים */}
        <div className="space-y-1 mb-4 flex-shrink-0">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{elements.length} אלמנטים</p>
          {elements.map(el => {
            const config = ELEMENT_TYPES.find(t => t.type === el.type);
            const isSelected = selectedId === el.id;
            return (
              <div
                key={el.id}
                onClick={() => setSelectedId(isSelected ? null : el.id)}
                className={`p-2 rounded-lg text-[11px] cursor-pointer transition-all flex justify-between items-center ${isSelected ? 'bg-accent/10 border-2 border-accent/30' : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'}`}
              >
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: config?.color }} />
                  {el.type === 'text' ? (el.placeholder || 'טקסט') : el.type === 'checkbox' ? (el.checkboxLabel || 'צ\'קבוקס') : config?.label}
                </span>
                <span className="text-[9px] text-gray-400">עמוד {el.page}</span>
              </div>
            );
          })}
        </div>

        {/* פאנל עריכה של אלמנט נבחר */}
        {selectedEl && (
          <div ref={selectedRef} className="bg-gray-50 rounded-xl p-4 space-y-3 border-2 border-accent/20 flex-shrink-0">
            <div className="flex justify-between items-center">
              <span className="font-black text-sm flex items-center gap-2" style={{ color: selectedConfig?.color }}>
                {selectedConfig?.icon} {selectedConfig?.label}
              </span>
              <button onClick={() => removeElement(selectedEl.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">מחק</button>
            </div>

            {selectedEl.type === 'checkbox' && (
              <input placeholder="טקסט ליד הצ'קבוקס" className="w-full p-2 rounded-lg text-xs outline-none bg-white" value={selectedEl.checkboxLabel || ''} onChange={e => updateElement(selectedEl.id, 'checkboxLabel', e.target.value)} />
            )}

            {(selectedEl.type === 'text' || selectedEl.type === 'select') && (
              <input placeholder="טקסט מנחה (placeholder)" className="w-full p-2 rounded-lg text-xs outline-none bg-white" value={selectedEl.placeholder || ''} onChange={e => updateElement(selectedEl.id, 'placeholder', e.target.value)} />
            )}

            {selectedEl.type === 'select' && (
              <input
                placeholder="אפשרויות (הפרד בפסיק, לחץ Enter לאישור)"
                className="w-full p-2 rounded-lg text-xs outline-none bg-white"
                defaultValue={(selectedEl.options || []).join(', ')}
                key={selectedEl.id + '_opts'}
                onBlur={e => updateElement(selectedEl.id, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } }}
              />
            )}

            {selectedEl.type === 'date' && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">מצב תאריך</label>
                  <select className="w-full p-2 rounded-lg text-xs outline-none bg-white" value={selectedEl.dateRule || ''} onChange={e => updateElement(selectedEl.id, 'dateRule', e.target.value)}>
                    <option value="">לבחירת הלקוח</option>
                    <option value="today">תאריך היום (אוטומטי, ללא עריכה)</option>
                    <option value="+7">+7 ימים מהיום</option>
                    <option value="+14">+14 ימים מהיום</option>
                    <option value="+30">+30 ימים מהיום</option>
                    <option value="+60">+60 ימים מהיום</option>
                    <option value="+90">+90 ימים מהיום</option>
                    <option value="specific">תאריך ספציפי</option>
                  </select>
                </div>
                {selectedEl.dateRule === 'specific' && (
                  <input type="date" className="w-full p-2 rounded-lg text-xs outline-none bg-white" value={selectedEl.defaultValue || ''} onChange={e => updateElement(selectedEl.id, 'defaultValue', e.target.value)} />
                )}
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 cursor-pointer">
                  <input type="checkbox" className="accent-green-500" checked={selectedEl.autoDate || false} onChange={e => updateElement(selectedEl.id, 'autoDate', e.target.checked)} />
                  ללא אפשרות עריכה
                </label>
              </>
            )}

            {selectedEl.type === 'time' && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">שעה ברירת מחדל</label>
                  <input type="time" className="w-full p-2 rounded-lg text-xs outline-none bg-white" value={selectedEl.defaultTime || ''} onChange={e => updateElement(selectedEl.id, 'defaultTime', e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 cursor-pointer">
                  <input type="checkbox" className="accent-cyan-500" checked={selectedEl.autoDate || false} onChange={e => updateElement(selectedEl.id, 'autoDate', e.target.checked)} />
                  ללא אפשרות עריכה
                </label>
              </>
            )}

            {(selectedEl.type === 'text' || selectedEl.type === 'select') && (
              <input placeholder="ערך ברירת מחדל" className="w-full p-2 rounded-lg text-xs outline-none bg-white" value={selectedEl.defaultValue || ''} onChange={e => updateElement(selectedEl.id, 'defaultValue', e.target.value)} />
            )}

            {(selectedEl.type === 'text' || selectedEl.type === 'select') && (
              <select className="w-full p-2 rounded-lg text-xs outline-none bg-white" value={selectedEl.clientField || ''} onChange={e => updateElement(selectedEl.id, 'clientField', e.target.value)}>
                <option value="">מילוי אוטומטי מ...</option>
                <option value="full_name">שם הלקוח</option>
                <option value="phone">טלפון</option>
                <option value="email">אימייל</option>
                <option value="source">מקור</option>
              </select>
            )}

            {selectedEl.type !== 'signature' && selectedEl.type !== 'date' && selectedEl.type !== 'time' && (
              <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 cursor-pointer">
                <input type="checkbox" className="accent-red-500" checked={selectedEl.required || false} onChange={e => updateElement(selectedEl.id, 'required', e.target.checked)} />
                שדה חובה
              </label>
            )}

            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div><label className="text-gray-400 font-bold">עמוד</label><input type="number" min="1" max={pages.length || 1} className="w-full p-1.5 bg-white rounded text-center font-bold" value={selectedEl.page} onChange={e => updateElement(selectedEl.id, 'page', parseInt(e.target.value) || 1)} /></div>
              <div><label className="text-gray-400 font-bold">X</label><input type="number" className="w-full p-1.5 bg-white rounded text-center font-bold" value={selectedEl.x} onChange={e => updateElement(selectedEl.id, 'x', parseInt(e.target.value) || 0)} /></div>
              <div><label className="text-gray-400 font-bold">רוחב</label><input type="number" className="w-full p-1.5 bg-white rounded text-center font-bold" value={selectedEl.width} onChange={e => updateElement(selectedEl.id, 'width', parseInt(e.target.value) || 20)} /></div>
              <div><label className="text-gray-400 font-bold">גובה</label><input type="number" className="w-full p-1.5 bg-white rounded text-center font-bold" value={selectedEl.height} onChange={e => updateElement(selectedEl.id, 'height', parseInt(e.target.value) || 10)} /></div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          {pages.length > 0 && <p className="text-xs text-gray-400 font-bold mb-3 text-center">{pages.length} עמודים</p>}
          <button onClick={handleSave} disabled={saving} className="w-full bg-green-500 text-white p-3 rounded-xl font-black shadow-lg disabled:opacity-50 hover:bg-green-600 transition-all">
            {saving ? 'שומר...' : 'שמור תבנית'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 bg-gray-800 overflow-auto p-8" onClick={() => setSelectedId(null)}>
        {pages.length > 0 ? (
          <div className="flex flex-col items-center gap-6" ref={containerRef}>
            {pages.map((page, pageIdx) => {
              const pageElements = elements.filter(el => el.page === pageIdx + 1);
              return (
                <div
                  key={pageIdx}
                  data-page={pageIdx}
                  className="relative bg-white shadow-2xl select-none"
                  style={{ width: page.width, maxWidth: '100%' }}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                  onDrop={e => handleDrop(e, pageIdx)}
                >
                  <div className="absolute -top-6 right-0 text-xs font-black text-gray-400">עמוד {pageIdx + 1}</div>
                  <img src={page.dataUrl} className="w-full pointer-events-none" alt="" draggable={false} />

                  {pageElements.map(el => {
                    const config = ELEMENT_TYPES.find(t => t.type === el.type);
                    const isSelected = selectedId === el.id;
                    return (
                      <div
                        key={el.id}
                        onMouseDown={e => { e.stopPropagation(); handleMouseDown(e, el); }}
                        onClick={e => { e.stopPropagation(); setSelectedId(el.id); }}
                        className={`absolute cursor-move border-2 rounded flex items-center justify-center select-none transition-shadow ${
                          isSelected ? 'border-solid shadow-lg z-50 ring-2 ring-offset-1' : 'border-dashed z-10 hover:shadow-md'
                        } ${dragging === el.id ? 'opacity-70' : ''}`}
                        style={{
                          left: (el.x / page.origW * 100) + '%',
                          top: (el.y / page.origH * 100) + '%',
                          width: (el.width / page.origW * 100) + '%',
                          height: (el.height / page.origH * 100) + '%',
                          borderColor: config?.color,
                          backgroundColor: config?.color + (isSelected ? '40' : '20'),
                          '--tw-ring-color': config?.color,
                        }}
                      >
                        <span className="text-[8px] font-black whitespace-nowrap overflow-hidden px-0.5" style={{ color: config?.color }}>
                          {config?.icon} {el.type === 'checkbox' ? (el.checkboxLabel || '') : el.type === 'text' ? (el.placeholder || '') : el.type === 'select' ? (el.placeholder || '') : el.type === 'time' ? (el.defaultTime || 'שעה') : config?.label}
                        </span>
                        <div
                          onMouseDown={e => handleResizeDown(e, el)}
                          className="absolute -bottom-1 -left-1 w-3 h-3 cursor-se-resize rounded-full opacity-60 hover:opacity-100 hover:scale-150 transition-all"
                          style={{ backgroundColor: config?.color }}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
