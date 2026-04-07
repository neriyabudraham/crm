const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

exports.signExistingPDF = async (templateId, signatureDataUri, clientId) => {
    // 1. שליפת נתוני הטמפלייט (קואורדינטות)
    const db = require('../config/db');
    const [templates] = await db.query('SELECT * FROM pdf_templates WHERE id = ?', [templateId]);
    const template = templates[0];

    // 2. טעינת ה-PDF המקורי
    const existingPdfBytes = fs.readFileSync(path.join(__dirname, '../../', template.file_path));
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // 3. הפיכת החתימה (Base64) לתמונה בתוך ה-PDF
    const signatureImage = await pdfDoc.embedPng(signatureDataUri);
    const pages = pdfDoc.getPages();
    const targetPage = pages[template.sig_page - 1];

    // 4. הטבעת החתימה במיקום המוגדר
    targetPage.drawImage(signatureImage, {
        x: template.sig_x,
        y: template.sig_y,
        width: 100,
        height: 50,
    });

    const pdfBytes = await pdfDoc.save();
    const fileName = `signed_${clientId}_${Date.now()}.pdf`;
    const finalPath = path.join(__dirname, '../../uploads', fileName);
    
    fs.writeFileSync(finalPath, pdfBytes);
    return fileName;
};
