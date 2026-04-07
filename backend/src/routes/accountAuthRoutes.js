const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'crm_secret_key_2025';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'crm_refresh_secret_2025';

// ============ Helpers ============

// טעינת כל החשבונות שהמשתמש (לפי email) חבר בהם
async function loadAccessibleAccounts(userEmail) {
    const r = await db.query(`
        SELECT a.id, a.name, a.email, a.plan, a.avatar_url, m.role
        FROM accounts a
        JOIN account_members m ON m.account_id = a.id
        WHERE LOWER(m.user_email) = LOWER($1) AND a.is_active = TRUE
        ORDER BY (m.role = 'owner') DESC, a.created_at ASC
    `, [userEmail]);
    return r.rows;
}

async function generateTokens(userAccountId, userEmail, currentAccountId) {
    const payload = { userAccountId, userEmail, accountId: currentAccountId };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ userAccountId, userEmail }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    await db.query("INSERT INTO refresh_tokens (account_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')", [userAccountId, refreshToken]);
    return { accessToken, refreshToken };
}

// בחירת חשבון התחלתי לאחר login
function pickDefaultAccount(accounts, userAccountId) {
    return accounts.find(a => a.id === userAccountId) || accounts[0];
}

// ============ Auth ============

// הרשמה
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'כל השדות נדרשים' });
    if (password.length < 6) return res.status(400).json({ error: 'סיסמה חייבת להכיל לפחות 6 תווים' });

    try {
        const lowerEmail = email.toLowerCase();
        const existing = await db.query('SELECT id FROM accounts WHERE email = $1', [lowerEmail]);
        if (existing.rows.length > 0) return res.status(409).json({ error: 'אימייל זה כבר רשום במערכת' });

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO accounts (name, email, password_hash, is_verified) VALUES ($1, $2, $3, TRUE) RETURNING id, name, email, plan, avatar_url, created_at',
            [name, lowerEmail, passwordHash]
        );
        const account = result.rows[0];

        // owner membership
        await db.query(
            "INSERT INTO account_members (account_id, user_email, role) VALUES ($1, $2, 'owner')",
            [account.id, lowerEmail]
        );

        // defaults
        await db.query("INSERT INTO system_settings (key, values, account_id) VALUES ($1, $2, $3) ON CONFLICT (key, account_id) DO NOTHING", [
            'client_statuses',
            JSON.stringify([{name:'חדש',color:'#3B82F6'},{name:'בטיפול',color:'#F59E0B'},{name:'סגר עסקה',color:'#10B981'},{name:'בוטל',color:'#EF4444'}]),
            account.id
        ]);
        await db.query("INSERT INTO system_settings (key, values, account_id) VALUES ($1, $2, $3) ON CONFLICT (key, account_id) DO NOTHING", [
            'client_sources',
            JSON.stringify(['אינסטגרם','פייסבוק','גוגל','המלצה','אתר','אחר']),
            account.id
        ]);

        const accounts = await loadAccessibleAccounts(lowerEmail);
        const { accessToken, refreshToken } = await generateTokens(account.id, lowerEmail, account.id);
        res.status(201).json({ account, accounts, currentAccountId: account.id, accessToken, refreshToken });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// התחברות
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'אימייל וסיסמה נדרשים' });
    try {
        const lowerEmail = email.toLowerCase();
        const result = await db.query('SELECT * FROM accounts WHERE email = $1 AND is_active = TRUE', [lowerEmail]);
        if (!result.rows[0]) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
        const userAccount = result.rows[0];
        const valid = await bcrypt.compare(password, userAccount.password_hash);
        if (!valid) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

        // ודא שהיא חברה בעצמה (במקרה של רישום ישן)
        await db.query(
            "INSERT INTO account_members (account_id, user_email, role) VALUES ($1, $2, 'owner') ON CONFLICT DO NOTHING",
            [userAccount.id, lowerEmail]
        );

        const accounts = await loadAccessibleAccounts(lowerEmail);
        if (accounts.length === 0) return res.status(403).json({ error: 'אין לך גישה לאף חשבון' });

        const current = pickDefaultAccount(accounts, userAccount.id);
        const { accessToken, refreshToken } = await generateTokens(userAccount.id, lowerEmail, current.id);

        res.json({
            user: { id: userAccount.id, name: userAccount.name, email: userAccount.email, avatar_url: userAccount.avatar_url },
            accounts,
            currentAccountId: current.id,
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
        const lowerEmail = payload.email.toLowerCase();

        let userAccount = (await db.query('SELECT * FROM accounts WHERE google_id = $1 OR email = $2', [payload.sub, lowerEmail])).rows[0];

        if (!userAccount) {
            const result = await db.query(
                'INSERT INTO accounts (name, email, password_hash, google_id, avatar_url, is_verified) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *',
                [payload.name, lowerEmail, 'google_oauth', payload.sub, payload.picture]
            );
            userAccount = result.rows[0];
            await db.query(
                "INSERT INTO account_members (account_id, user_email, role) VALUES ($1, $2, 'owner')",
                [userAccount.id, lowerEmail]
            );
            await db.query("INSERT INTO system_settings (key, values, account_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                ['client_statuses', JSON.stringify([{name:'חדש',color:'#3B82F6'},{name:'בטיפול',color:'#F59E0B'},{name:'סגר עסקה',color:'#10B981'}]), userAccount.id]);
            await db.query("INSERT INTO system_settings (key, values, account_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                ['client_sources', JSON.stringify(['אינסטגרם','פייסבוק','גוגל','המלצה','אתר']), userAccount.id]);
        } else if (!userAccount.google_id) {
            await db.query('UPDATE accounts SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3', [payload.sub, payload.picture, userAccount.id]);
        }

        const accounts = await loadAccessibleAccounts(lowerEmail);
        const current = pickDefaultAccount(accounts, userAccount.id);
        const { accessToken, refreshToken } = await generateTokens(userAccount.id, lowerEmail, current.id);

        res.json({
            user: { id: userAccount.id, name: userAccount.name, email: userAccount.email, avatar_url: userAccount.avatar_url || payload.picture },
            accounts,
            currentAccountId: current.id,
            accessToken, refreshToken
        });
    } catch (err) { res.status(500).json({ error: 'שגיאה באימות Google: ' + err.message }); }
});

// החלפת חשבון פעיל
router.post('/switch', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'לא מחובר' });
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: 'accountId נדרש' });
    try {
        const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
        // ודא שהמשתמש חבר בחשבון המבוקש
        const member = await db.query(
            'SELECT m.role FROM account_members m WHERE m.account_id = $1 AND LOWER(m.user_email) = LOWER($2)',
            [accountId, decoded.userEmail]
        );
        if (!member.rows[0]) return res.status(403).json({ error: 'אין הרשאה לחשבון הזה' });

        const account = (await db.query('SELECT id, name, email, plan, avatar_url FROM accounts WHERE id = $1 AND is_active = TRUE', [accountId])).rows[0];
        if (!account) return res.status(404).json({ error: 'חשבון לא נמצא' });

        const { accessToken, refreshToken } = await generateTokens(decoded.userAccountId, decoded.userEmail, accountId);
        res.json({ account, currentAccountId: accountId, role: member.rows[0].role, accessToken, refreshToken });
    } catch (err) { res.status(401).json({ error: 'Token לא תקין' }); }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Token חסר' });
    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const stored = await db.query('SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()', [refreshToken]);
        if (!stored.rows[0]) return res.status(401).json({ error: 'Token לא תקין' });

        // Get user's current accounts list
        const accounts = await loadAccessibleAccounts(decoded.userEmail);
        if (accounts.length === 0) return res.status(403).json({ error: 'אין גישה' });
        const current = pickDefaultAccount(accounts, decoded.userAccountId);

        const accessToken = jwt.sign(
            { userAccountId: decoded.userAccountId, userEmail: decoded.userEmail, accountId: current.id },
            JWT_SECRET, { expiresIn: '24h' }
        );
        res.json({ accessToken, currentAccountId: current.id });
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
        if (!account) return res.json({ success: true });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query("INSERT INTO verification_tokens (email, token, type, expires_at) VALUES ($1, $2, 'reset', NOW() + INTERVAL '1 hour')", [email.toLowerCase(), code]);
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

