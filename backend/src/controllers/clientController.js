const db = require('../config/db');

// יצירת ליד חדש עם תמיכה בשדות מותאמים וסטטוס
exports.createClient = async (req, res) => {
    const accountId = req.accountId;
    const { full_name, phone, email, source, status_name, custom_fields_data = {}, entity_type = 'bride' } = req.body;
    try {
        // בדיקת כפילות טלפון בתוך החשבון
        const existing = await db.query('SELECT id FROM clients WHERE phone = $1 AND entity_type = $2 AND account_id = $3', [phone, entity_type, accountId]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'DUPLICATE', message: 'מספר הטלפון כבר קיים במערכת' });
        }

        const result = await db.query(
            'INSERT INTO clients (full_name, phone, email, source, status_name, custom_fields_data, entity_type, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [full_name, phone, email, source, status_name || 'חדש', custom_fields_data, entity_type, accountId]
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
    const accountId = req.accountId;
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
             WHERE id = $8 AND account_id = $9 RETURNING *`,
            [full_name, phone, email, status_name, source, custom_fields_data, general_notes, id, accountId]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'לקוח לא נמצא' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteClient = async (req, res) => {
    const result = await db.query('DELETE FROM clients WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'לקוח לא נמצא' });
    res.json({ success: true });
};

exports.getClients = async (req, res) => {
    const accountId = req.accountId;
    const { entity_type } = req.query;
    let result;
    if (entity_type) {
        result = await db.query('SELECT * FROM clients WHERE entity_type = $1 AND account_id = $2 ORDER BY created_at DESC', [entity_type, accountId]);
    } else {
        result = await db.query('SELECT * FROM clients WHERE account_id = $1 ORDER BY created_at DESC', [accountId]);
    }
    res.json(result.rows);
};

exports.getClientById = async (req, res) => {
    const result = await db.query('SELECT * FROM clients WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'לקוח לא נמצא' });
    res.json(result.rows[0]);
};
