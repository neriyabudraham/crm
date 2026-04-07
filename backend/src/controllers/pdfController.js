const pdfService = require('../services/pdfService');
const db = require('../config/db');
const path = require('path');

exports.signClientDocument = async (req, res) => {
    const { clientId, templateId, signatureBase64, x, y, page } = req.body;

    try {
        // שליפת נתיב הטמפלייט
        const templateRes = await db.query('SELECT file_path FROM document_templates WHERE id = $1', [templateId]);
        if (templateRes.rows.length === 0) return res.status(404).json({ error: "Template not found" });

        const originalPath = path.join(__dirname, '../../', templateRes.rows[0].file_path);
        
        // יצירת הקובץ החתום
        const { outputPath, fileName } = await pdfService.signDocument(originalPath, signatureBase64, x, y, page || 0);

        // עדכון בכרטיס לקוח (הוספה למסמכים שלו)
        await db.query(
            "UPDATE clients SET custom_fields = custom_fields || jsonb_build_object('last_signed_doc', $1) WHERE id = $2",
            [fileName, clientId]
        );

        res.json({ 
            success: true, 
            fileName, 
            downloadUrl: `/uploads/${fileName}` 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
