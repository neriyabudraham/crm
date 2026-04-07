# CRM Botomat — תוכנית עבודה מפורטת

## שלב 1: הגדרות חלק — מקדמה, עסקה, שיוך שאלונים/חתימות
- [ ] 1.1 הוספת טאבים בEntitySettingsModal: "תשלומים", "שאלונים", "חתימות"
- [ ] 1.2 הגדרת סכום מקדמה דיפולטיבי לכל חלק (system_settings: `bride_default_advance`)
- [ ] 1.3 הגדרת סכום עסקה דיפולטיבי לכל חלק (system_settings: `bride_default_deal`)
- [ ] 1.4 שיוך שאלונים לחלקים (questionnaires.entity_type) + סינון בכרטיס לקוח
- [ ] 1.5 שיוך תבניות חתימה לחלקים (pdf_templates.entity_type) + סינון בכרטיס לקוח
- [ ] 1.6 שדות ברירת מחדל בהגדרות ראשיות (הצג/הסתר/חובה)

## שלב 2: מערכת חשבונות (Multi-tenant)
- [ ] 2.1 DB: טבלת accounts (id, name, email, password_hash, plan, created_at, is_active)
- [ ] 2.2 DB: הוספת account_id לכל הטבלאות (clients, payments, questionnaires, etc.)
- [ ] 2.3 DB: טבלת account_users (account_id, user_id, role)
- [ ] 2.4 Middleware: tenant isolation — כל query מסונן לפי account_id
- [ ] 2.5 מיגרציית נתונים קיימים → account ראשון (office@rachelibeauty.com)
- [ ] 2.6 Backend: auth routes — signup, login, forgot-password, reset-password
- [ ] 2.7 Backend: bcrypt passwords, JWT access+refresh tokens
- [ ] 2.8 Frontend: דף התחברות חדש (email+password)
- [ ] 2.9 Frontend: דף הרשמה
- [ ] 2.10 Frontend: דף איפוס סיסמה (שליחת מייל + טוקן)
- [ ] 2.11 Frontend: דף ראשי (landing page) עם הסבר יכולות

## שלב 3: Google OAuth
- [ ] 3.1 Backend: google-auth-library integration
- [ ] 3.2 Backend: POST /api/auth/google — verify ID token, create/link account
- [ ] 3.3 Frontend: כפתור "התחבר עם Google"
- [ ] 3.4 הגדרת Google Cloud Console — OAuth client ID
- [ ] 3.5 תמיכה בשליחת מיילים דרך Gmail API (אופציונלי)

## שלב 4: ממשק ניהול מערכת (Super Admin)
- [ ] 4.1 DB: טבלת admins (email, role: admin/superadmin)
- [ ] 4.2 Backend: admin routes — ניהול חשבונות, משתמשים, סטטיסטיקות
- [ ] 4.3 Frontend: ממשק admin נפרד — רשימת חשבונות, חסימה, מחיקה
- [ ] 4.4 Admin login: office@neriyabudraham.co.il
- [ ] 4.5 אפשרות "התחבר כמשתמש" (viewingAs)
- [ ] 4.6 סטטיסטיקות מערכת (כמה חשבונות, לידים, חוזים חתומים, וכו')

## שלב 5: API מלא + Swagger + API Keys
- [ ] 5.1 Backend: יצירת router מרכזי /api/v1/ עם כל הendpoints
- [ ] 5.2 Endpoints: clients CRUD, payments CRUD, questionnaires, signing, settings
- [ ] 5.3 Backend: API key middleware — יצירה, אימות, rate limiting
- [ ] 5.4 DB: טבלת api_keys (account_id, key_hash, name, permissions, last_used, created_at)
- [ ] 5.5 Frontend: דף ניהול API keys בהגדרות (יצירה, מחיקה, הצגת key פעם אחת)
- [ ] 5.6 Swagger: swagger-jsdoc + swagger-ui-express — תיעוד אוטומטי
- [ ] 5.7 Endpoint: GET /api/docs — Swagger UI

## שלב 6: שיפורים ובדיקות
- [ ] 6.1 בדיקה מלאה של כל הflows
- [ ] 6.2 תיקון באגים
- [ ] 6.3 מחיקת קובץ TASKS.md
