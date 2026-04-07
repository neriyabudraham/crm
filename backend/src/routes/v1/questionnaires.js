const express = require('express');
const router = express.Router();
const db = require('../../config/db');

/**
 * @swagger
 * /v1/questionnaires:
 *   get:
 *     summary: רשימת שאלונים
 *     tags: [Questionnaires]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200: { description: רשימת שאלונים }
 */
router.get('/', async (req, res) => {
    try {
        const r = await db.query('SELECT * FROM questionnaires WHERE account_id = $1 ORDER BY created_at DESC', [req.accountId]);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/questionnaires/{id}:
 *   get:
 *     summary: פרטי שאלון
 *     tags: [Questionnaires]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: פרטי שאלון }
 *       404: { description: לא נמצא }
 */
router.get('/:id', async (req, res) => {
    try {
        const r = await db.query('SELECT * FROM questionnaires WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
        if (!r.rows[0]) return res.status(404).json({ error: 'שאלון לא נמצא' });
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /v1/questionnaires/{id}/sessions:
 *   get:
 *     summary: רשימת sessions של שאלון (תשובות שמולאו)
 *     tags: [Questionnaires]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: רשימת sessions }
 */
router.get('/:id/sessions', async (req, res) => {
    try {
        const r = await db.query(
            `SELECT qs.* FROM questionnaire_sessions qs
             JOIN questionnaires q ON q.id = qs.questionnaire_id
             WHERE qs.questionnaire_id = $1 AND q.account_id = $2
             ORDER BY qs.created_at DESC`,
            [req.params.id, req.accountId]
        );
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
