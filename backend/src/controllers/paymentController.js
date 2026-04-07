const db = require('../config/db');
const paymentService = require('../services/paymentService');

// בדיקת בעלות לקוח לפני פעולת תשלום
async function assertClientOwnership(clientId, accountId) {
    const r = await db.query('SELECT account_id FROM clients WHERE id = $1', [clientId]);
    if (!r.rows[0] || r.rows[0].account_id !== accountId) {
        const err = new Error('אין הרשאה לקלוח זה');
        err.status = 403;
        throw err;
    }
}

exports.createSchedule = async (req, res) => {
    const { clientId, totalAmount, installments, startDate, payment_type, payment_method, notes, status } = req.body;
    try {
        await assertClientOwnership(clientId, req.accountId);
        const result = await paymentService.generatePaymentSchedule(
            clientId, totalAmount, installments, startDate,
            { payment_type, payment_method, notes, status, account_id: req.accountId }
        );
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
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
        vals.push(id, req.accountId);
        const r = await db.query(`UPDATE payments SET ${sets.join(', ')} WHERE id = $${idx} AND account_id = $${idx + 1}`, vals);
        if (r.rowCount === 0) return res.status(404).json({ error: 'תשלום לא נמצא' });
        res.json({ message: 'Payment updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getClientPayments = async (req, res) => {
    const { clientId } = req.params;
    try {
        await assertClientOwnership(parseInt(clientId, 10), req.accountId);
        const result = await db.query('SELECT * FROM payments WHERE client_id = $1 AND account_id = $2 ORDER BY due_date ASC', [clientId, req.accountId]);
        res.json(result.rows);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

exports.deletePayment = async (req, res) => {
    try {
        const r = await db.query('DELETE FROM payments WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
        if (r.rowCount === 0) return res.status(404).json({ error: 'תשלום לא נמצא' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
