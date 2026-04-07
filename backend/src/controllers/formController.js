const db = require('../config/db');

// יצירת הגדרת שאלון (Form Builder)
exports.saveFormStructure = async (req, res) => {
    const { name, fields, entity_type } = req.body; // fields = [{label, key, type, required}]
    try {
        const result = await db.query(
            "INSERT INTO document_templates (name, config, file_path) VALUES ($1, $2, 'form_structure') RETURNING *",
            [name, JSON.stringify(fields)]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// הגשת תשובות שאלון ע"י לקוח
exports.submitForm = async (req, res) => {
    const { clientId, answers } = req.body; // answers = { "wedding_date": "2025-10-10", ... }
    try {
        // עדכון השדות הדינמיים בכרטיס הלקוח
        const result = await db.query(
            "UPDATE clients SET custom_fields = custom_fields || $1 WHERE id = $2 RETURNING *",
            [JSON.stringify(answers), clientId]
        );
        res.json({ success: true, updatedFields: result.rows[0].custom_fields });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
