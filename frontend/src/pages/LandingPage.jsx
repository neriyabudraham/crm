import React from 'react';

export const LandingPage = ({ onLogin, onSignup }) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
    {/* Hero */}
    <header className="max-w-5xl mx-auto px-6 pt-8 pb-4 flex justify-between items-center">
      <h1 className="text-2xl font-black text-gray-900">Botomat<span className="text-accent">.</span>CRM</h1>
      <div className="flex gap-3">
        <button onClick={onLogin} className="text-gray-600 font-bold text-sm hover:text-gray-900 transition-all px-4 py-2">התחברות</button>
        <button onClick={onSignup} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all">הרשמה חינם</button>
      </div>
    </header>

    <main className="max-w-5xl mx-auto px-6">
      <div className="text-center py-20">
        <h2 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
          מערכת ניהול לקוחות<br /><span className="text-accent">חכמה ומתקדמת</span>
        </h2>
        <p className="text-xl text-gray-400 font-bold max-w-2xl mx-auto mb-10">
          נהל לידים, חוזים דיגיטליים, תשלומים, שאלונים וקורסים — הכל ממקום אחד, בעברית, עם חתימה דיגיטלית מובנית.
        </p>
        <button onClick={onSignup} className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-all">
          התחל עכשיו — בחינם
        </button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
        {[
          { icon: '📋', title: 'ניהול לידים', desc: 'ניהול מלא של לידים עם שדות מותאמים, סטטוסים, מקורות הגעה וסינון מתקדם.' },
          { icon: '✍️', title: 'חתימה דיגיטלית', desc: 'שלח חוזים לחתימה דיגיטלית ישירות מהמערכת. הלקוח חותם על גבי תצוגת המסמך.' },
          { icon: '💰', title: 'ניהול תשלומים', desc: 'מקדמות, פריסות, חובות — כל סוגי התשלומים עם מעקב מלא ואמצעי תשלום.' },
          { icon: '📋', title: 'שאלונים חכמים', desc: 'צור שאלונים מותאמים, שלח ללקוח ותקבל את הנתונים ישירות לכרטיס הליד.' },
          { icon: '🎓', title: 'ניהול קורסים', desc: 'נהל קורסים, תלמידות, מחירים אישיים ושיוך תלמידים לקורסים.' },
          { icon: '🔗', title: 'API מלא', desc: 'גישת API מלאה לכל המערכת עם תיעוד Swagger ו-API keys.' },
        ].map((f, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">{f.title}</h3>
            <p className="text-gray-400 font-medium text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center py-16 border-t border-gray-100">
        <p className="text-gray-300 font-bold text-sm">Botomat CRM — מערכת ניהול לקוחות מתקדמת</p>
      </div>
    </main>
  </div>
);
