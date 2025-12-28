const db = require('../config/db');

const getFields = async (req, res) => {
    const { type } = req.query;
    try {
        const result = await db.query('SELECT * FROM custom_fields WHERE entity_type = $1 ORDER BY field_order ASC', [type]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createField = async (req, res) => {
    const { entity_type, field_name, field_type, is_required, field_order, options } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO custom_fields (entity_type, field_name, field_type, is_required, field_order, options) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [entity_type, field_name, field_type, is_required || false, field_order || 0, options ? JSON.stringify(options) : null]
        );
        res.json({ message: 'Field created', id: result.rows[0].id });
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

module.exports = {
    getFields,
    createField,
    deleteField
};
