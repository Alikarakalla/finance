const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.PORT_DB ? parseInt(process.env.PORT_DB) : 3307
};

console.log('Connecting to database with config:', { ...dbConfig, password: '***' });

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('FAILED to connect to MySQL:', err.message);
        console.log('--- TROUBLESHOOTING ---');
        console.log('1. Ensure XAMPP MySQL is running (Port 3307).');
        console.log('2. If it is running, try RESTARTING it in XAMPP Control Panel.');
        console.log('3. Check if you have a password for root.');
        process.exit(1);
    }

    console.log('Connected to MySQL server!');

    connection.query('CREATE DATABASE IF NOT EXISTS finance_app_db', (err, result) => {
        if (err) {
            console.error('Error creating database:', err.message);
        } else {
            console.log('Database "finance_app_db" created or already exists.');
        }
        connection.end();
    });
});
