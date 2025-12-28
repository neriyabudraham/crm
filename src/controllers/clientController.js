const db = require('../config/db');

// יצירת ליד חדש עם תמיכה בשדות מותאמים וסטטוס
exports.createClient = async (req, res) => {
    const { full_name, phone, email, source, status_name, custom_fields_data = {}, entity_type = 'bride' } = req.body;
    try {
        // בדיקת כפילות טלפון
        const existing = await db.query('SELECT id FROM clients WHERE phone = $1 AND entity_type = $2', [phone, entity_type]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'DUPLICATE', message: 'מספר הטלפון כבר קיים במערכת' });
        }

        const result = await db.query(
            'INSERT INTO clients (full_name, phone, email, source, status_name, custom_fields_data, entity_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [full_name, phone, email, source, status_name || 'חדש', custom_fields_data, entity_type]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// עדכון ליד (כולל שדות מותאמים)
exports.updateClient = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, email, status_name, source, custom_fields_data, general_notes } = req.body;
    try {
        const result = await db.query(
            `UPDATE clients 
             SET full_name = COALESCE($1, full_name), 
                 phone = COALESCE($2, phone), 
                 email = COALESCE($3, email), 
                 status_name = COALESCE($4, status_name), 
                 source = COALESCE($5, source), 
                 custom_fields_data = COALESCE($6, custom_fields_data),
                 general_notes = COALESCE($7, general_notes)
             WHERE id = $8 RETURNING *`,
            [full_name, phone, email, status_name, source, custom_fields_data, general_notes, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteClient = async (req, res) => {
    await db.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ success: true });
};

exports.getClients = async (req, res) => {
    const result = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(result.rows);
};

exports.getClientById = async (req, res) => {
    const result = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
};
