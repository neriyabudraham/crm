require('dotenv').config();
const { Pool } = require('pg');

console.log('Attempting to connect with:');
console.log('User:', process.env.DB_USER);
console.log('Password:', process.env.DB_PASS);
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err.message);
  } else {
    console.log('Success! Connection established at:', res.rows[0].now);
  }
  pool.end();
});
