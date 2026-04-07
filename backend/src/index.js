const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const accountAuthRoutes = require('./routes/accountAuthRoutes');
const clientRoutes = require('./routes/clientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes');
const questionnaireRoutes = require('./routes/questionnaireRoutes');
const signingRoutes = require('./routes/signingRoutes');
const { accountAuth } = require('./middlewares/accountMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Public API Routes (no tenant auth required)
app.use('/api/auth', authRoutes);
app.use('/api/account', accountAuthRoutes);
app.use('/api/signing', signingRoutes); // public signing endpoints
app.use('/api/questionnaires', questionnaireRoutes); // public questionnaire endpoints

// Protected API Routes (require account JWT — tenant-scoped)
app.use('/api/clients', accountAuth, clientRoutes);
app.use('/api/admin', accountAuth, adminRoutes);
app.use('/api/courses', accountAuth, courseRoutes);

// Static files (Frontend Build)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`CRM Backend running on port ${PORT}`);
});
