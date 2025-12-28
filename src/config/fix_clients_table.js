const db = require('./db');

const fixTable = async () => {
    try {
        console.log("🛠 מעדכן מבנה טבלת clients...");
        
        await db.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS status_name VARCHAR(100) DEFAULT 'חדש',
            ADD COLUMN IF NOT EXISTS source VARCHAR(100),
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);

        console.log("✅ הטבלה עודכנה בהצלחה!");
        process.exit();
    } catch (err) {
        console.error("❌ שגיאה בעדכון הטבלה:", err);
        process.exit(1);
    }
};

fixTable();
