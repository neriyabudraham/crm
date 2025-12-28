const cron = require('node-cron');
const db = require('../config/db');
const whatsapp = require('./whatsappService');

// סריקה בכל יום ב-09:00 בבוקר
cron.schedule('0 9 * * *', async () => {
    console.log("Running daily payment check...");
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await db.query(
            'SELECT p.*, c.full_name, c.phone FROM payments p JOIN clients c ON p.client_id = c.id WHERE p.due_date = $1 AND p.status = $2',
            [today, 'pending']
        );

        for (let payment of result.rows) {
            const msg = `היי ${payment.full_name}, תזכורת לתשלום על סך ${payment.amount} ש"ח להיום.`;
            // שליחה (כאן תבחר איזה session להשתמש כברירת מחדל)
            await whatsapp.sendText('default', payment.phone.includes('@') ? payment.phone : `${payment.phone}@c.us`, msg);
        }
    } catch (err) {
        console.error("Cron Error:", err);
    }
});
