const db = require('../config/db');

exports.uploadTemplate = async (req, res) => {
    const { name, entity_type } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const filePath = 'uploads/' + file.filename;
        const result = await db.query(
            'INSERT INTO pdf_templates (name, file_path, entity_type, account_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, filePath, entity_type, req.accountId]
        );
        res.json({ message: 'Template uploaded successfully', id: result.rows[0].id, filePath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSignatureCoords = async (req, res) => {
    const { id } = req.params;
    const { sig_x, sig_y, sig_page } = req.body;
    try {
        const r = await db.query(
            'UPDATE pdf_templates SET sig_x = $1, sig_y = $2, sig_page = $3 WHERE id = $4 AND account_id = $5',
            [sig_x, sig_y, sig_page, id, req.accountId]
        );
        if (r.rowCount === 0) return res.status(404).json({ error: 'תבנית לא נמצאה' });
        res.json({ message: 'Signature coordinates updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTemplates = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM pdf_templates WHERE account_id = $1', [req.accountId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
