import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import api from '../services/api';
import { useDialog } from '../components/ui/Dialog';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const SigningPage = ({ token }) => {
  const { toast } = useDialog();
  const [session, setSession] = useState(null);
  const [elements, setElements] = useState([]);
  const [error, setError] = useState(null);
  const [signed, setSigned] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [signing, setSigning] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [formData, setFormData] = useState({});
  const [pages, setPages] = useState([]);
  const [signingElId, setSigningElId] = useState(null);
  const [signatures, setSignatures] = useState({});
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    api.get(`/signing/session/${token}`)
      .then(res => {
        setSession(res.data);
        fetch(`/api/signing/session/${token}/pdf`)
          .then(r => r.arrayBuffer())
          .then(async buf => {
            const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
            const imgs = [];
            for (let i = 0; i < pdf.numPages; i++) {
              const page = await pdf.getPage(i + 1);
              const vp = page.getViewport({ scale: 2 });
              const canvas = document.createElement('canvas');
              canvas.width = vp.width; canvas.height = vp.height;
              await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
              imgs.push({ dataUrl: canvas.toDataURL(), width: vp.width, height: vp.height, origW: vp.width / 2, origH: vp.height / 2 });
            }
            setPages(imgs);
          }).catch(err => console.error('PDF load:', err));
      })
      .catch(err => {
        if (err.response?.data?.signed) setAlreadySigned(true);
        else setError('הקישור לא תקין או שפג תוקפו');
      });
    api.get(`/signing/session/${token}/elements`)
      .then(res => {
        const els = res.data || [];
        setElements(els);
      })
      .catch(() => {});
  }, [token]);

  // אתחול formData עם ערכי ברירת מחדל ומילוי אוטומטי מפרטי הלקוח
  useEffect(() => {
    if (!session || elements.length === 0) return;
    const clientData = { full_name: session.client_name, phone: session.client_phone, email: session.client_email, source: session.client_source };
    const defaults = {};
    const calcDate = (rule) => {
      const d = new Date();
      if (!rule || rule === 'today') return d.toISOString().split('T')[0];
      if (rule === 'specific') return null; // uses defaultValue
      const match = rule.match(/^\+(\d+)$/);
      if (match) { d.setDate(d.getDate() + parseInt(match[1])); return d.toISOString().split('T')[0]; }
      return d.toISOString().split('T')[0];
    };

    elements.forEach(el => {
      if (el.type === 'date') {
        if (el.dateRule === 'specific') defaults[el.id] = el.defaultValue || new Date().toISOString().split('T')[0];
        else defaults[el.id] = calcDate(el.dateRule);
      } else if (el.type === 'time') {
        defaults[el.id] = el.defaultTime || '';
      } else if (el.clientField && clientData[el.clientField]) {
        defaults[el.id] = clientData[el.clientField];
      } else if (el.defaultValue) {
        defaults[el.id] = el.defaultValue;
      }
    });
    if (Object.keys(defaults).length > 0) {
      setFormData(prev => ({ ...defaults, ...prev }));
    }
  }, [session, elements]);

  // --- Canvas drawing ---
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
  };
  const startDraw = (e) => { e.preventDefault(); isDrawing.current = true; const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); };
  const draw = (e) => { e.preventDefault(); if (!isDrawing.current) return; const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
  const stopDraw = () => { isDrawing.current = false; };
  const clearCanvas = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = !imageData.data.some((pixel, i) => i % 4 === 3 && pixel > 0);
    if (isEmpty) { toast.warning('אנא חתום לפני האישור'); return; }
    const dataUrl = canvas.toDataURL('image/png');
    // שמור חתימה לכל שדות חתימה (חתימה אחת משותפת)
    const sigEls = elements.filter(e => e.type === 'signature');
    const newSigs = { ...signatures };
    sigEls.forEach(el => { newSigs[el.id] = dataUrl; });
    setSignatures(newSigs);
    setSigningElId(null);
  };

  const handleSubmit = async () => {
    const sigEls = elements.filter(e => e.type === 'signature');
    if (sigEls.length > 0 && !signatures[sigEls[0].id]) {
      toast.warning('אנא חתום על המסמך לפני השליחה');
      return;
    }
    // בדיקת שדות חובה
    for (const el of elements) {
      if (el.required && (el.type === 'text' || el.type === 'select' || el.type === 'date')) {
        if (!formData[el.id] || !formData[el.id].toString().trim()) {
          toast.warning(`יש למלא את השדה: ${el.placeholder || el.label || 'שדה חובה'}`);
          return;
        }
      }
      if (el.required && el.type === 'checkbox' && !formData[el.id]) {
        toast.warning(`יש לסמן: ${el.checkboxLabel || 'שדה חובה'}`);
        return;
      }
    }
    setSigning(true);
    try {
      const signatureBase64 = sigEls.length > 0 ? signatures[sigEls[0].id] : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const res = await api.post(`/signing/session/${token}/sign`, { signatureBase64, formData });
      setDownloadUrl(res.data.downloadUrl);
      setSigned(true);
    } catch (err) {
      toast.error('שגיאה: ' + (err.response?.data?.error || err.message));
    } finally { setSigning(false); }
  };

  const downloadFile = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signed_document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- Status screens ---
  if (alreadySigned) return <StatusScreen icon="✅" title="המסמך כבר נחתם" />;
  if (error) return <StatusScreen icon="❌" title={error} />;
  if (!session) return <LoadingScreen />;

  if (signed) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">נחתם בהצלחה!</h1>
        <p className="text-gray-400 font-bold mb-8">המסמך נחתם ונשמר במערכת.</p>
        {downloadUrl && (
          <button onClick={() => downloadFile(downloadUrl)} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all">
            הורד מסמך חתום (PDF)
          </button>
        )}
      </div>
    </div>
  );

  // --- Main: PDF with interactive elements + signing overlay ---
  return (
    <>
    {signingElId !== null && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">חתימה דיגיטלית</h2>
          <p className="text-gray-400 text-sm font-bold text-center mb-6">חתום באצבע או בעכבר</p>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden bg-gray-50 mb-4">
            <canvas ref={canvasRef} width={600} height={200} className="w-full h-44 cursor-crosshair touch-none bg-white"
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={saveSignature} className="flex-1 bg-gray-900 text-white p-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all">אישור חתימה</button>
            <button onClick={clearCanvas} className="bg-gray-100 text-gray-500 px-6 p-4 rounded-2xl font-bold">נקה</button>
            <button onClick={() => setSigningElId(null)} className="text-gray-400 font-bold px-4">ביטול</button>
          </div>
        </div>
      </div>
    )}
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-gray-900">{session.template_name}</h1>
            <p className="text-[11px] text-gray-400 font-bold">שלום {session.client_name}</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={signing}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-black shadow-lg hover:scale-105 transition-all disabled:opacity-50 text-sm"
          >
            {signing ? 'שולח...' : 'אישור וחתימה'}
          </button>
        </div>
      </div>

      {/* PDF Pages with interactive fields */}
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-3">
        {pages.length > 0 ? pages.map((page, pageIdx) => {
          const pageElements = elements.filter(el => el.page === pageIdx + 1);

          return (
            <div key={pageIdx} className="relative bg-white rounded-xl shadow-lg overflow-hidden">
              <img src={page.dataUrl} className="w-full" alt="" draggable={false} />

              {pageElements.map(el => {
                // אחוזים יחסיים לגודל המקורי של הדף
                const style = {
                  position: 'absolute',
                  left: (el.x / page.origW * 100) + '%',
                  top: (el.y / page.origH * 100) + '%',
                  width: (el.width / page.origW * 100) + '%',
                  height: (el.height / page.origH * 100) + '%',
                };

                if (el.type === 'signature') {
                  const hasSig = signatures[el.id];
                  return (
                    <div key={el.id} style={style} onClick={() => setSigningElId(el.id)}
                      className={`flex items-center justify-center rounded transition-all cursor-pointer ${hasSig ? 'hover:opacity-80 hover:ring-2 hover:ring-blue-400' : 'border-2 border-dashed border-blue-400 bg-blue-50/60 hover:bg-blue-100/80 hover:border-blue-500'}`}
                    >
                      {hasSig ? (
                        <img src={hasSig} className="w-full h-full object-contain" alt="חתימה" />
                      ) : (
                        <span className="text-blue-500 font-black" style={{ fontSize: 'clamp(7px, 1.5vw, 12px)' }}>לחץ לחתימה</span>
                      )}
                    </div>
                  );
                }

                if (el.type === 'date') {
                  const isReadonly = el.autoDate === true;
                  const dateVal = formData[el.id] || new Date().toISOString().split('T')[0];
                  const displayDate = dateVal ? new Date(dateVal).toLocaleDateString('he-IL') : '';
                  if (isReadonly) {
                    return (
                      <div key={el.id} style={style} className="flex items-center justify-end px-1" dir="rtl">
                        <span className="font-bold text-gray-700" style={{ fontSize: 'clamp(8px, 1.8vw, 13px)' }}>{displayDate}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={el.id} style={style}>
                      <input type="date" dir="ltr"
                        className="w-full h-full bg-green-50/70 border-b-2 border-green-300 outline-none px-1 font-bold text-gray-800 focus:bg-green-50 focus:border-green-500 transition-all"
                        style={{ fontSize: 'clamp(8px, 1.8vw, 13px)' }}
                        value={dateVal}
                        onChange={e => setFormData({ ...formData, [el.id]: e.target.value })}
                      />
                    </div>
                  );
                }

                if (el.type === 'time') {
                  if (el.autoDate) {
                    return (
                      <div key={el.id} style={style} className="flex items-center justify-end px-1" dir="rtl">
                        <span className="font-bold text-gray-700" style={{ fontSize: 'clamp(8px, 1.8vw, 13px)' }}>{formData[el.id] || el.defaultTime || ''}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={el.id} style={style}>
                      <input type="time" dir="ltr"
                        className="w-full h-full bg-cyan-50/70 border-b-2 border-cyan-300 outline-none px-1 font-bold text-gray-800 focus:bg-cyan-50 focus:border-cyan-500 transition-all"
                        style={{ fontSize: 'clamp(8px, 1.8vw, 13px)' }}
                        value={formData[el.id] || ''}
                        onChange={e => setFormData({ ...formData, [el.id]: e.target.value })}
                      />
                    </div>
                  );
                }

                if (el.type === 'checkbox') {
                  const isRequired = el.required;
                  return (
                    <div key={el.id} style={style} className="flex items-center justify-center cursor-pointer" onClick={() => setFormData({ ...formData, [el.id]: !formData[el.id] })}>
                      <div className={`w-full h-full rounded border-2 flex items-center justify-center transition-all ${formData[el.id] ? 'bg-purple-500 border-purple-500' : isRequired ? 'border-red-400 bg-red-50/50 hover:bg-red-100/70' : 'border-purple-300 bg-purple-50/50 hover:bg-purple-100/70'}`}>
                        {formData[el.id] && <span className="text-white font-black" style={{ fontSize: Math.min(parseFloat(style.height) * 0.6, 16) }}>✓</span>}
                      </div>
                    </div>
                  );
                }

                if (el.type === 'text') {
                  return (
                    <div key={el.id} style={style}>
                      <input
                        className={`w-full h-full bg-amber-50/70 border-b-2 outline-none px-1 font-bold text-gray-800 text-right focus:bg-amber-50 transition-all placeholder:text-amber-300/70 placeholder:font-normal ${el.required && !formData[el.id] ? 'border-red-400' : 'border-amber-300 focus:border-amber-500'}`}
                        style={{ fontSize: 'clamp(8px, 1.8vw, 13px)' }}
                        dir="rtl"
                        placeholder={el.placeholder || ''}
                        value={formData[el.id] || ''}
                        onChange={e => setFormData({ ...formData, [el.id]: e.target.value })}
                      />
                    </div>
                  );
                }

                if (el.type === 'select') {
                  return (
                    <div key={el.id} style={style}>
                      <select
                        className={`w-full h-full bg-pink-50/70 border-b-2 outline-none px-1 font-bold text-gray-800 text-right transition-all ${el.required && !formData[el.id] ? 'border-red-400' : 'border-pink-300 focus:border-pink-500'}`}
                        style={{ fontSize: 'clamp(8px, 1.8vw, 13px)' }}
                        dir="rtl"
                        value={formData[el.id] || ''}
                        onChange={e => setFormData({ ...formData, [el.id]: e.target.value })}
                      >
                        <option value="">{el.placeholder || 'בחר...'}</option>
                        {(el.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          );
        }) : (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
          </div>
        )}

        {/* Bottom submit */}
        <div className="sticky bottom-4 pt-2">
          <button
            onClick={handleSubmit}
            disabled={signing}
            className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black text-lg shadow-2xl hover:bg-black transition-all disabled:opacity-50"
          >
            {signing ? 'שולח...' : 'אישור וחתימה על המסמך'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

const StatusScreen = ({ icon, title }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
    <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center">
      <div className="text-6xl mb-6">{icon}</div>
      <h1 className="text-2xl font-black text-gray-900">{title}</h1>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
  </div>
);
