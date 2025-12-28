const db = require('../config/db');

exports.getStatuses = async (req, res) => {
    const { type } = req.query;
    try {
        const result = await db.query('SELECT * FROM statuses WHERE entity_type = $1', [type]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addStatus = async (req, res) => {
    const { name, color, entity_type } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO statuses (name, color, entity_type) VALUES ($1, $2, $3) RETURNING *',
            [name, color, entity_type]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
