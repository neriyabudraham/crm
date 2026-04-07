const express = require('express');
const router = express.Router();
const db = require('../../config/db');

/**
 * @swagger
 * /v1/clients:
 *   get:
 *     summary: רשימת לקוחות
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *           enum: [bride, course]
 *         description: סינון לפי סוג ישות
 *     responses:
 *       200:
 *         description: רשימת לקוחות בחשבון
 */
router.get('/', async (req, res) => {
    try {
        const { entity_type } = req.query;
        const params = [req.accountId];
        let sql = 'SELECT * FROM clients WHERE account_id = $1';
        if (entity_type) { sql += ' AND entity_type = $2'; params.push(entity_type); }
        sql += ' ORDER BY created_at DESC';
        const r = await db.query(sql, params);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/clients/{id}:
 *   get:
 *     summary: פרטי לקוח לפי מזהה
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: פרטי הלקוח }
 *       404: { description: לא נמצא }
 */
router.get('/:id', async (req, res) => {
    try {
        const r = await db.query('SELECT * FROM clients WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
        if (!r.rows[0]) return res.status(404).json({ error: 'לקוח לא נמצא' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/clients:
 *   post:
 *     summary: יצירת לקוח חדש
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, phone]
 *             properties:
 *               full_name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               source: { type: string }
 *               status_name: { type: string }
 *               entity_type: { type: string, enum: [bride, course] }
 *               custom_fields_data: { type: object }
 *     responses:
 *       201: { description: לקוח נוצר }
 *       409: { description: טלפון כבר קיים }
 */
router.post('/', async (req, res) => {
    const { full_name, phone, email, source, status_name, entity_type = 'bride', custom_fields_data = {} } = req.body;
    if (!full_name || !phone) return res.status(400).json({ error: 'full_name ו-phone נדרשים' });
    try {
        const dup = await db.query('SELECT id FROM clients WHERE phone = $1 AND entity_type = $2 AND account_id = $3', [phone, entity_type, req.accountId]);
        if (dup.rows[0]) return res.status(409).json({ error: 'מספר טלפון כבר קיים' });
        const r = await db.query(
            `INSERT INTO clients (full_name, phone, email, source, status_name, custom_fields_data, entity_type, account_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [full_name, phone, email, source, status_name || 'חדש', custom_fields_data, entity_type, req.accountId]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/clients/{id}:
 *   patch:
 *     summary: עדכון לקוח
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: עודכן }
 *       404: { description: לא נמצא }
 */
router.patch('/:id', async (req, res) => {
    const { full_name, phone, email, status_name, source, custom_fields_data, general_notes } = req.body;
    try {
        const r = await db.query(
            `UPDATE clients SET
              full_name = COALESCE($1, full_name),
              phone = COALESCE($2, phone),
              email = COALESCE($3, email),
              status_name = COALESCE($4, status_name),
              source = COALESCE($5, source),
              custom_fields_data = COALESCE($6, custom_fields_data),
              general_notes = COALESCE($7, general_notes)
             WHERE id = $8 AND account_id = $9 RETURNING *`,
            [full_name, phone, email, status_name, source, custom_fields_data, general_notes, req.params.id, req.accountId]
        );
        if (!r.rows[0]) return res.status(404).json({ error: 'לקוח לא נמצא' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/clients/{id}:
 *   delete:
 *     summary: מחיקת לקוח
 *     tags: [Clients]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: נמחק }
 */
router.delete('/:id', async (req, res) => {
    try {
        const r = await db.query('DELETE FROM clients WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
        if (r.rowCount === 0) return res.status(404).json({ error: 'לקוח לא נמצא' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
