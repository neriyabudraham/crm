const express = require('express');
const router = express.Router();

const customFieldController = require('../controllers/customFieldController');
const paymentController = require('../controllers/paymentController');
const templateController = require('../controllers/templateController');
const questionnaireController = require('../controllers/questionnaireController');
const whatsappService = require('../services/whatsappService');

// לוג בדיקה - יופיע ב-pm2 logs
console.log('--- Debug Admin Routes ---');
console.log('Fields Keys:', Object.keys(customFieldController));

// שדות דינמיים
router.get('/fields', customFieldController.getFields);
router.post('/fields', customFieldController.createField);
router.patch('/fields/:id', customFieldController.updateField);
router.patch('/fields/:id/options', async (req, res) => {
    const { options } = req.body;
    try {
        await require('../config/db').query('UPDATE custom_fields SET options = $1 WHERE id = $2', [JSON.stringify(options), req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/fields/:id', customFieldController.deleteField);

// תשלומים
router.get('/payments/client/:clientId', paymentController.getClientPayments);
router.post('/payments/schedule', paymentController.createSchedule);
router.patch('/payments/:id', paymentController.updateStatus);
router.delete('/payments/:id', async (req, res) => {
    try {
        await require('../config/db').query('DELETE FROM payments WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// טמפלייטים
router.get('/templates', templateController.getTemplates);
router.patch('/templates/:id/coords', templateController.updateSignatureCoords);

// שאלונים
router.post('/questionnaire/submit', questionnaireController.submitQuestionnaire);

// וואטסאפ
router.get('/whatsapp/groups/:session', async (req, res) => {
    try {
        const groups = await whatsappService.getGroups(req.params.session);
        res.json(groups);
    } catch (err) {
        res.status(422).json({ error: "WhatsApp Session Error", details: err.message });
    }
});

// נתיבים להגדרות מערכת
router.get('/settings/:key', async (req, res) => {
    try {
        const result = await require('../config/db').query('SELECT values FROM system_settings WHERE key = $1', [req.params.key]);
        res.json(result.rows[0]?.values || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/settings/:key', async (req, res) => {
    try {
        const { values } = req.body;
        await require('../config/db').query(
            'INSERT INTO system_settings (key, values) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET values = $2',
            [req.params.key, JSON.stringify(values)]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ניהול סוגי ישויות (entity types)
router.get('/entity-types', async (req, res) => {
    try {
        const result = await require('../config/db').query('SELECT values FROM system_settings WHERE key = $1', ['entity_types']);
        res.json(result.rows[0]?.values || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/entity-types', async (req, res) => {
    try {
        const { values } = req.body;
        await require('../config/db').query(
            'INSERT INTO system_settings (key, values) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET values = $2',
            ['entity_types', JSON.stringify(values)]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
