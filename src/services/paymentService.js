const db = require('../config/db');

exports.generatePaymentSchedule = async (clientId, totalAmount, installments, startDate) => {
    const amountPerInstallment = (totalAmount / installments).toFixed(2);
    let currentDate = new Date(startDate);

    for (let i = 0; i < installments; i++) {
        const dueDate = currentDate.toISOString().split('T')[0];
        await db.query(
            'INSERT INTO payments (client_id, amount, due_date, status) VALUES ($1, $2, $3, $4)',
            [clientId, amountPerInstallment, dueDate, 'pending']
        );
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return { success: true, installments };
};
