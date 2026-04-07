const express = require('express');
const router = express.Router();
const db = require('../../config/db');

/**
 * @swagger
 * /v1/payments:
 *   get:
 *     summary: רשימת תשלומים
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: client_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, paid, cancelled] }
 *     responses:
 *       200: { description: רשימת תשלומים }
 */
router.get('/', async (req, res) => {
    try {
        const { client_id, status } = req.query;
        const params = [req.accountId];
        let sql = 'SELECT * FROM payments WHERE account_id = $1';
        if (client_id) { sql += ` AND client_id = $${params.length + 1}`; params.push(client_id); }
        if (status) { sql += ` AND status = $${params.length + 1}`; params.push(status); }
        sql += ' ORDER BY due_date ASC';
        const r = await db.query(sql, params);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/payments/{id}:
 *   get:
 *     summary: פרטי תשלום
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: פרטי תשלום }
 *       404: { description: לא נמצא }
 */
router.get('/:id', async (req, res) => {
    try {
        const r = await db.query('SELECT * FROM payments WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
        if (!r.rows[0]) return res.status(404).json({ error: 'תשלום לא נמצא' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/payments:
 *   post:
 *     summary: יצירת תשלום בודד
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [client_id, amount, due_date]
 *             properties:
 *               client_id: { type: integer }
 *               amount: { type: number }
 *               due_date: { type: string, format: date }
 *               status: { type: string, enum: [pending, paid, cancelled] }
 *               payment_type: { type: string }
 *               payment_method: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201: { description: נוצר }
 */
router.post('/', async (req, res) => {
    const { client_id, amount, due_date, status, payment_type, payment_method, notes } = req.body;
    if (!client_id || !amount || !due_date) return res.status(400).json({ error: 'client_id, amount, due_date נדרשים' });
    try {
        // ודא שהלקוח שייך לחשבון
        const own = await db.query('SELECT account_id FROM clients WHERE id = $1', [client_id]);
        if (!own.rows[0] || own.rows[0].account_id !== req.accountId) return res.status(403).json({ error: 'אין הרשאה ללקוח' });

        const r = await db.query(
            `INSERT INTO payments (client_id, amount, due_date, status, payment_type, payment_method, notes, account_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [client_id, amount, due_date, status || 'pending', payment_type || 'regular', payment_method, notes, req.accountId]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/payments/{id}:
 *   patch:
 *     summary: עדכון תשלום
 *     tags: [Payments]
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
 */
router.patch('/:id', async (req, res) => {
    const { status, amount, due_date, invoice_number, payment_method, notes } = req.body;
    try {
        const sets = []; const vals = []; let i = 1;
        for (const [k, v] of Object.entries({ status, amount, due_date, invoice_number, payment_method, notes })) {
            if (v !== undefined) { sets.push(`${k} = $${i++}`); vals.push(v); }
        }
        if (sets.length === 0) return res.json({ message: 'Nothing to update' });
        vals.push(req.params.id, req.accountId);
        const r = await db.query(`UPDATE payments SET ${sets.join(', ')} WHERE id = $${i} AND account_id = $${i + 1} RETURNING *`, vals);
        if (!r.rows[0]) return res.status(404).json({ error: 'תשלום לא נמצא' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/payments/{id}:
 *   delete:
 *     summary: מחיקת תשלום
 *     tags: [Payments]
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
        const r = await db.query('DELETE FROM payments WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
        if (r.rowCount === 0) return res.status(404).json({ error: 'תשלום לא נמצא' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
