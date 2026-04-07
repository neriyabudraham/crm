const db = require('../config/db');

exports.submitQuestionnaire = async (req, res) => {
    const { clientId, answers } = req.body;

    try {
        // ודא בעלות לפני עדכון
        const r = await db.query(
            'UPDATE clients SET notes = $1 WHERE id = $2 AND account_id = $3',
            [JSON.stringify(answers), clientId, req.accountId]
        );
        if (r.rowCount === 0) return res.status(404).json({ error: 'לקוח לא נמצא' });

        res.json({ success: true, message: 'השאלון עודכן בהצלחה' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
