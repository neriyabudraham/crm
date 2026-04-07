const db = require('../config/db');

exports.getCourses = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM courses WHERE account_id = $1 ORDER BY created_at DESC', [req.accountId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createCourse = async (req, res) => {
    const { title, description, thumbnail_url, price } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO courses (title, description, thumbnail_url, price, account_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, thumbnail_url, price || 0, req.accountId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.enrollClient = async (req, res) => {
    const { client_id, course_id, custom_price } = req.body;
    try {
        // ודא שהלקוח והקורס שייכים לחשבון הזה
        const ownership = await db.query(
            'SELECT (SELECT account_id FROM clients WHERE id = $1) AS c, (SELECT account_id FROM courses WHERE id = $2) AS co',
            [client_id, course_id]
        );
        if (ownership.rows[0].c !== req.accountId || ownership.rows[0].co !== req.accountId) {
            return res.status(403).json({ error: 'אין הרשאה' });
        }
        await db.query(
            'INSERT INTO client_courses (client_id, course_id, custom_price) VALUES ($1, $2, $3) ON CONFLICT (client_id, course_id) DO UPDATE SET custom_price = $3',
            [client_id, course_id, custom_price]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getCourseClients = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `SELECT c.full_name, c.phone, cc.enrolled_at
             FROM clients c
             JOIN client_courses cc ON c.id = cc.client_id
             JOIN courses co ON co.id = cc.course_id
             WHERE cc.course_id = $1 AND co.account_id = $2 AND c.account_id = $2`,
            [id, req.accountId]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteCourse = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM courses WHERE id = $1 AND account_id = $2', [req.params.id, req.accountId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'קורס לא נמצא' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
