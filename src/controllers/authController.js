const db = require('../config/db');
const jwt = require('jsonwebtoken');

const getUsersList = async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, role FROM users ORDER BY username ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('GetUsers Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    const { userId, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user || String(user.password) !== String(password)) {
            return res.status(401).json({ success: false, message: 'סיסמה שגויה' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'supersecret',
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true, 
            token, 
            user: { id: user.id, username: user.username, role: user.role } 
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getUsersList,
    login
};
