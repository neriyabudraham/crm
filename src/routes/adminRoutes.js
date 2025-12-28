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
router.delete('/fields/:id', customFieldController.deleteField);

// תשלומים
router.get('/payments/client/:clientId', paymentController.getClientPayments);
router.post('/payments/schedule', paymentController.createSchedule);
router.patch('/payments/:id', paymentController.updateStatus);

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

module.exports = router;
