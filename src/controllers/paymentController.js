const db = require('../config/db');
const paymentService = require('../services/paymentService');

exports.createSchedule = async (req, res) => {
    const { clientId, totalAmount, installments, startDate } = req.body;
    try {
        const result = await paymentService.generatePaymentSchedule(clientId, totalAmount, installments, startDate);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, invoice_number, payment_method } = req.body;
    try {
        await db.query(
            'UPDATE payments SET status = $1, invoice_number = $2, payment_method = $3 WHERE id = $4',
            [status, invoice_number, payment_method, id]
        );
        res.json({ message: 'Payment updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getClientPayments = async (req, res) => {
    const { clientId } = req.params;
    try {
        const result = await db.query('SELECT * FROM payments WHERE client_id = $1 ORDER BY due_date ASC', [clientId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
