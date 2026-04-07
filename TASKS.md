# CRM Botomat — תוכנית עבודה מפורטת

> סטטוס נכון לתאריך 2026-04-07.

## שלב 1: הגדרות חלק — מקדמה, עסקה, שיוך שאלונים/חתימות
- [x] 1.1 הוספת טאבים בEntitySettingsModal: "תשלומים", "שאלונים", "חתימות"
- [x] 1.2 הגדרת סכום מקדמה דיפולטיבי לכל חלק
- [x] 1.3 הגדרת סכום עסקה דיפולטיבי לכל חלק
- [x] 1.4 שיוך שאלונים לחלקים (questionnaires.entity_type)
- [x] 1.5 שיוך תבניות חתימה לחלקים (pdf_templates.entity_type)
- [x] 1.6 שדות ברירת מחדל בהגדרות ראשיות (הצג/הסתר/חובה) — קיים בטאב `default_fields` ב-SettingsPage

## שלב 2: מערכת חשבונות (Multi-tenant)
- [x] 2.1 DB: טבלת accounts
- [x] 2.2 DB: account_id בכל הטבלאות הרלוונטיות (כולל statuses שהיתה חסרה)
- [x] 2.3 DB: טבלת `account_members` — חיבור many-to-many בין emails לחשבונות, owner/admin/member roles. מאפשר למספר אימיילים גישה לאותו חשבון, ו-multi-tenancy אמיתי.
- [x] 2.14 ביטול מסך בחירת משתמש פנימי — לוגין ישיר ל-dashboard
- [x] 2.15 Account switcher בHeader — דרופדאון לעבור בין חשבונות נגישים בקליק
- [x] 2.16 Members tab בהגדרות — הוספה/הסרה/שינוי תפקיד של חברים
- [x] 2.17 POST /api/account/switch — JWT חדש עם accountId אחר
- [x] 2.18 accountMiddleware מוודא membership ב-account_members בכל בקשה (cache 5 שניות)
- [x] 2.4 Middleware: tenant isolation מופעל על clients/admin/courses/templates ועל management endpoints של signing/questionnaires
- [x] 2.5 מיגרציית נתונים קיימים — backfill ל-account_id=1 (system_settings, statuses, signing_sessions, signed_documents)
- [x] 2.6 Backend: auth routes — signup, login, forgot-password, reset-password
- [x] 2.7 Backend: bcrypt + JWT access+refresh tokens
- [x] 2.8 Frontend: דף התחברות
- [x] 2.9 Frontend: דף הרשמה
- [~] 2.10 Frontend: דף איפוס סיסמה — UI קיים, שליחת המייל בpassword reset עדיין רק console.log
- [x] 2.11 Frontend: דף ראשי (LandingPage)
- [x] 2.12 חיבור accountAuthRoutes ל-app.js + interceptors ב-frontend api.js (אקסס+ריפרש אוטומטי)
- [x] 2.13 תיקון system_settings PK → (key, account_id), users.username UNIQUE → (username, account_id)

## שלב 3: Google OAuth
- [x] 3.1 Backend: google-auth-library קיים ב-backend/package.json (^10.6.2)
- [x] 3.2 Backend: POST /api/account/google
- [x] 3.3 Frontend: כפתור "התחבר עם Google"
- [ ] 3.4 הגדרת Google Cloud Console — OAuth client ID + GOOGLE_CLIENT_ID ב-.env
- [ ] 3.5 שליחת מיילים דרך Gmail API (אופציונלי)

## שלב 4: ממשק ניהול מערכת (Super Admin)
- [x] 4.1 DB: טבלת admin_users
- [x] 4.2 Backend: superAdminRoutes — login, /me, /stats, /accounts (CRUD), /accounts/:id/login-as
- [x] 4.3 Frontend: SuperAdminPage נפרד תחת `/admin` (login + dashboard + accounts table)
- [x] 4.4 Admin login: office@neriyabudraham.co.il (סיסמה זמנית `Admin1234!` — **חובה לשנות בהתחברות הראשונה**)
- [x] 4.5 אפשרות "התחבר כמשתמש" — הכפתור יוצר accessToken עם flag `impersonatedBy` ומפנה ל-`/`
- [x] 4.6 סטטיסטיקות מערכת — accounts/clients/payments/signed_docs/questionnaires/plans/new_30d

## שלב 5: API מלא + Swagger + API Keys
- [x] 5.1 Backend: /api/v1/ router מרכזי (`backend/src/routes/v1/index.js`)
- [x] 5.2 Endpoints: clients (CRUD), payments (CRUD), questionnaires (read+sessions), api-keys (CRUD)
- [x] 5.3 Backend: API key middleware עם sha256 hash, rate limit (60/min/key), tracking של last_used + request_count
- [x] 5.4 DB: טבלת api_keys
- [x] 5.5 Frontend: דף ניהול API keys בטאב חדש בהגדרות (יצירה, חסימה, מחיקה, הצגת raw key פעם אחת)
- [x] 5.6 Swagger: swagger-jsdoc + swagger-ui-express עם JSDoc על כל endpoint
- [x] 5.7 GET /api/docs (UI) ו-GET /api/docs.json (spec)
- [ ] 5.8 Dual auth: כל endpoint תחת /v1 תומך גם ב-X-API-Key וגם ב-Bearer JWT (`dualAuth` middleware) ✅

## שלב 6: שיפורים ובדיקות
- [ ] 6.1 בדיקה מלאה של כל הflows
- [ ] 6.2 תיקון באגים
- [ ] 6.3 מחיקת קובץ TASKS.md

---

## מקרא
- `[x]` בוצע
- `[~]` בוצע חלקית
- `[ ]` לא בוצע
