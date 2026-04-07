const db = require('../config/db');

exports.globalSearch = async (req, res) => {
    const { q } = req.query; // מילת חיפוש
    try {
        const query = `
            SELECT * FROM clients 
            WHERE full_name ILIKE $1 
            OR phone ILIKE $1 
            OR custom_fields::text ILIKE $1
        `;
        const { rows } = await db.query(query, [`%${q}%`]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