// Me — מחזיר את המשתמש המחובר + רשימת חשבונות נגישים + החשבון הפעיל
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'לא מחובר' });
    try {
        const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
        const userAccount = (await db.query('SELECT id, name, email, avatar_url FROM accounts WHERE id = $1', [decoded.userAccountId])).rows[0];
        if (!userAccount) return res.status(401).json({ error: 'משתמש לא נמצא' });

        const accounts = await loadAccessibleAccounts(decoded.userEmail);
        const currentAccount = accounts.find(a => a.id === decoded.accountId) || accounts[0];
        if (!currentAccount) return res.status(403).json({ error: 'אין גישה' });

        res.json({ user: userAccount, accounts, currentAccountId: currentAccount.id, currentAccount });
    } catch (err) { res.status(401).json({ error: 'Token לא תקין' }); }
});

// ============ Members management ============
const { accountAuth } = require('../middlewares/accountMiddleware');

// רשימת חברים בחשבון הפעיל
router.get('/members', accountAuth, async (req, res) => {
    try {
        const r = await db.query(
            `SELECT m.id, m.user_email, m.role, m.created_at,
                    a.name as user_name, a.avatar_url,
                    inv.email as invited_by_email
             FROM account_members m
             LEFT JOIN accounts a ON LOWER(a.email) = LOWER(m.user_email)
             LEFT JOIN accounts inv ON inv.id = m.invited_by
             WHERE m.account_id = $1
             ORDER BY (m.role = 'owner') DESC, m.created_at ASC`,
            [req.accountId]
        );
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// הוספת חבר חדש (owner/admin בלבד)
router.post('/members', accountAuth, async (req, res) => {
    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ error: 'אימייל נדרש' });
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'role לא תקין' });
    try {
        // ודא שהקורא הוא owner/admin
        const me = await db.query(
            'SELECT role FROM account_members WHERE account_id = $1 AND LOWER(user_email) = LOWER($2)',
            [req.accountId, req.userEmail]
        );
        if (!me.rows[0] || !['owner', 'admin'].includes(me.rows[0].role)) {
            return res.status(403).json({ error: 'אין הרשאה' });
        }

        const lowerEmail = email.toLowerCase().trim();
        await db.query(
            'INSERT INTO account_members (account_id, user_email, role, invited_by) VALUES ($1, $2, $3, $4) ON CONFLICT (account_id, user_email) DO UPDATE SET role = $3',
            [req.accountId, lowerEmail, role, req.userAccountId]
        );
        // אם אין עדיין חשבון לאימייל הזה — החבר יוכל להירשם בעצמו ויקבל את הגישה אוטומטית.
        res.status(201).json({ success: true, message: 'החבר נוסף. אם אינו רשום, יקבל גישה אוטומטית בעת הרשמה.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// עדכון תפקיד
router.patch('/members/:id', accountAuth, async (req, res) => {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'role לא תקין' });
    try {
        const me = await db.query(
            'SELECT role FROM account_members WHERE account_id = $1 AND LOWER(user_email) = LOWER($2)',
            [req.accountId, req.userEmail]
        );
        if (!me.rows[0] || me.rows[0].role !== 'owner') return res.status(403).json({ error: 'רק owner יכול לשנות תפקידים' });

        const r = await db.query(
            "UPDATE account_members SET role = $1 WHERE id = $2 AND account_id = $3 AND role != 'owner' RETURNING *",
            [role, req.params.id, req.accountId]
        );
        if (!r.rows[0]) return res.status(404).json({ error: 'חבר לא נמצא או שהוא owner' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// הסרת חבר
router.delete('/members/:id', accountAuth, async (req, res) => {
    try {
        const me = await db.query(
            'SELECT role FROM account_members WHERE account_id = $1 AND LOWER(user_email) = LOWER($2)',
            [req.accountId, req.userEmail]
        );
        if (!me.rows[0] || !['owner', 'admin'].includes(me.rows[0].role)) {
            return res.status(403).json({ error: 'אין הרשאה' });
        }
        const r = await db.query(
            "DELETE FROM account_members WHERE id = $1 AND account_id = $2 AND role != 'owner'",
            [req.params.id, req.accountId]
        );
        if (r.rowCount === 0) return res.status(404).json({ error: 'חבר לא נמצא או שהוא owner' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
