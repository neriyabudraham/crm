const db = require('../config/db');

const getFields = async (req, res) => {
    const { type } = req.query;
    try {
        let result;
        if (type) {
            result = await db.query('SELECT * FROM custom_fields WHERE entity_type = $1 AND account_id = $2 ORDER BY field_order ASC', [type, req.accountId]);
        } else {
            result = await db.query('SELECT * FROM custom_fields WHERE account_id = $1 ORDER BY field_order ASC', [req.accountId]);
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createField = async (req, res) => {
    const { entity_type, field_name, field_type, is_required, field_order, options } = req.body;
    try {
        const dbFieldType = (field_type === 'checkbox' || field_type === 'payment_total') ? 'text' : field_type;
        const result = await db.query(
            'INSERT INTO custom_fields (entity_type, field_name, field_type, is_required, field_order, options, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [entity_type || 'bride', field_name, dbFieldType, is_required || false, field_order || 0, options ? JSON.stringify(options) : null, req.accountId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateField = async (req, res) => {
    const { id } = req.params;
    const { sort_order, field_name, is_required } = req.body;
    try {
        const result = await db.query(
            'UPDATE custom_fields SET field_order = COALESCE($1, field_order), field_name = COALESCE($2, field_name), is_required = COALESCE($3, is_required) WHERE id = $4 AND account_id = $5 RETURNING *',
            [sort_order, field_name, is_required, id, req.accountId]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'שדה לא נמצא' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteField = async (req, res) => {
    const { id } = req.params;
    try {
        const r = await db.query('DELETE FROM custom_fields WHERE id = $1 AND account_id = $2', [id, req.accountId]);
        if (r.rowCount === 0) return res.status(404).json({ error: 'שדה לא נמצא' });
        res.json({ message: 'Field deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getFields, createField, updateField, deleteField };
