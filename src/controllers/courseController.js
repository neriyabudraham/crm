const db = require('../config/db');

exports.getCourses = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM courses ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createCourse = async (req, res) => {
    const { title, description, thumbnail_url, price } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO courses (title, description, thumbnail_url, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, thumbnail_url, price || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.enrollClient = async (req, res) => {
    const { client_id, course_id } = req.body;
    try {
        await db.query(
            'INSERT INTO client_courses (client_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [client_id, course_id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getCourseClients = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(\`
            SELECT c.full_name, c.phone, cc.enrolled_at 
            FROM clients c
            JOIN client_courses cc ON c.id = cc.client_id
            WHERE cc.course_id = $1
        \`, [id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteCourse = async (req, res) => {
    try {
        await db.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
