const db = require('../config/db');
const jwt = require('jsonwebtoken');

const getUsersList = async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, role, permissions FROM users ORDER BY username ASC');
        res.json(result.rows);
    } catch (err) {
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
            { id: user.id, username: user.username, role: user.role, permissions: user.permissions },
            process.env.JWT_SECRET || 'supersecret',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username, role: user.role, permissions: user.permissions }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createUser = async (req, res) => {
    const { username, password, role, permissions } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO users (username, password, role, permissions) VALUES ($1, $2, $3, $4) RETURNING id, username, role, permissions',
            [username, password, role || 'user', permissions ? JSON.stringify(permissions) : null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'שם המשתמש כבר קיים' });
        res.status(500).json({ error: err.message });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, role, permissions } = req.body;
    try {
        let query, params;
        if (password) {
            query = 'UPDATE users SET username = COALESCE($1, username), password = $2, role = COALESCE($3, role), permissions = COALESCE($4, permissions) WHERE id = $5 RETURNING id, username, role, permissions';
            params = [username, password, role, permissions ? JSON.stringify(permissions) : null, id];
        } else {
            query = 'UPDATE users SET username = COALESCE($1, username), role = COALESCE($2, role), permissions = COALESCE($3, permissions) WHERE id = $4 RETURNING id, username, role, permissions';
            params = [username, role, permissions ? JSON.stringify(permissions) : null, id];
        }
        const result = await db.query(query, params);
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'שם המשתמש כבר קיים' });
        res.status(500).json({ error: err.message });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getUsersList, login, createUser, updateUser, deleteUser };
