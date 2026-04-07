require('dotenv').config();
const db = require('./db');

const migrate = async () => {
    try {
        console.log('Running complete migration...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'user'
            );

            CREATE TABLE IF NOT EXISTS statuses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                color VARCHAR(20),
                entity_type VARCHAR(20)
            );

            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                entity_type VARCHAR(50),
                status_id INTEGER REFERENCES statuses(id),
                custom_fields JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                client_id INTEGER REFERENCES clients(id),
                amount DECIMAL(10,2),
                status VARCHAR(20), -- 'paid', 'pending'
                due_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO users (username, password, role) VALUES ('admin', '123456', 'admin') ON CONFLICT DO NOTHING;
            INSERT INTO statuses (name, color, entity_type) VALUES ('חדש', '#4CAF50', 'course') ON CONFLICT DO NOTHING;
        `);
        console.log('Migration finished successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    }
};
migrate();
