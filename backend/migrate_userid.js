const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'finance_app_db',
    port: process.env.PORT_DB || 3308
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Add user_id to categories
        try {
            await connection.query(`ALTER TABLE categories ADD COLUMN user_id VARCHAR(255) DEFAULT NULL;`);
            await connection.query(`ALTER TABLE categories ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`);
            console.log('Added user_id to categories.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('user_id already exists in categories.');
            } else {
                console.error('Error adding user_id to categories:', e.message);
            }
        }

        // 2. Add user_id to transactions
        try {
            await connection.query(`ALTER TABLE transactions ADD COLUMN user_id VARCHAR(255);`);
            // We need to set a default or deal with existing rows before making it NOT NULL.
            // For now, let's leave it nullable or update existing rows if any.
            // But to follow schema:
            // await connection.query(`UPDATE transactions SET user_id = ...`); 

            await connection.query(`ALTER TABLE transactions ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`);
            console.log('Added user_id to transactions.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('user_id already exists in transactions.');
            } else {
                console.error('Error adding user_id to transactions:', e.message);
            }
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
