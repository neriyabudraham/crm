const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const accountAuthRoutes = require('./routes/accountAuthRoutes');
const clientRoutes = require('./routes/clientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes');
const signingRoutes = require('./routes/signingRoutes');
const questionnaireRoutes = require('./routes/questionnaireRoutes');
const upload = require('./middlewares/uploadMiddleware');
const { accountAuth } = require('./middlewares/accountMiddleware');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Account Auth (signup/login/google) - ללא auth
app.use('/api/account', accountAuthRoutes);

// API Routes (legacy - תואם לקיים, עד שהfrontend יעבור)
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/signing', signingRoutes);
app.use('/api/questionnaires', questionnaireRoutes);

// העלאת תבנית PDF
app.post('/api/admin/templates/upload', upload.single('file'), async (req, res) => {
    const { name, entity_type, signature_positions } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'לא הועלה קובץ' });
    try {
        const db = require('./config/db');
        const filePath = 'uploads/' + file.filename;
        const positions = signature_positions ? JSON.parse(signature_positions) : [];
        const result = await db.query(
            'INSERT INTO pdf_templates (name, file_path, entity_type, signature_positions) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, filePath, entity_type || 'bride', JSON.stringify(positions)]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// עדכון תבנית
app.patch('/api/admin/templates/:id', async (req, res) => {
    const { signature_positions, elements, name, entity_type } = req.body;
    try {
        const db = require('./config/db');
        const result = await db.query(
            'UPDATE pdf_templates SET signature_positions = COALESCE($1, signature_positions), elements = COALESCE($2, elements), name = COALESCE($3, name), entity_type = COALESCE($4, entity_type) WHERE id = $5 RETURNING *',
            [signature_positions ? JSON.stringify(signature_positions) : null, elements ? JSON.stringify(elements) : null, name, entity_type !== undefined ? entity_type : null, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// מחיקת תבנית
app.delete('/api/admin/templates/:id', async (req, res) => {
    try {
        const db = require('./config/db');
        await db.query('DELETE FROM pdf_templates WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// WebSocket
const http = require('http');
const { WebSocketServer } = require('ws');
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// מפת חיבורים לפי clientId
const clientConnections = new Map();

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const clientId = url.searchParams.get('clientId');
    if (clientId) {
        if (!clientConnections.has(clientId)) clientConnections.set(clientId, new Set());
        clientConnections.get(clientId).add(ws);
        ws.on('close', () => {
            clientConnections.get(clientId)?.delete(ws);
            if (clientConnections.get(clientId)?.size === 0) clientConnections.delete(clientId);
        });
    }
});

// פונקציה לשליחת עדכון
global.notifyClient = (clientId, type) => {
    const connections = clientConnections.get(String(clientId));
    if (connections) {
        const msg = JSON.stringify({ type });
        connections.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
    }
};

const PORT = process.env.PORT || 3010;
server.listen(PORT, () => {
    console.log(`CRM Backend running on port ${PORT}`);
});
