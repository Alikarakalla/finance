require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'finance-secret-key-2024';

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
                reminder_days INT DEFAULT NULL,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                profile_image TEXT,
                push_token VARCHAR(255),
                currency VARCHAR(10) DEFAULT 'USD',
                date_format VARCHAR(20) DEFAULT 'dd/MM/yyyy',
                number_format VARCHAR(20) DEFAULT '1,234.56',
                is_onboarded BOOLEAN DEFAULT FALSE,
                created_at BIGINT
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
            `ALTER TABLE transactions ADD COLUMN recurring_config JSON DEFAULT NULL`,
            `ALTER TABLE transactions ADD COLUMN reminder_days INT DEFAULT NULL`,
            `ALTER TABLE users ADD COLUMN push_token VARCHAR(255)`,
            `ALTER TABLE users ADD COLUMN currency VARCHAR(10) DEFAULT 'USD'`,
            `ALTER TABLE users ADD COLUMN date_format VARCHAR(20) DEFAULT 'dd/MM/yyyy'`,
            `ALTER TABLE users ADD COLUMN number_format VARCHAR(20) DEFAULT '1,234.56'`,
            `ALTER TABLE users ADD COLUMN is_onboarded BOOLEAN DEFAULT FALSE`
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

// Get All Categories (Global + User Specific)
app.get('/categories', (req, res) => {
    const { userId } = req.query;

    let sql = 'SELECT * FROM categories WHERE user_id IS NULL AND isDefault = 1';
    const params = [];

    if (userId) {
        sql = 'SELECT * FROM categories WHERE user_id = ? OR (user_id IS NULL AND isDefault = 1)';
        params.push(userId);
    }

    db.query(sql, params, (err, results) => {
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
    const { id, name, type, icon, color, budget, isDefault, userId } = req.body;

    const sql = 'INSERT INTO categories (id, name, type, icon, color, budget, isDefault, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, type=?, icon=?, color=?, budget=?';

    db.query(sql, [id, name, type, icon, color, budget, isDefault ? 1 : 0, userId || null, name, type, icon, color, budget], (err, result) => {
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
    const { userId } = req.query;

    if (!userId) {
        return res.json([]);
    }

    const sql = `
        SELECT t.*, c.name as category_name 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.date DESC
    `;
    db.query(sql, [userId], (err, results) => {
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
            reminderDays: row.reminder_days,
            receiptImage: row.receipt_image,
            createdAt: Number(row.created_at),
            updatedAt: Number(row.updated_at),
            userId: row.user_id
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
        createdAt, updatedAt, isRecurring, recurringConfig, userId
    } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

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
        INSERT INTO transactions (id, type, amount, category_id, date, description, receipt_image, created_at, updated_at, is_recurring, recurring_config, reminder_days, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [id, type, amount, categoryId, date, description, receiptImage, createdAt, updatedAt, recNumeric, configStr, req.body.reminderDays, userId];
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

// Update Transaction (Supports Partial Updates)
app.put('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Fields allowed to be updated
    const allowedFields = [
        'type', 'amount', 'categoryId', 'date', 'description',
        'receiptImage', 'isRecurring', 'recurringConfig', 'reminderDays'
    ];

    const fieldsToUpdate = [];
    const params = [];

    allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
            // Map camelCase to snake_case for DB columns
            let dbCol = field;
            let val = updates[field];

            if (field === 'categoryId') dbCol = 'category_id';
            if (field === 'receiptImage') dbCol = 'receipt_image';
            if (field === 'reminderDays') dbCol = 'reminder_days';
            if (field === 'isRecurring') {
                dbCol = 'is_recurring';
                // Handle boolean logic
                let recValue = val;
                if (recValue === 'true') recValue = true;
                if (recValue === 'false') recValue = false;
                val = recValue ? 1 : 0;
            }
            if (field === 'recurringConfig') {
                dbCol = 'recurring_config';
                val = val ? (typeof val === 'string' ? val : JSON.stringify(val)) : null;
            }

            fieldsToUpdate.push(`${dbCol} = ?`);
            params.push(val);
        }
    });

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Always update updated_at
    fieldsToUpdate.push('updated_at = ?');
    params.push(Date.now());

    // Add ID to params
    params.push(id);

    const sql = `UPDATE transactions SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

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

// --- Auth Routes ---

// Signup
app.post('/signup', async (req, res) => {
    const { name, email, password, profileImage } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        const createdAt = Date.now();

        const sql = 'INSERT INTO users (id, name, email, password, profile_image, created_at) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [id, name, email, hashedPassword, profileImage || null, createdAt], (err, result) => {
            if (err) {
                if (err.errno === 1062) return res.status(400).json({ error: 'Email already exists' });
                return res.status(500).json({ error: err.message });
            }

            const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
            res.json({
                message: 'User created',
                token,
                user: {
                    id, name, email, profileImage: profileImage || null,
                    currency: 'USD',
                    dateFormat: 'dd/MM/yyyy',
                    numberFormat: '1,234.56',
                    isOnboarded: false
                }
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profileImage: user.profile_image,
                currency: user.currency,
                dateFormat: user.date_format,
                numberFormat: user.number_format,
                isOnboarded: !!user.is_onboarded
            }
        });
    });
});

// Real Google Auth Verification
app.post('/auth/google', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'ID Token required' });

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: [
                process.env.GOOGLE_IOS_CLIENT_ID,
                process.env.GOOGLE_ANDROID_CLIENT_ID,
                process.env.GOOGLE_WEB_CLIENT_ID
            ].filter(Boolean)
        });
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        handleSocialUser(res, { id: sub, email, name, profileImage: picture });
    } catch (err) {
        console.error('Google verification error:', err);
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

// Real Apple Auth Verification
app.post('/auth/apple', async (req, res) => {
    const { identityToken, userIdentifier, fullName, email: providedEmail } = req.body;
    if (!identityToken) return res.status(400).json({ error: 'Identity Token required' });

    try {
        // Support both native bundle ID and Expo Go host during development
        const { email, sub } = await appleSignin.verifyIdToken(identityToken, {
            audience: [process.env.APPLE_BUNDLE_ID, 'host.exp.Exponent'],
            ignoreExpiration: false,
        });

        // Apple only sends name/email on the FIRST sign in
        const name = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : 'Apple User';

        handleSocialUser(res, {
            id: userIdentifier || sub,
            email: email || providedEmail || `apple_${sub}@privaterelay.appleid.com`,
            name
        });
    } catch (err) {
        console.error('Apple verification error:', err);
        res.status(401).json({ error: 'Invalid Apple token: ' + err.message });
    }
});

// Helper to find or create social user
function handleSocialUser(res, userData) {
    const { id, email, name, profileImage } = userData;

    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            // User exists, log them in
            const user = results[0];
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    profileImage: user.profile_image,
                    currency: user.currency,
                    dateFormat: user.date_format,
                    numberFormat: user.number_format,
                    isOnboarded: !!user.is_onboarded
                }
            });
        } else {
            // Create user
            const userId = uuidv4();
            const createdAt = Date.now();
            const dummyPass = 'social-auth-' + Math.random(); // Dummy pass for social users

            const sql = 'INSERT INTO users (id, name, email, password, profile_image, created_at) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(sql, [userId, name, email, dummyPass, profileImage || null, createdAt], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
                res.json({
                    token,
                    user: {
                        id: userId,
                        name,
                        email,
                        profileImage,
                        currency: 'USD',
                        dateFormat: 'dd/MM/yyyy',
                        numberFormat: '1,234.56',
                        isOnboarded: false
                    }
                });
            });
        }
    });
}

// Update Push Token
app.post('/users/push-token', (req, res) => {
    const { userId, token } = req.body;
    if (!userId || !token) return res.status(400).json({ error: 'Missing userId or token' });
    const sql = 'UPDATE users SET push_token = ? WHERE id = ?';
    db.query(sql, [token, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Push token updated' });
    });
});

// Update User Preferences
app.put('/users/:userId/preferences', (req, res) => {
    const { userId } = req.params;
    const { currency, dateFormat, numberFormat, isOnboarded } = req.body;

    const updates = [];
    const params = [];

    if (currency) { updates.push('currency = ?'); params.push(currency); }
    if (dateFormat) { updates.push('date_format = ?'); params.push(dateFormat); }
    if (numberFormat) { updates.push('number_format = ?'); params.push(numberFormat); }
    if (isOnboarded !== undefined) {
        updates.push('is_onboarded = ?');
        params.push(isOnboarded ? 1 : 0);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields provided' });

    params.push(userId);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Preferences updated' });
    });
});

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
