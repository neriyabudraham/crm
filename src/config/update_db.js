const db = require('./db');

const updateDatabase = async () => {
    try {
        // 1. טבלת שדות דינמיים
        await db.query(`
            CREATE TABLE IF NOT EXISTS custom_fields (
                id SERIAL PRIMARY KEY,
                entity_type TEXT CHECK (entity_type IN ('bride', 'course')),
                field_name VARCHAR(100) NOT NULL,
                field_type TEXT CHECK (field_type IN ('text', 'number', 'date', 'select', 'file')),
                is_required BOOLEAN DEFAULT FALSE,
                field_order INT DEFAULT 0,
                options JSONB DEFAULT NULL
            )
        `);

        // 2. טבלת תשלומים
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                due_date DATE NOT NULL,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
                invoice_number VARCHAR(50) DEFAULT NULL,
                payment_method VARCHAR(50) DEFAULT NULL
            )
        `);

        // 3. טבלת טמפלייטים של PDF
        await db.query(`
            CREATE TABLE IF NOT EXISTS pdf_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                sig_x INT DEFAULT 0,
                sig_y INT DEFAULT 0,
                sig_page INT DEFAULT 1,
                entity_type TEXT CHECK (entity_type IN ('bride', 'course'))
            )
        `);

        // 4. עדכון טבלת משתמשים (הרשאות ותפקידים)
        // ב-Postgres הוספת עמודה דורשת בדיקה אם היא קיימת
        await db.query(`
            DO $$\ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
                    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'staff';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='permissions') THEN
                    ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT NULL;
                END IF;
            END $$;
        `);

        console.log("✅ Database updated successfully for PostgreSQL!");
        process.exit();
    } catch (err) {
        console.error("❌ Update failed:", err);
        process.exit(1);
    }
};

updateDatabase();
