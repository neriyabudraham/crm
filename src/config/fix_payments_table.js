const db = require('./db');

const fixPayments = async () => {
    try {
        console.log("🛠 מעדכן מבנה טבלת payments...");
        
        await db.query(`
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
            ADD COLUMN IF NOT EXISTS notes TEXT
        `);

        console.log("✅ טבלת payments עודכנה בהצלחה!");
        process.exit();
    } catch (err) {
        console.error("❌ שגיאה בעדכון הטבלה:", err);
        process.exit(1);
    }
};

fixPayments();
