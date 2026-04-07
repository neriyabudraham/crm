const db = require('../config/db');

exports.generatePaymentSchedule = async (clientId, totalAmount, installments, startDate, opts = {}) => {
    const amountPerInstallment = (totalAmount / installments).toFixed(2);
    let currentDate = new Date(startDate);
    const { payment_type, payment_method, notes, status, account_id } = opts;

    for (let i = 0; i < installments; i++) {
        const dueDate = currentDate.toISOString().split('T')[0];
        await db.query(
            'INSERT INTO payments (client_id, amount, due_date, status, payment_type, payment_method, notes, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [clientId, amountPerInstallment, dueDate, (i === 0 && status) ? status : 'pending', payment_type || 'regular', payment_method || null, i === 0 ? (notes || null) : null, account_id]
        );
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return { success: true, installments };
};
