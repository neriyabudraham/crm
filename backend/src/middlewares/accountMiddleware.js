const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'crm_secret_key_2025';

// Middleware שמוסיף accountId ל-request
const accountAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'לא מחובר' });

    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        req.accountId = decoded.accountId;
        req.accountEmail = decoded.email;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token לא תקין' });
    }
};

// Middleware אופציונלי — אם יש token, מוסיף accountId, אם לא — ממשיך
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jwt.verify(token, JWT_SECRET);
            req.accountId = decoded.accountId;
        } catch (err) {}
    }
    next();
};

module.exports = { accountAuth, optionalAuth };
