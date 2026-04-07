const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'crm_secret_key_2025';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'crm_refresh_secret_2025';

// הרשמה
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'כל השדות נדרשים' });
    if (password.length < 6) return res.status(400).json({ error: 'סיסמה חייבת להכיל לפחות 6 תווים' });

    try {
        const existing = await db.query('SELECT id FROM accounts WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) return res.status(409).json({ error: 'אימייל זה כבר רשום במערכת' });

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO accounts (name, email, password_hash, is_verified) VALUES ($1, $2, $3, TRUE) RETURNING id, name, email, plan, created_at',
            [name, email.toLowerCase(), passwordHash]
        );

        // יצירת משתמש ראשי בחשבון
        await db.query('INSERT INTO users (username, password, role, account_id) VALUES ($1, $2, $3, $4)', [name, password, 'admin', result.rows[0].id]);

        // יצירת סטטוסים ומקורות דיפולטיביים
        await db.query("INSERT INTO system_settings (key, values, account_id) VALUES ($1, $2, $3)", [
            'client_statuses',
            JSON.stringify([{name:'חדש',color:'#3B82F6'},{name:'בטיפול',color:'#F59E0B'},{name:'סגר עסקה',color:'#10B981'},{name:'בוטל',color:'#EF4444'}]),
            result.rows[0].id
        ]);
        await db.query("INSERT INTO system_settings (key, values, account_id) VALUES ($1, $2, $3)", [
            'client_sources',
            JSON.stringify(['אינסטגרם','פייסבוק','גוגל','המלצה','אתר','אחר']),
            result.rows[0].id
        ]);

        const account = result.rows[0];
        const { accessToken, refreshToken } = await generateTokens(account);

        res.status(201).json({ account, accessToken, refreshToken });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// התחברות
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'אימייל וסיסמה נדרשים' });

    try {
        const result = await db.query('SELECT * FROM accounts WHERE email = $1 AND is_active = TRUE', [email.toLowerCase()]);
        if (!result.rows[0]) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

        const account = result.rows[0];
        const valid = await bcrypt.compare(password, account.password_hash);
        if (!valid) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

        const { accessToken, refreshToken } = await generateTokens(account);

        res.json({
            account: { id: account.id, name: account.name, email: account.email, plan: account.plan, avatar_url: account.avatar_url },
            accessToken, refreshToken
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Google OAuth
router.post('/google', async (req, res) => {
    const { credential } = req.body;
    try {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();

        let account = (await db.query('SELECT * FROM accounts WHERE google_id = $1 OR email = $2', [payload.sub, payload.email])).rows[0];

        if (!account) {
            // יצירת חשבון חדש
            const result = await db.query(
                'INSERT INTO accounts (name, email, password_hash, google_id, avatar_url, is_verified) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *',
                [payload.name, payload.email, 'google_oauth', payload.sub, payload.picture]
            );
            account = result.rows[0];
            await db.query('INSERT INTO users (username, password, role, account_id) VALUES ($1, $2, $3, $4)', [payload.name, 'google', 'admin', account.id]);

            // defaults
            await db.query("INSERT INTO system_settings (key, values, account_id) VALUES ($1, $2, $3)", ['client_statuses', JSON.stringify([{name:'חדש',color:'#3B82F6'},{name:'בטיפול',color:'#F59E0B'},{name:'סגר עסקה',color:'#10B981'}]), account.id]);
            await db.query("INSERT INTO system_settings (key, values, account_id) VALUES ($1, $2, $3)", ['client_sources', JSON.stringify(['אינסטגרם','פייסבוק','גוגל','המלצה','אתר']), account.id]);
        } else if (!account.google_id) {
            await db.query('UPDATE accounts SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3', [payload.sub, payload.picture, account.id]);
        }

        const { accessToken, refreshToken } = await generateTokens(account);
        res.json({
            account: { id: account.id, name: account.name, email: account.email, plan: account.plan, avatar_url: account.avatar_url || payload.picture },
            accessToken, refreshToken
        });
    } catch (err) { res.status(500).json({ error: 'שגיאה באימות Google: ' + err.message }); }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Token חסר' });

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const stored = await db.query('SELECT * FROM refresh_tokens WHERE token = $1 AND account_id = $2 AND expires_at > NOW()', [refreshToken, decoded.accountId]);
        if (!stored.rows[0]) return res.status(401).json({ error: 'Token לא תקין' });

        const account = (await db.query('SELECT * FROM accounts WHERE id = $1', [decoded.accountId])).rows[0];
        if (!account) return res.status(401).json({ error: 'חשבון לא נמצא' });

        const accessToken = jwt.sign({ accountId: account.id, email: account.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ accessToken });
    } catch (err) { res.status(401).json({ error: 'Token פג תוקף' }); }
});

// Logout
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    res.json({ success: true });
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const account = (await db.query('SELECT id FROM accounts WHERE email = $1', [email.toLowerCase()])).rows[0];
        if (!account) return res.json({ success: true }); // לא חושפים אם קיים

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query("INSERT INTO verification_tokens (email, token, type, expires_at) VALUES ($1, $2, 'reset', NOW() + INTERVAL '1 hour')", [email.toLowerCase(), code]);

        // TODO: שלוח מייל עם הקוד
        console.log(`Password reset code for ${email}: ${code}`);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const token = (await db.query("SELECT * FROM verification_tokens WHERE email = $1 AND token = $2 AND type = 'reset' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1", [email.toLowerCase(), code])).rows[0];
        if (!token) return res.status(400).json({ error: 'קוד לא תקין או פג תוקף' });

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE accounts SET password_hash = $1 WHERE email = $2', [passwordHash, email.toLowerCase()]);
        await db.query("DELETE FROM verification_tokens WHERE email = $1 AND type = 'reset'", [email.toLowerCase()]);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Me
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'לא מחובר' });
    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        const account = (await db.query('SELECT id, name, email, plan, avatar_url, created_at FROM accounts WHERE id = $1', [decoded.accountId])).rows[0];
        if (!account) return res.status(401).json({ error: 'חשבון לא נמצא' });
        // טעינת משתמשים
        const users = (await db.query('SELECT id, username, role FROM users WHERE account_id = $1', [account.id])).rows;
        res.json({ account, users });
    } catch (err) { res.status(401).json({ error: 'Token לא תקין' }); }
});

async function generateTokens(account) {
    const accessToken = jwt.sign({ accountId: account.id, email: account.email }, JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ accountId: account.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    await db.query("INSERT INTO refresh_tokens (account_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')", [account.id, refreshToken]);
    return { accessToken, refreshToken };
}

module.exports = router;
