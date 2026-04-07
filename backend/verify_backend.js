const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function verify() {
    console.log("🚀 מתחיל בדיקת מערכת לבקאנד...");

    // 1. בדיקת מסד נתונים
    try {
        const [tables] = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tableNames = tables.map(t => t.table_name);
        const required = ['clients', 'users', 'payments', 'pdf_templates', 'custom_fields'];
        
        required.forEach(table => {
            if (tableNames.includes(table)) console.log(`✅ טבלה ${table} קיימת`);
            else console.log(`❌ טבלה ${table} חסרה!`);
        });
    } catch (e) {
        console.log("❌ שגיאת חיבור למסד הנתונים:", e.message);
    }

    // 2. בדיקת תיקיות
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) console.log("✅ תיקיית uploads קיימת");
    else {
        fs.mkdirSync(uploadsDir);
        console.log("📂 תיקיית uploads נוצרה כעת");
    }

    // 3. בדיקת קבצי ליבה
    const files = ['src/app.js', 'src/services/pdfService.js', 'src/services/paymentService.js'];
    files.forEach(f => {
        if (fs.existsSync(path.join(__dirname, f))) console.log(`✅ קובץ ${f} קיים`);
        else console.log(`❌ קובץ ${f} חסר!`);
    });

    console.log("\n🏁 הבדיקה הסתיימה. אם הכל ירוק - הבקאנד מוכן לעבודה!");
    process.exit();
}

verify();
