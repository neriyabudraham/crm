import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

/**
 * Global dialog system: replaces window.alert / confirm / prompt
 * with branded modals + a toast stack.
 *
 * Usage from any component:
 *   const { toast, alert, confirm, prompt } = useDialog();
 *   toast.success('נשמר');
 *   toast.error('שגיאה');
 *   await alert('הודעה');
 *   if (await confirm('למחוק?')) { ... }
 *   const name = await prompt('שם:'); if (name) { ... }
 *
 * The provider also patches window.alert/confirm/prompt globally so any
 * legacy code (or a place we missed) keeps working through the same UI.
 * Note: window.confirm/prompt return a Promise instead of a sync value
 * (legacy sync code that depends on the return value won't block, but no
 * call site in this app relies on synchronous return).
 */

const DialogContext = createContext(null);

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
  return ctx;
};

let nextId = 1;

export const DialogProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null); // {kind, title, message, options, resolve, ...}

  // ----- toast -----
  const pushToast = useCallback((kind, message, opts = {}) => {
    const id = nextId++;
    const duration = opts.duration ?? 4000;
    setToasts(t => [...t, { id, kind, message }]);
    if (duration > 0) {
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
    }
    return id;
  }, []);

  const toast = {
    success: (msg, opts) => pushToast('success', msg, opts),
    error:   (msg, opts) => pushToast('error',   msg, opts),
    info:    (msg, opts) => pushToast('info',    msg, opts),
    warning: (msg, opts) => pushToast('warning', msg, opts),
    dismiss: (id) => setToasts(t => t.filter(x => x.id !== id)),
  };

  // ----- modal helpers (alert/confirm/prompt) -----
  const showModal = (kind, message, opts = {}) => new Promise((resolve) => {
    setModal({ kind, message, opts, resolve });
  });

  const alert = (message, opts) => showModal('alert', message, opts);
  const confirm = (message, opts) => showModal('confirm', message, opts);
  const prompt = (message, opts) => showModal('prompt', message, opts);

  const closeModal = (value) => {
    if (modal) {
      modal.resolve(value);
      setModal(null);
    }
  };

  // ----- patch window globals so legacy code goes through the same UI -----
  useEffect(() => {
    const origAlert = window.alert;
    const origConfirm = window.confirm;
    const origPrompt = window.prompt;
    window.alert = (msg) => { alert(String(msg ?? '')); };
    window.confirm = (msg) => { confirm(String(msg ?? '')); return false; };
    window.prompt = (msg, def) => { prompt(String(msg ?? ''), { defaultValue: def }); return null; };
    return () => {
      window.alert = origAlert;
      window.confirm = origConfirm;
      window.prompt = origPrompt;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialogContext.Provider value={{ toast, alert, confirm, prompt }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={(id) => toast.dismiss(id)} />
      {modal && <ModalDialog modal={modal} onClose={closeModal} />}
    </DialogContext.Provider>
  );
};

// ============ Toast stack ============

const TOAST_STYLES = {
  success: { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-900', icon: '✓', iconBg: 'bg-emerald-500' },
  error:   { bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-900',     icon: '✕', iconBg: 'bg-red-500' },
  info:    { bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-900',    icon: 'i', iconBg: 'bg-blue-500' },
  warning: { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-900',   icon: '!', iconBg: 'bg-amber-500' },
};

const ToastStack = ({ toasts, onDismiss }) => (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none" dir="rtl">
    {toasts.map(t => {
      const s = TOAST_STYLES[t.kind] || TOAST_STYLES.info;
      return (
        <div
          key={t.id}
          className={`${s.bg} ${s.border} ${s.text} border-2 rounded-2xl shadow-2xl pointer-events-auto flex items-center gap-3 px-5 py-4 min-w-[280px] max-w-md animate-in slide-in-from-top-2 fade-in duration-300`}
        >
          <div className={`w-7 h-7 ${s.iconBg} text-white rounded-full flex items-center justify-center font-black text-sm flex-shrink-0`}>
            {s.icon}
          </div>
          <div className="font-bold text-sm flex-1">{t.message}</div>
          <button
            onClick={() => onDismiss(t.id)}
            className={`${s.text} opacity-50 hover:opacity-100 font-black text-lg leading-none`}
          >×</button>
        </div>
      );
    })}
  </div>
);

// ============ Modal dialog (alert/confirm/prompt) ============

const ModalDialog = ({ modal, onClose }) => {
  const { kind, message, opts } = modal;
  const inputRef = useRef(null);
  const [value, setValue] = useState(opts.defaultValue || '');

  useEffect(() => {
    if (kind === 'prompt' && inputRef.current) inputRef.current.focus();
  }, [kind]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(kind === 'confirm' ? false : kind === 'prompt' ? null : undefined);
      if (e.key === 'Enter' && kind !== 'prompt') onClose(kind === 'confirm' ? true : undefined);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kind, onClose]);

  const isDestructive = opts.destructive === true;
  const confirmText = opts.confirmText || (kind === 'confirm' ? 'אישור' : 'הבנתי');
  const cancelText = opts.cancelText || 'ביטול';
  const title = opts.title || (kind === 'confirm' ? 'אישור פעולה' : kind === 'prompt' ? 'הזנת פרטים' : 'הודעה');
  const icon = opts.icon || (kind === 'confirm' ? (isDestructive ? '⚠️' : '❓') : kind === 'prompt' ? '✏️' : 'ℹ️');

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose(kind === 'confirm' ? false : kind === 'prompt' ? null : undefined)}
      dir="rtl"
    >
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-right">
          <div className="text-5xl mb-4 text-center">{icon}</div>
          <h2 className="text-xl font-black text-gray-900 mb-2 text-center">{title}</h2>
          <p className="text-gray-600 font-bold text-sm text-center mb-6 whitespace-pre-wrap">{message}</p>

          {kind === 'prompt' && (
            <input
              ref={inputRef}
              type={opts.type || 'text'}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onClose(value)}
              placeholder={opts.placeholder || ''}
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-accent mb-4"
            />
          )}

          <div className="flex gap-3">
            {(kind === 'confirm' || kind === 'prompt') && (
              <button
                onClick={() => onClose(kind === 'confirm' ? false : null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-black transition-all"
              >{cancelText}</button>
            )}
            <button
              onClick={() => onClose(kind === 'confirm' ? true : kind === 'prompt' ? value : undefined)}
              className={`flex-1 ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-900 hover:bg-black'} text-white py-3 rounded-2xl font-black transition-all`}
            >{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
