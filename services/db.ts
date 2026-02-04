import { Config } from '@/constants/Config';
import { Category, Transaction } from '@/types';

// Helper to make API calls
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const config = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        };
        const response = await fetch(`${Config.API_URL}${endpoint}`, config);

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data?.error || response.statusText || 'Unknown Error';
            throw new Error(errorMsg);
        }

        return data;
    } catch (error: any) {
        console.error(`Error in ${method} ${endpoint}:`, error);
        throw error; // Throw so caller can handle it
    }
};

export const initDatabase = async () => {
    console.log('Using remote MySQL API for database operations.');
    // The backend server handles table creation on startup.
    // We just ensure default categories exist by calling the API or checking state.
    // For simplicity, we assume backend does it or we trigger it.

    // Check if categories exist, if not seed default via API loop
    const cats = await apiCall('/categories');
    if (cats && cats.length === 0) {
        await seedCategories();
    }
};

const seedCategories = async () => {
    const DEFAULT_CATEGORIES = [
        { id: '1', name: 'Salary', type: 'inflow', icon: 'cash', color: '#4CAF50', isDefault: 1 },
        { id: '2', name: 'Freelance', type: 'inflow', icon: 'briefcase', color: '#8BC34A', isDefault: 1 },
        { id: '3', name: 'Food', type: 'outflow', icon: 'fast-food', color: '#F44336', isDefault: 1 },
        { id: '4', name: 'Transport', type: 'outflow', icon: 'car', color: '#FF9800', isDefault: 1 },
        { id: '5', name: 'Shopping', type: 'outflow', icon: 'cart', color: '#E91E63', isDefault: 1 },
        { id: '6', name: 'Bills', type: 'outflow', icon: 'receipt', color: '#9C27B0', isDefault: 1 },
        { id: '7', name: 'Entertainment', type: 'outflow', icon: 'game-controller', color: '#673AB7', isDefault: 1 },
        { id: '8', name: 'Health', type: 'outflow', icon: 'medkit', color: '#00BCD4', isDefault: 1 },
    ];

    for (const cat of DEFAULT_CATEGORIES) {
        await apiCall('/categories', 'POST', cat);
    }
    console.log('Seeded default categories via API');
};

// --- CRUD Operations ---

// Categories
export const getCategories = async (userId?: string): Promise<Category[]> => {
    console.log('[DB Service] Fetching categories from backend...', userId ? `for user ${userId}` : 'global');
    const query = userId ? `?userId=${userId}` : '';
    const data = await apiCall(`/categories${query}`);
    console.log('[DB Service] Categories received:', data ? data.length : 'null');
    if (data && data.length > 0) {
        console.log('[DB Service] First category:', data[0]);
    }
    return data || [];
};

export const addCategory = async (cat: Category, userId?: string) => {
    await apiCall('/categories', 'POST', { ...cat, userId });
};

export const updateCategory = async (id: string, cat: Partial<Category>) => {
    await apiCall(`/categories/${id}`, 'PUT', cat);
};

export const deleteCategory = async (id: string) => {
    await apiCall(`/categories/${id}`, 'DELETE');
};

// Transactions
export const getTransactions = async (userId?: string): Promise<Transaction[]> => {
    const query = userId ? `?userId=${userId}` : '';
    const data = await apiCall(`/transactions${query}`);
    if (!data) return [];

    // Ensure numeric types are actually numbers (MySQL returns strings for DECIMAL)
    const formatted = data.map((t: any) => ({
        ...t,
        amount: Number(t.amount || 0),
        date: Number(t.date || 0),
        createdAt: Number(t.createdAt || 0),
        updatedAt: Number(t.updatedAt || 0)
    }));
    console.log('[DB Service] Transactions formatted:', formatted.length > 0 ? formatted[0] : 'none');
    return formatted;
};

export const addTransaction = async (t: Transaction, userId?: string) => {
    return await apiCall('/transactions', 'POST', { ...t, userId });
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    return await apiCall(`/transactions/${id}`, 'PUT', updates);
};

export const deleteTransaction = async (id: string) => {
    return await apiCall(`/transactions/${id}`, 'DELETE');
};

// --- Auth ---

export const signup = async (userData: any) => {
    return await apiCall('/signup', 'POST', userData);
};

export const login = async (credentials: any) => {
    return await apiCall('/login', 'POST', credentials);
};

export const googleLogin = async (idToken: string) => {
    return await apiCall('/auth/google', 'POST', { idToken });
};

export const appleLogin = async (appleData: any) => {
    return await apiCall('/auth/apple', 'POST', appleData);
};

// --- Notifications ---
export const updatePushToken = async (userId: string, token: string) => {
    return await apiCall('/users/push-token', 'POST', { userId, token });
};

export const updateUserPreferences = async (userId: string, preferences: { currency?: string, dateFormat?: string, numberFormat?: string, isOnboarded?: boolean }) => {
    return await apiCall(`/users/${userId}/preferences`, 'PUT', preferences);
};
