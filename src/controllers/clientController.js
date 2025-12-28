const db = require('../config/db');

const getClients = async (req, res) => {
    const { entity_type } = req.query;
    try {
        let query = 'SELECT * FROM clients';
        let params = [];
        if (entity_type) {
            query += ' WHERE entity_type = $1';
            params.push(entity_type);
        }
        query += ' ORDER BY id DESC';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getClientById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createClient = async (req, res) => {
    const { full_name, phone, email, entity_type } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO clients (full_name, phone, email, entity_type) VALUES ($1, $2, $3, $4) RETURNING id',
            [full_name, phone, email, entity_type]
        );
        res.status(201).json({ id: result.rows[0].id, full_name, phone });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateClient = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, email, status_name } = req.body;
    try {
        await db.query(
            'UPDATE clients SET full_name = $1, phone = $2, email = $3, status_name = $4 WHERE id = $5',
            [full_name, phone, email, status_name, id]
        );
        res.json({ message: 'Client updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteClient = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM clients WHERE id = $1', [id]);
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
};
