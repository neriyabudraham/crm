const db = require('../config/db');

exports.uploadTemplate = async (req, res) => {
    const { name, entity_type } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const filePath = 'uploads/' + file.filename;
        const result = await db.query(
            'INSERT INTO pdf_templates (name, file_path, entity_type) VALUES ($1, $2, $3) RETURNING id',
            [name, filePath, entity_type]
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
        await db.query(
            'UPDATE pdf_templates SET sig_x = $1, sig_y = $2, sig_page = $3 WHERE id = $4',
            [sig_x, sig_y, sig_page, id]
        );
        res.json({ message: 'Signature coordinates updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTemplates = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM pdf_templates');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
