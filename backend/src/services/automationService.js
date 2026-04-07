const db = require('../config/db');
const waService = require('./whatsappService');

exports.checkDailyPayments = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // שליפת כל התשלומים שמועד הפירעון שלהם הוא היום וטרם שולמו
        const query = `
            SELECT p.*, c.full_name, c.phone, c.entity_type 
            FROM payments p
            JOIN clients c ON p.client_id = c.id
            WHERE p.due_date = $1 AND p.actual_amount < p.expected_amount
        `;
        
        const { rows } = await db.query(query, [today]);
        
        for (let payment of rows) {
            const message = `שלום ${payment.full_name}, תזכורת להסדרת תשלום ע"ס ${payment.expected_amount} ש"ח להיום. תודה!`;
            
            // שליחה דרך ה-session המוגדר (למשל 'default')
            await waService.sendText(payment.phone + '@c.us', message, 'default');
            
            console.log(`Sent reminder to ${payment.full_name}`);
        }
    } catch (err) {
        console.error('Automation Error:', err);
    }
};
