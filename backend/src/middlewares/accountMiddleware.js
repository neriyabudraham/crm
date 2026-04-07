const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'crm_secret_key_2025';

// In-memory cache קצר ל-membership lookups (5 שניות) — מקטין עומס על DB
const membershipCache = new Map();
const MEMBERSHIP_TTL_MS = 5_000;

const verifyMembership = async (userEmail, accountId) => {
    const key = `${userEmail.toLowerCase()}|${accountId}`;
    const cached = membershipCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.role;

    const r = await db.query(
        'SELECT role FROM account_members WHERE account_id = $1 AND LOWER(user_email) = LOWER($2)',
        [accountId, userEmail]
    );
    const role = r.rows[0]?.role || null;
    membershipCache.set(key, { role, expiresAt: Date.now() + MEMBERSHIP_TTL_MS });
    return role;
};

const accountAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'לא מחובר' });

    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);

        // Backwards-compat: tokens ישנים שיש להם רק accountId/email
        const userEmail = decoded.userEmail || decoded.email;
        const userAccountId = decoded.userAccountId || decoded.accountId;
        const accountId = decoded.accountId;

        if (!userEmail || !accountId) return res.status(401).json({ error: 'Token לא תקין' });

        // ודא membership — חוסם data leak בין tenants
        const role = await verifyMembership(userEmail, accountId);
        if (!role) return res.status(403).json({ error: 'אין גישה לחשבון הזה' });

        req.accountId = accountId;
        req.accountEmail = userEmail;
        req.userEmail = userEmail;
        req.userAccountId = userAccountId;
        req.memberRole = role;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token לא תקין' });
    }
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
            req.accountId = decoded.accountId;
            req.userEmail = decoded.userEmail || decoded.email;
        } catch (err) { /* ignore */ }
    }
    next();
};

module.exports = { accountAuth, optionalAuth };
