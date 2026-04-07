const db = require('../config/db');

const getFields = async (req, res) => {
    const { type } = req.query;
    try {
        let result;
        if (type) {
            result = await db.query('SELECT * FROM custom_fields WHERE entity_type = $1 ORDER BY field_order ASC', [type]);
        } else {
            result = await db.query('SELECT * FROM custom_fields ORDER BY field_order ASC');
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
            'INSERT INTO custom_fields (entity_type, field_name, field_type, is_required, field_order, options) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [entity_type || 'bride', field_name, dbFieldType, is_required || false, field_order || 0, options ? JSON.stringify(options) : null]
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
            'UPDATE custom_fields SET field_order = COALESCE($1, field_order), field_name = COALESCE($2, field_name), is_required = COALESCE($3, is_required) WHERE id = $4 RETURNING *',
            [sort_order, field_name, is_required, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteField = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM custom_fields WHERE id = $1', [id]);
        res.json({ message: 'Field deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getFields, createField, updateField, deleteField };
