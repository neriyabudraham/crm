const db = require('../config/db');

exports.submitQuestionnaire = async (req, res) => {
    const { clientId, answers } = req.body; // answers: { "שדה1": "ערך1", ... }
    
    try {
        // שמירת התשובות ב-JSON בתוך כרטיס הלקוח (הוספנו עמודת notes/custom_data קודם)
        // אפשר גם לעדכן שדות ספציפיים אם הם מוגדרים
        await db.query(
            'UPDATE clients SET notes = $1 WHERE id = $2',
            [JSON.stringify(answers), clientId]
        );
        
        // כאן אפשר להוסיף שליחת וואטסאפ לאשתך שמישהי מילאה שאלון
        res.json({ success: true, message: 'השאלון עודכן בהצלחה' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
