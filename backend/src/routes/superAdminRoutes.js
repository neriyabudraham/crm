const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { superAdminAuth, requireSuperAdmin, JWT_ADMIN_SECRET } = require('../middlewares/superAdminMiddleware');
const JWT_SECRET = process.env.JWT_SECRET || 'crm_secret_key_2025';

// ============ Auth ============

// התחברות superadmin
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'אימייל וסיסמה נדרשים' });
    try {
        const r = await db.query('SELECT * FROM admin_users WHERE email = $1', [email.toLowerCase()]);
        if (!r.rows[0]) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
        const admin = r.rows[0];
        const valid = await bcrypt.compare(password, admin.password_hash);
        if (!valid) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

        const token = jwt.sign({ adminId: admin.id, email: admin.email, role: admin.role }, JWT_ADMIN_SECRET, { expiresIn: '12h' });
        res.json({ admin: { id: admin.id, email: admin.email, role: admin.role }, accessToken: token });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// פרטי אדמין מחובר
router.get('/me', superAdminAuth, async (req, res) => {
    try {
        const r = await db.query('SELECT id, email, role, created_at FROM admin_users WHERE id = $1', [req.adminId]);
        if (!r.rows[0]) return res.status(404).json({ error: 'לא נמצא' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============ Stats ============

router.get('/stats', superAdminAuth, async (req, res) => {
    try {
        const queries = await Promise.all([
            db.query('SELECT COUNT(*)::int AS c FROM accounts'),
            db.query('SELECT COUNT(*)::int AS c FROM accounts WHERE is_active = true'),
            db.query('SELECT COUNT(*)::int AS c FROM clients'),
            db.query('SELECT COUNT(*)::int AS c FROM payments'),
            db.query("SELECT COUNT(*)::int AS c FROM signed_documents"),
            db.query("SELECT COUNT(*)::int AS c FROM questionnaire_sessions WHERE status = 'submitted'"),
            db.query("SELECT plan, COUNT(*)::int AS c FROM accounts GROUP BY plan"),
            db.query("SELECT COUNT(*)::int AS c FROM accounts WHERE created_at >= NOW() - INTERVAL '30 days'"),
        ]);
        res.json({
            accounts_total: queries[0].rows[0].c,
            accounts_active: queries[1].rows[0].c,
            clients_total: queries[2].rows[0].c,
            payments_total: queries[3].rows[0].c,
            signed_docs_total: queries[4].rows[0].c,
            questionnaires_submitted: queries[5].rows[0].c,
            plans: queries[6].rows,
            new_accounts_30d: queries[7].rows[0].c,
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============ Accounts management ============

// רשימת חשבונות
router.get('/accounts', superAdminAuth, async (req, res) => {
    try {
        const r = await db.query(`
            SELECT a.id, a.name, a.email, a.plan, a.is_active, a.is_verified, a.created_at,
                   (SELECT COUNT(*)::int FROM clients WHERE account_id = a.id) AS clients_count,
                   (SELECT COUNT(*)::int FROM payments WHERE account_id = a.id) AS payments_count
            FROM accounts a
            ORDER BY a.created_at DESC
        `);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// פרטי חשבון בודד
router.get('/accounts/:id', superAdminAuth, async (req, res) => {
    try {
        const r = await db.query('SELECT id, name, email, plan, is_active, is_verified, avatar_url, created_at FROM accounts WHERE id = $1', [req.params.id]);
        if (!r.rows[0]) return res.status(404).json({ error: 'חשבון לא נמצא' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// חסימה/הפעלה של חשבון
router.patch('/accounts/:id', superAdminAuth, async (req, res) => {
    const { is_active, plan, name } = req.body;
    try {
        const fields = [];
        const vals = [];
        let i = 1;
        if (is_active !== undefined) { fields.push(`is_active = $${i++}`); vals.push(is_active); }
        if (plan !== undefined) { fields.push(`plan = $${i++}`); vals.push(plan); }
        if (name !== undefined) { fields.push(`name = $${i++}`); vals.push(name); }
        if (fields.length === 0) return res.json({ message: 'Nothing to update' });
        vals.push(req.params.id);
        const r = await db.query(`UPDATE accounts SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, name, email, plan, is_active`, vals);
        if (!r.rows[0]) return res.status(404).json({ error: 'חשבון לא נמצא' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// מחיקת חשבון (superadmin בלבד)
router.delete('/accounts/:id', superAdminAuth, requireSuperAdmin, async (req, res) => {
    try {
        const r = await db.query('DELETE FROM accounts WHERE id = $1', [req.params.id]);
        if (r.rowCount === 0) return res.status(404).json({ error: 'חשבון לא נמצא' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============ View as user (impersonation) ============

// יצירת access token של משתמש כדי "להתחבר כמשתמש"
router.post('/accounts/:id/login-as', superAdminAuth, async (req, res) => {
    try {
        const r = await db.query('SELECT id, name, email, plan, avatar_url FROM accounts WHERE id = $1 AND is_active = true', [req.params.id]);
        if (!r.rows[0]) return res.status(404).json({ error: 'חשבון לא נמצא או חסום' });
        const account = r.rows[0];
        // טוקן אקסס קצר-טווח, מסומן כ-impersonation
        const accessToken = jwt.sign(
            { accountId: account.id, email: account.email, impersonatedBy: req.adminId },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        res.json({ account, accessToken });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
