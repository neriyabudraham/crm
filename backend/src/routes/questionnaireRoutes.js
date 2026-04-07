const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { accountAuth } = require('../middlewares/accountMiddleware');

// CRUD שאלונים — מוגן
router.get('/', accountAuth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM questionnaires WHERE account_id = $1 ORDER BY created_at DESC', [req.accountId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', accountAuth, async (req, res) => {
    const { name, entity_type, fields, field_mapping } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO questionnaires (name, entity_type, fields, field_mapping, account_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, entity_type || 'bride', JSON.stringify(fields || []), JSON.stringify(field_mapping || {}), req.accountId]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', accountAuth, async (req, res) => {
    const { name, fields, field_mapping, entity_type } = req.body;
    try {
        const result = await db.query(
            'UPDATE questionnaires SET name = COALESCE($1, name), fields = COALESCE($2, fields), field_mapping = COALESCE($3, field_mapping), entity_type = COALESCE($4, entity_type) WHERE id = $5 AND account_id = $6 RETURNING *',
            [name, fields ? JSON.stringify(fields) : null, field_mapping ? JSON.stringify(field_mapping) : null, entity_type !== undefined ? entity_type : null, req.params.id, req.accountId]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'שאלון לא נמצא' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', accountAuth, async (req, res) => {
    try {
        const r = await db.query('DELETE FROM questionnaires WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
        if (r.rowCount === 0) return res.status(404).json({ error: 'שאלון לא נמצא' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// יצירת session שאלון עם טוקן — מוגן
router.post('/sessions', accountAuth, async (req, res) => {
    const { questionnaire_id, client_id } = req.body;
    try {
        // ודא שהשאלון והלקוח שייכים לחשבון
        const own = await db.query(
            'SELECT (SELECT account_id FROM questionnaires WHERE id = $1) AS q, (SELECT account_id FROM clients WHERE id = $2) AS c',
            [questionnaire_id, client_id]
        );
        if (own.rows[0].q !== req.accountId || own.rows[0].c !== req.accountId) {
            return res.status(403).json({ error: 'אין הרשאה' });
        }

        const existing = await db.query(
            'SELECT * FROM questionnaire_sessions WHERE questionnaire_id = $1 AND client_id = $2 ORDER BY created_at DESC LIMIT 1',
            [questionnaire_id, client_id]
        );
        if (existing.rows[0]) {
            const url = `https://crm.botomat.co.il/questionnaire/${existing.rows[0].token}`;
            return res.json({ session: existing.rows[0], url, existing: true });
        }
        const token = crypto.randomBytes(32).toString('hex');
        const result = await db.query(
            'INSERT INTO questionnaire_sessions (token, questionnaire_id, client_id, account_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [token, questionnaire_id, client_id, req.accountId]
        );
        const url = `https://crm.botomat.co.il/questionnaire/${result.rows[0].token}`;
        res.json({ session: result.rows[0], url });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// קבלת שאלון ציבורי לפי טוקן
router.get('/session/:token', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT qs.*, q.name as questionnaire_name, q.fields, c.full_name as client_name
             FROM questionnaire_sessions qs
             JOIN questionnaires q ON qs.questionnaire_id = q.id
             JOIN clients c ON qs.client_id = c.id
             WHERE qs.token = $1`,
            [req.params.token]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'לא נמצא' });
        // אם כבר הוגש, מאפשר עדכון - מחזיר עם התשובות הקיימות
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// שליחת תשובות שאלון (ציבורי)
router.post('/session/:token/submit', async (req, res) => {
    const { answers } = req.body;
    try {
        const sessionRes = await db.query(
            `SELECT qs.*, q.field_mapping FROM questionnaire_sessions qs
             JOIN questionnaires q ON qs.questionnaire_id = q.id
             WHERE qs.token = $1`,
            [req.params.token]
        );
        if (!sessionRes.rows[0]) return res.status(404).json({ error: 'Session לא תקין' });

        const session = sessionRes.rows[0];
        const mapping = session.field_mapping || {};

        // עדכון session
        await db.query(
            "UPDATE questionnaire_sessions SET status = 'submitted', answers = $1, submitted_at = NOW() WHERE id = $2",
            [JSON.stringify(answers), session.id]
        );

        // מיפוי תשובות לשדות הלקוח
        const clientUpdates = {};
        const customFieldsUpdates = {};

        for (const [fieldId, targetField] of Object.entries(mapping)) {
            const answer = answers[fieldId];
            if (answer === undefined) continue;

            if (['full_name', 'phone', 'email', 'source', 'status_name'].includes(targetField)) {
                clientUpdates[targetField] = answer;
            } else {
                customFieldsUpdates[targetField] = answer;
            }
        }

        // עדכון שדות רגילים
        if (Object.keys(clientUpdates).length > 0) {
            const setClauses = Object.keys(clientUpdates).map((k, i) => `${k} = $${i + 1}`).join(', ');
            const values = Object.values(clientUpdates);
            await db.query(`UPDATE clients SET ${setClauses} WHERE id = $${values.length + 1}`, [...values, session.client_id]);
        }

        // עדכון שדות מותאמים
        if (Object.keys(customFieldsUpdates).length > 0) {
            await db.query(
                "UPDATE clients SET custom_fields_data = COALESCE(custom_fields_data, '{}') || $1 WHERE id = $2",
                [JSON.stringify(customFieldsUpdates), session.client_id]
            );
        }

        // עדכון בזמן אמת
        if (global.notifyClient) global.notifyClient(session.client_id, 'questionnaire_updated');

        res.json({ success: true });
    } catch (err) {
        console.error('Questionnaire submit error:', err);
        res.status(500).json({ error: err.message });
    }
});

// sessions של לקוח — מוגן
router.get('/client/:clientId/sessions', accountAuth, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT qs.*, q.name as questionnaire_name, q.fields as questionnaire_fields
             FROM questionnaire_sessions qs
             JOIN questionnaires q ON qs.questionnaire_id = q.id
             JOIN clients c ON c.id = qs.client_id
             WHERE qs.client_id = $1 AND c.account_id = $2 ORDER BY qs.created_at DESC`,
            [req.params.clientId, req.accountId]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// העלאת קובץ לשאלון
const upload = require('../middlewares/uploadMiddleware');
router.post('/session/:token/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'לא הועלה קובץ' });
        const filePath = 'uploads/' + req.file.filename;
        res.json({ success: true, filePath, url: '/' + filePath });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
