const db = require('../config/db');
const paymentService = require('../services/paymentService');

exports.createSchedule = async (req, res) => {
    const { clientId, totalAmount, installments, startDate, payment_type, payment_method, notes, status } = req.body;
    try {
        const result = await paymentService.generatePaymentSchedule(clientId, totalAmount, installments, startDate, { payment_type, payment_method, notes, status });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, invoice_number, payment_method } = req.body;
    try {
        const sets = [];
        const vals = [];
        let idx = 1;
        if (status !== undefined) { sets.push(`status = $${idx++}`); vals.push(status); }
        if (invoice_number !== undefined) { sets.push(`invoice_number = $${idx++}`); vals.push(invoice_number); }
        if (payment_method !== undefined) { sets.push(`payment_method = $${idx++}`); vals.push(payment_method); }
        if (sets.length === 0) return res.json({ message: 'Nothing to update' });
        vals.push(id);
        await db.query(`UPDATE payments SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
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
