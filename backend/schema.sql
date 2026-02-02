-- 1. Create Database
CREATE DATABASE IF NOT EXISTS finance_app_db;
USE finance_app_db;

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    budget DECIMAL(10, 2),
    isDefault BOOLEAN DEFAULT FALSE
);

-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category_id VARCHAR(255) NOT NULL,
    date BIGINT NOT NULL,
    description TEXT,
    receipt_image TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_config JSON DEFAULT NULL,
    created_at BIGINT,
    updated_at BIGINT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 4. Seed Default Categories
INSERT INTO categories (id, name, type, icon, color, budget, isDefault) VALUES
('1', 'Salary', 'inflow', 'cash', '#4CAF50', NULL, 1),
('2', 'Freelance', 'inflow', 'briefcase', '#8BC34A', NULL, 1),
('3', 'Food', 'outflow', 'fast-food', '#F44336', NULL, 1),
('4', 'Transport', 'outflow', 'car', '#FF9800', NULL, 1),
('5', 'Shopping', 'outflow', 'cart', '#E91E63', NULL, 1),
('6', 'Bills', 'outflow', 'receipt', '#9C27B0', NULL, 1),
('7', 'Entertainment', 'outflow', 'game-controller', '#673AB7', NULL, 1),
('8', 'Health', 'outflow', 'medkit', '#00BCD4', NULL, 1);
