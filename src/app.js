const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ייבוא הנתיבים (Routes)
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// הגדרת תיקיית uploads כציבורית לצפייה בקבצים
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// חיבור הנתיבים לאפליקציה
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
    console.log(`CRM Backend running on port ${PORT}`);
});
