const jwt = require('jsonwebtoken');
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'crm_admin_secret_2025';

// דורש token של superadmin/admin
const superAdminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'לא מחובר' });
    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_ADMIN_SECRET);
        if (!decoded.adminId) return res.status(403).json({ error: 'לא מורשה' });
        req.adminId = decoded.adminId;
        req.adminRole = decoded.role;
        req.adminEmail = decoded.email;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token לא תקין' });
    }
};

// דורש דרגת superadmin בלבד
const requireSuperAdmin = (req, res, next) => {
    if (req.adminRole !== 'superadmin') return res.status(403).json({ error: 'נדרשת הרשאת superadmin' });
    next();
};

module.exports = { superAdminAuth, requireSuperAdmin, JWT_ADMIN_SECRET };
