const db = require('../config/db');

exports.getCalendarEvents = async (req, res) => {
    try {
        // שליפת כל הלקוחות שיש להם שדה תאריך ב-custom_fields
        const { rows } = await db.query("SELECT id, full_name, custom_fields, entity_type FROM clients");
        
        const events = [];
        rows.forEach(client => {
            // חיפוש שדות שמכילים תאריכים בתוך ה-JSON
            Object.keys(client.custom_fields).forEach(key => {
                const value = client.custom_fields[key];
                // בדיקה בסיסית אם הערך נראה כמו תאריך (YYYY-MM-DD)
                if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    events.push({
                        id: `${client.id}_${key}`,
                        title: `${client.full_name} - ${key}`,
                        start: value,
                        extendedProps: { clientId: client.id, type: client.entity_type }
                    });
                }
            });
        });
        
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
