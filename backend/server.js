require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
});

// Database Connection
const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'finance_app_db',
    port: process.env.PORT_DB ? parseInt(process.env.PORT_DB) : 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Check connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        console.log('Ensure DBngin is running and database "finance_app_db" exists!');
    } else {
        console.log('Connected to MySQL Database via DBngin');

        // Initialize Tables
        const initQueries = [
            `CREATE TABLE IF NOT EXISTS categories (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                icon VARCHAR(50) NOT NULL,
                color VARCHAR(50) NOT NULL,
                budget DECIMAL(10, 2),
                isDefault BOOLEAN DEFAULT FALSE
            )`,
            `CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR(255) PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                category_id VARCHAR(255) NOT NULL,
                date BIGINT NOT NULL,
                description TEXT,
                receipt_image TEXT,
                created_at BIGINT,
                updated_at BIGINT,
                is_recurring BOOLEAN DEFAULT FALSE,
                recurring_config JSON DEFAULT NULL,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )`
        ];

        initQueries.forEach(query => {
            connection.query(query, (err) => {
                if (err) console.error('Error creating table:', err.message);
            });
        });

        // Migration: Add columns if missing
        const migrations = [
            `ALTER TABLE transactions ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE`,
            `ALTER TABLE transactions ADD COLUMN recurring_config JSON DEFAULT NULL`
        ];

        migrations.forEach(sql => {
            connection.query(sql, (err) => {
                // Ignore "Duplicate column name" error (1060)
                if (err && err.errno !== 1060) {
                    console.log(`Migration result (${sql.slice(0, 35)}...):`, err.message);
                }
            });
        });

        connection.release();
    }
});

// --- API Routes ---

// Get All Categories
app.get('/categories', (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: err.message });
        }
        // Format boolean
        const formatted = results.map(c => ({
            ...c,
            isDefault: !!c.isDefault
        }));
        res.json(formatted);
    });
});

// Add Category
app.post('/categories', (req, res) => {
    const { id, name, type, icon, color, budget, isDefault } = req.body;
    const sql = 'INSERT INTO categories (id, name, type, icon, color, budget, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, type=?, icon=?, color=?, budget=?';
    db.query(sql, [id, name, type, icon, color, budget, isDefault ? 1 : 0, name, type, icon, color, budget], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category added/updated', id });
    });
});

// Update Category (Specific)
app.put('/categories/:id', (req, res) => {
    const { id } = req.params;
    const { name, type, icon, color, budget } = req.body;
    const sql = 'UPDATE categories SET name=?, type=?, icon=?, color=?, budget=? WHERE id=?';
    db.query(sql, [name, type, icon, color, budget, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category updated', id });
    });
});

// Delete Category
app.delete('/categories/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM categories WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category deleted' });
    });
});

// Get All Transactions
app.get('/transactions', (req, res) => {
    const sql = `
        SELECT t.*, c.name as category_name 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        const formatted = results.map(row => ({
            id: row.id,
            type: row.type,
            amount: row.amount,
            categoryName: row.category_name || 'Unknown',
            categoryId: row.category_id,
            date: Number(row.date),
            description: row.description,
            tags: [],
            isRecurring: row.is_recurring === 1,
            recurringConfig: row.recurring_config ? (typeof row.recurring_config === 'string' ? JSON.parse(row.recurring_config) : row.recurring_config) : undefined,
            receiptImage: row.receipt_image,
            createdAt: Number(row.created_at),
            updatedAt: Number(row.updated_at)
        }));
        res.json(formatted);
    });
});

// Add Transaction
app.post('/transactions', (req, res) => {
    console.log('[API] Processing POST /transactions');
    console.log('[API] Content-Type:', req.headers['content-type']);
    console.log('[API] isRecurring in body:', req.body.isRecurring);
    console.log('[API] is_recurring in body:', req.body.is_recurring);

    const {
        id, type, amount, categoryId, date, description, receiptImage,
        createdAt, updatedAt, isRecurring, recurringConfig
    } = req.body;

    // Robust boolean check for recValue
    const rawRec = isRecurring !== undefined ? isRecurring : req.body.is_recurring;
    console.log('[API] rawRec identified as:', rawRec, 'Type:', typeof rawRec);

    let recValue = (rawRec === true || rawRec === 'true' || rawRec === 1 || rawRec === '1');

    const configValue = recurringConfig ?? req.body.recurring_config;

    // Structural Fallback: if there's a config, it's recurring!
    if (configValue && (configValue.frequency || (typeof configValue === 'object' && Object.keys(configValue).length > 0))) {
        console.log('[API] Detected recurring config, forcing recValue to true');
        recValue = true;
    }

    const recNumeric = recValue ? 1 : 0;
    const configStr = configValue ? (typeof configValue === 'string' ? configValue : JSON.stringify(configValue)) : null;

    const sql = `
        INSERT INTO transactions (id, type, amount, category_id, date, description, receipt_image, created_at, updated_at, is_recurring, recurring_config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [id, type, amount, categoryId, date, description, receiptImage, createdAt, updatedAt, recNumeric, configStr];
    console.log('[API] Params:', params);

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('[DB Error] INSERT failed:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('[API] Success, ID:', id, 'Rec:', recNumeric);
        res.json({
            message: 'Transaction added',
            id,
            savedAsRecurring: !!recValue,
            v: 2 // Server version indicator
        });
    });
});

// Update Transaction
app.put('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const {
        type, amount, categoryId, date, description, receiptImage,
        isRecurring, recurringConfig
    } = req.body;

    // Handle recurring boolean/string logic similar to POST
    let recValue = isRecurring;
    if (recValue === 'true') recValue = true;
    if (recValue === 'false') recValue = false;
    const recNumeric = recValue ? 1 : 0;

    const configValue = recurringConfig;
    const configStr = configValue ? (typeof configValue === 'string' ? configValue : JSON.stringify(configValue)) : null;

    const sql = `
        UPDATE transactions 
        SET type=?, amount=?, category_id=?, date=?, description=?, receipt_image=?, updated_at=?, is_recurring=?, recurring_config=?
        WHERE id=?
    `;

    // params order matches SQL
    const params = [
        type, amount, categoryId, date, description, receiptImage, Date.now(), recNumeric, configStr, id
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('[DB Error] UPDATE failed:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Transaction updated', id });
    });
});

// Delete Transaction
app.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM transactions WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Transaction deleted' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Ensure you create a database named "finance_app_db" in DBngin/MySQL first!');
});
