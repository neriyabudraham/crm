const express = require('express');
const router = express.Router();
const { apiKeyAuth } = require('../../middlewares/apiKeyMiddleware');
const { accountAuth } = require('../../middlewares/accountMiddleware');

const clientsV1 = require('./clients');
const paymentsV1 = require('./payments');
const questionnairesV1 = require('./questionnaires');
const apiKeysAdmin = require('./apiKeys');

// כל ה-endpoints תחת v1 קולטים EITHER X-API-Key OR Bearer JWT
// (כדי שגם הfrontend וגם integrations חיצוניים יוכלו להשתמש)
const dualAuth = (req, res, next) => {
    if (req.headers['x-api-key'] || req.query.api_key) return apiKeyAuth(req, res, next);
    return accountAuth(req, res, next);
};

router.use('/clients', dualAuth, clientsV1);
router.use('/payments', dualAuth, paymentsV1);
router.use('/questionnaires', dualAuth, questionnairesV1);

// ניהול API keys — תמיד דרך JWT (לא דרך API key)
router.use('/api-keys', accountAuth, apiKeysAdmin);

module.exports = router;
