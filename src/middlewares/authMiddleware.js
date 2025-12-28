const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crm_secret_key_2025');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Requires Admin role" });
    next();
};
