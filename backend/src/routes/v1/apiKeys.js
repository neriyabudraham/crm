const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../../config/db');
const { hashKey } = require('../../middlewares/apiKeyMiddleware');

/**
 * @swagger
 * /v1/api-keys:
 *   get:
 *     summary: רשימת API keys של החשבון (ללא הraw key)
 *     tags: [ApiKeys]
 *     security:
 *       - BearerAuth: []
 */
router.get('/', async (req, res) => {
    try {
        const r = await db.query(
            'SELECT id, name, permissions, last_used, request_count, is_active, created_at FROM api_keys WHERE account_id = $1 ORDER BY created_at DESC',
            [req.accountId]
        );
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/api-keys:
 *   post:
 *     summary: יצירת API key חדש (מחזיר את הkey raw פעם אחת בלבד)
 *     tags: [ApiKeys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               permissions: { type: array, items: { type: string } }
 */
router.post('/', async (req, res) => {
    const { name, permissions = ['*'] } = req.body;
    if (!name) return res.status(400).json({ error: 'שם נדרש' });
    try {
        const rawKey = 'crm_' + crypto.randomBytes(32).toString('hex');
        const keyHash = hashKey(rawKey);
        const r = await db.query(
            'INSERT INTO api_keys (account_id, name, key_hash, permissions) VALUES ($1, $2, $3, $4) RETURNING id, name, permissions, created_at',
            [req.accountId, name, keyHash, JSON.stringify(permissions)]
        );
        // raw key מוחזר רק כאן
        res.status(201).json({ ...r.rows[0], key: rawKey, warning: 'שמור את הkey הזה — הוא לא יוצג שוב' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/api-keys/{id}:
 *   patch:
 *     summary: הפעלה/חסימה של API key
 *     tags: [ApiKeys]
 *     security:
 *       - BearerAuth: []
 */
router.patch('/:id', async (req, res) => {
    const { is_active, name } = req.body;
    try {
        const sets = []; const vals = []; let i = 1;
        if (is_active !== undefined) { sets.push(`is_active = $${i++}`); vals.push(is_active); }
        if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name); }
        if (sets.length === 0) return res.json({ message: 'Nothing to update' });
        vals.push(req.params.id, req.accountId);
        const r = await db.query(
            `UPDATE api_keys SET ${sets.join(', ')} WHERE id = $${i} AND account_id = $${i + 1} RETURNING id, name, is_active`,
            vals
        );
        if (!r.rows[0]) return res.status(404).json({ error: 'API key לא נמצא' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/api-keys/{id}:
 *   delete:
 *     summary: מחיקת API key
 *     tags: [ApiKeys]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id', async (req, res) => {
    try {
        const r = await db.query('DELETE FROM api_keys WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
        if (r.rowCount === 0) return res.status(404).json({ error: 'API key לא נמצא' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
