const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Botomat CRM API',
            version: '1.0.0',
            description: 'API לניהול לקוחות, תשלומים ושאלונים. תומך באימות דרך X-API-Key או JWT (Bearer).',
            contact: { name: 'Botomat', email: 'office@neriyabudraham.co.il' }
        },
        servers: [
            { url: 'https://crm.botomat.co.il/api', description: 'Production' }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'מפתח API מחשבון. ניתן ליצור בהגדרות → API Keys.'
                },
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT שמתקבל מ-/api/account/login'
                }
            }
        },
        tags: [
            { name: 'Clients', description: 'ניהול לקוחות' },
            { name: 'Payments', description: 'ניהול תשלומים' },
            { name: 'Questionnaires', description: 'שאלונים ותשובות' },
            { name: 'ApiKeys', description: 'ניהול API keys (JWT בלבד)' }
        ]
    },
    apis: [path.join(__dirname, '../routes/v1/*.js')]
};

module.exports = swaggerJsdoc(options);
