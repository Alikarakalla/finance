const mysql = require('mysql2');

// Try connecting to MySQL server directly (no database selected)
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '', // Trying empty password first
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.error('FAILED to connect to MySQL:', err.message);
        console.log('--- troubleshoot ---');
        console.log('1. Check if DBngin is running.');
        console.log('2. If you have a password for root, please tell me.');
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
