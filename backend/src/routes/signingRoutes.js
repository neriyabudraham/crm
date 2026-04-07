const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// יצירת session חתימה עם טוקן ייחודי
router.post('/sessions', async (req, res) => {
    const { client_id, template_id } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    try {
        const result = await db.query(
            'INSERT INTO signing_sessions (token, client_id, template_id) VALUES ($1, $2, $3) RETURNING *',
            [token, client_id, template_id]
        );
        const signingUrl = `https://crm.botomat.co.il/sign/${token}`;
        res.json({ session: result.rows[0], signingUrl });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// קבלת פרטי session לפי טוקן (ציבורי - ללא auth)
router.get('/session/:token', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT ss.*, pt.name as template_name, pt.signature_positions,
                    c.full_name as client_name, c.phone as client_phone,
                    c.email as client_email, c.source as client_source
             FROM signing_sessions ss
             JOIN pdf_templates pt ON ss.template_id = pt.id
             JOIN clients c ON ss.client_id = c.id
             WHERE ss.token = $1`,
            [req.params.token]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'לא נמצא' });
        if (result.rows[0].status === 'signed') return res.status(400).json({ error: 'המסמך כבר נחתם', signed: true });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// קבלת PDF preview (ציבורי)
router.get('/session/:token/pdf', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT pt.file_path FROM signing_sessions ss
             JOIN pdf_templates pt ON ss.template_id = pt.id
             WHERE ss.token = $1 AND ss.status = 'pending'`,
            [req.params.token]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'לא נמצא' });
        const filePath = path.join(__dirname, '../../', result.rows[0].file_path);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'קובץ לא נמצא' });
        res.sendFile(filePath);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// קבלת אלמנטים של תבנית (ציבורי - לטופס חתימה)
router.get('/session/:token/elements', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT pt.elements FROM signing_sessions ss
             JOIN pdf_templates pt ON ss.template_id = pt.id
             WHERE ss.token = $1`,
            [req.params.token]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'לא נמצא' });
        res.json(result.rows[0].elements || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// חתימה על המסמך (ציבורי)
router.post('/session/:token/sign', async (req, res) => {
    const { signatureBase64, formData } = req.body;
    if (!signatureBase64) return res.status(400).json({ error: 'חתימה חסרה' });

    try {
        const sessionRes = await db.query(
            `SELECT ss.*, pt.file_path, pt.signature_positions, pt.elements, pt.sig_x, pt.sig_y, pt.sig_page
             FROM signing_sessions ss
             JOIN pdf_templates pt ON ss.template_id = pt.id
             WHERE ss.token = $1 AND ss.status = 'pending'`,
            [req.params.token]
        );
        if (!sessionRes.rows[0]) return res.status(404).json({ error: 'Session לא תקין או כבר נחתם' });

        const session = sessionRes.rows[0];
        const templatePath = path.join(__dirname, '../../', session.file_path);
        if (!fs.existsSync(templatePath)) return res.status(404).json({ error: 'קובץ תבנית לא נמצא' });

        const existingPdfBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // הכנת חתימה
        let signatureImage;
        const base64Data = signatureBase64.replace(/^data:image\/(png|jpeg);base64,/, '');
        const imgBytes = Buffer.from(base64Data, 'base64');
        if (signatureBase64.includes('image/jpeg')) {
            signatureImage = await pdfDoc.embedJpg(imgBytes);
        } else {
            signatureImage = await pdfDoc.embedPng(imgBytes);
        }

        const { createCanvas, registerFont } = require('canvas');

        // רישום פונט עברי
        const fontPath = path.join(__dirname, '../../fonts/Assistant-Regular.ttf');
        try { registerFont(fontPath, { family: 'Assistant' }); } catch(e) {}

        const pages = pdfDoc.getPages();
        const elements = session.elements || [];

        // פונקציה ליצירת תמונת טקסט RTL
        const textToImage = (text, width, height, opts = {}) => {
            const scale = 3;
            const canvas = createCanvas(width * scale, height * scale);
            const ctx = canvas.getContext('2d');
            const fontSize = Math.min(height * 0.75 * scale, 18 * scale);
            ctx.font = `bold ${fontSize}px Assistant, sans-serif`;
            ctx.fillStyle = opts.color || '#1a1a2e';
            ctx.textBaseline = 'middle';
            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            ctx.fillText(text, (width * scale) - 2, (height * scale) * 0.42);
            return canvas.toBuffer('image/png');
        };

        // פונקציה ליצירת V checkbox
        const checkboxImage = (width, height, checked) => {
            const scale = 3;
            const canvas = createCanvas(width * scale, height * scale);
            const ctx = canvas.getContext('2d');
            if (checked) {
                ctx.strokeStyle = '#7c3aed';
                ctx.lineWidth = 3 * scale;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                // draw checkmark
                const w = width * scale, h = height * scale;
                ctx.beginPath();
                ctx.moveTo(w * 0.2, h * 0.5);
                ctx.lineTo(w * 0.4, h * 0.75);
                ctx.lineTo(w * 0.8, h * 0.25);
                ctx.stroke();
            }
            return canvas.toBuffer('image/png');
        };

        for (const el of elements) {
            const pageIdx = (el.page || 1) - 1;
            if (pageIdx >= pages.length) continue;
            const page = pages[pageIdx];
            const { height: pageH } = page.getSize();

            const pdfX = el.x || 0;
            const pdfY = pageH - (el.y || 0) - (el.height || 0);
            const elW = el.width || 100;
            const elH = el.height || 30;

            if (el.type === 'signature') {
                page.drawImage(signatureImage, {
                    x: pdfX, y: pdfY, width: elW, height: elH
                });
            } else if (el.type === 'checkbox') {
                const checked = formData?.[el.id];
                const imgBytes = checkboxImage(elW, elH, checked);
                const img = await pdfDoc.embedPng(imgBytes);
                page.drawImage(img, { x: pdfX, y: pdfY, width: elW, height: elH });
            } else if (el.type === 'text' || el.type === 'select') {
                const text = formData?.[el.id] || '';
                if (text) {
                    const imgBytes = textToImage(text, elW, elH);
                    const img = await pdfDoc.embedPng(imgBytes);
                    page.drawImage(img, { x: pdfX, y: pdfY, width: elW, height: elH });
                }
            } else if (el.type === 'date') {
                let dateStr = formData?.[el.id] || '';
                if (dateStr) {
                    const parts = dateStr.split('-');
                    if (parts.length === 3) dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
                if (!dateStr) {
                    const now = new Date();
                    dateStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
                }
                const imgBytes = textToImage(dateStr, elW, elH);
                const img = await pdfDoc.embedPng(imgBytes);
                page.drawImage(img, { x: pdfX, y: pdfY, width: elW, height: elH });
            } else if (el.type === 'time') {
                const timeStr = formData?.[el.id] || el.defaultTime || '';
                if (timeStr) {
                    const imgBytes = textToImage(timeStr, elW, elH);
                    const img = await pdfDoc.embedPng(imgBytes);
                    page.drawImage(img, { x: pdfX, y: pdfY, width: elW, height: elH });
                }
            }
        }

        // שמירת ה-PDF החתום
        const pdfBytes = await pdfDoc.save();
        const fileName = `signed_${session.client_id}_${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../../uploads', fileName);

        // ודא שתיקיית uploads קיימת
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        fs.writeFileSync(outputPath, pdfBytes);

        // עדכון session
        await db.query(
            "UPDATE signing_sessions SET status = 'signed', signed_at = NOW() WHERE id = $1",
            [session.id]
        );

        // שמירת מסמך חתום
        await db.query(
            'INSERT INTO signed_documents (client_id, template_id, session_id, file_path) VALUES ($1, $2, $3, $4)',
            [session.client_id, session.template_id, session.id, 'uploads/' + fileName]
        );

        if (global.notifyClient) global.notifyClient(session.client_id, 'client_updated');

        res.json({
            success: true,
            downloadUrl: `/uploads/${fileName}`,
            fileName
        });
    } catch (err) {
        console.error('Signing error:', err);
        res.status(500).json({ error: err.message });
    }
});

// רשימת מסמכים חתומים של ליד
router.get('/client/:clientId/documents', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT sd.*, pt.name as template_name
             FROM signed_documents sd
             JOIN pdf_templates pt ON sd.template_id = pt.id
             WHERE sd.client_id = $1 ORDER BY sd.signed_at DESC`,
            [req.params.clientId]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// מחיקת session חתימה
router.delete('/sessions/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM signing_sessions WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// מחיקת מסמך חתום
router.delete('/documents/:id', async (req, res) => {
    try {
        const doc = await db.query('SELECT file_path FROM signed_documents WHERE id = $1', [req.params.id]);
        if (doc.rows[0]) {
            const filePath = path.join(__dirname, '../../', doc.rows[0].file_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.query('DELETE FROM signed_documents WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// רשימת sessions חתימה של ליד
router.get('/client/:clientId/sessions', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT ss.*, pt.name as template_name
             FROM signing_sessions ss
             JOIN pdf_templates pt ON ss.template_id = pt.id
             WHERE ss.client_id = $1 ORDER BY ss.created_at DESC`,
            [req.params.clientId]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
