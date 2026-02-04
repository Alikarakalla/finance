import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as db from '../services/db';
import { Category, Transaction } from '../types';
import { sendLocalNotification } from '../utils/notifications';

interface User {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    isOnboarded?: boolean;
}

interface FinanceState {
    transactions: Transaction[];
    categories: Category[];
    notificationsEnabled: boolean;
    toggleNotifications: () => Promise<void>;

    // Preferences
    currency: string; // ISO Code e.g. 'USD', 'EUR', 'LBP', 'INR', 'JPY'
    dateFormat: string; // 'dd/MM/yyyy', 'MM/dd/yyyy', etc.
    numberFormat: string; // '1,234.56', '1.234,56', etc. (we can store as key)
    setCurrency: (currency: string) => Promise<void>;
    setDateFormat: (format: string) => Promise<void>;
    setNumberFormat: (format: string) => Promise<void>;

    // UI State
    hasOnboarded: boolean;
    completeOnboarding: () => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;

    // Actions
    init: () => Promise<void>;
    refreshData: () => Promise<void>;
    addTransaction: (transaction: Transaction) => Promise<any>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<any>;

    addCategory: (category: Category) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    // Notification Actions
    pushNotification: (title: string, message: string) => Promise<void>;
    updatePushToken: (token: string) => Promise<void>;

    // Auth Actions
    user: User | null;
    token: string | null;
    login: (credentials: any) => Promise<void>;
    signup: (userData: any) => Promise<void>;
    googleLogin: (idToken: string) => Promise<void>;
    appleLogin: (appleData: any) => Promise<void>;
    logout: () => Promise<void>;

    // Getters
    getTransactionsByMonth: (month: string) => Transaction[];
    getBalance: () => number;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    transactions: [],
    categories: [],
    notificationsEnabled: true,
    hasOnboarded: false,
    selectedDate: new Date(),
    user: null,
    token: null,

    // Preferences Defaults
    currency: 'USD',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: '1,234.56',

    completeOnboarding: async () => {
        await AsyncStorage.setItem('has_onboarded', 'true');
        set({ hasOnboarded: true });

        const { user } = get();
        if (user) {
            await db.updateUserPreferences(user.id, { isOnboarded: true });
            set({ user: { ...user, isOnboarded: true } });
        }
    },
    setSelectedDate: (date: Date) => set({ selectedDate: date }),

    init: async () => {
        await db.initDatabase();

        // Load persist state
        const savedToken = await AsyncStorage.getItem('auth_token');
        const savedUserStr = await AsyncStorage.getItem('auth_user');
        const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;

        // Check for preferences to determine onboarding status
        let savedOnboarding = await AsyncStorage.getItem('has_onboarded') === 'true';
        if (savedToken) {
            // If logged in, check isOnboarded. Fallback to currency for legacy.
            if (savedUser && savedUser.isOnboarded !== undefined) {
                savedOnboarding = !!savedUser.isOnboarded;
            } else {
                savedOnboarding = !!(savedUser && savedUser.currency);
            }
        }

        const cats = await db.getCategories(savedUser?.id);
        const trans = await db.getTransactions(savedUser?.id);

        set({
            categories: cats,
            transactions: trans,
            token: savedToken,
            user: savedUser,
            notificationsEnabled: (await AsyncStorage.getItem('notifications_enabled')) !== 'false',
            currency: savedUser?.currency || await AsyncStorage.getItem('currency') || 'USD',
            dateFormat: savedUser?.dateFormat || await AsyncStorage.getItem('date_format') || 'dd/MM/yyyy',
            numberFormat: savedUser?.numberFormat || await AsyncStorage.getItem('number_format') || '1,234.56',
            hasOnboarded: savedOnboarding
        });
    },

    setCurrency: async (newCurrency) => {
        const { currency: oldCurrency, transactions, user } = get();
        if (oldCurrency === newCurrency) return;

        // Fetch rates
        const { fetchExchangeRates, convertAmount } = await import('../services/currency');
        const rates = await fetchExchangeRates('USD'); // Base USD for simplicity

        if (!rates || !rates[oldCurrency] || !rates[newCurrency]) {
            // Safety: If no transactions, just allow changing currency (e.g. fresh install)
            if (transactions.length === 0) {
                await AsyncStorage.setItem('currency', newCurrency);
                if (user) {
                    await db.updateUserPreferences(user.id, { currency: newCurrency });
                }
                set({ currency: newCurrency });
                return;
            }

            // If we have transactions, we CANNOT switch without conversion or data becomes corrupt (value mismatch)
            console.error('Exchange rates missing, aborting currency change');
            throw new Error(`Cannot convert ${oldCurrency} to ${newCurrency}. Exchange rate unavailable.`);
        }

        const oldRate = rates[oldCurrency];
        const newRate = rates[newCurrency];

        // Convert Transactions
        const uniqueIds = new Set<string>();
        const updatedTransactions = transactions.map(t => {
            // Avoid duplicates just in case
            if (uniqueIds.has(t.id)) return t;
            uniqueIds.add(t.id);

            return {
                ...t,
                amount: convertAmount(t.amount, oldRate, newRate)
            };
        });

        // Update Store
        set({ currency: newCurrency, transactions: updatedTransactions });
        await AsyncStorage.setItem('currency', newCurrency);

        // Update User Preferences in DB
        if (user) {
            await db.updateUserPreferences(user.id, { currency: newCurrency });
        }

        // Update DB (persist changes)
        for (const t of updatedTransactions) {
            await db.updateTransaction(t.id, { amount: t.amount });
        }
    },

    setDateFormat: async (dateFormat) => {
        const { user } = get();
        await AsyncStorage.setItem('date_format', dateFormat);
        set({ dateFormat });
        if (user) {
            await db.updateUserPreferences(user.id, { dateFormat });
        }
    },

    setNumberFormat: async (numberFormat) => {
        const { user } = get();
        await AsyncStorage.setItem('number_format', numberFormat);
        set({ numberFormat });
        if (user) {
            await db.updateUserPreferences(user.id, { numberFormat });
        }
    },

    toggleNotifications: async () => {
        const { notificationsEnabled } = get();
        const newState = !notificationsEnabled;
        await AsyncStorage.setItem('notifications_enabled', newState.toString());
        set({ notificationsEnabled: newState });
    },

    refreshData: async () => {
        const { user } = get();
        const cats = await db.getCategories(user?.id);
        const trans = await db.getTransactions(user?.id);

        set({
            categories: cats,
            transactions: trans,
        });
    },

    addTransaction: async (transaction) => {
        const { user } = get();
        const result = await db.addTransaction(transaction, user?.id);
        const trans = await db.getTransactions(user?.id); // Refresh
        set({ transactions: trans });

        // Push local notification record
        const { pushNotification } = get();
        await pushNotification(
            'Transaction Added',
            `You spent $${transaction.amount} on ${transaction.categoryName || 'General'}.`
        );

        // Schedule reminder if set
        const { scheduleReminder } = await import('../utils/notifications');
        await scheduleReminder({ ...transaction, id: result.id });

        return result;
    },

    updateTransaction: async (id, transaction) => {
        const { user } = get();
        await db.updateTransaction(id, transaction);
        set({ transactions: await db.getTransactions(user?.id) });

        // Update scheduled reminder
        const { scheduleReminder } = await import('../utils/notifications');
        await scheduleReminder({ ...transaction, id });
    },

    deleteTransaction: async (id) => {
        await db.deleteTransaction(id);
        set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id)
        }));

        // Cancel scheduled reminder
        const { cancelReminder } = await import('../utils/notifications');
        await cancelReminder(id);
    },

    addCategory: async (category) => {
        const { user } = get();
        await db.addCategory(category, user?.id);
        const cats = await db.getCategories(user?.id);
        set({ categories: cats });
    },

    updateCategory: async (id, updates) => {
        await db.updateCategory(id, updates);
        set((state) => ({
            categories: state.categories.map((c) =>
                c.id === id ? { ...c, ...updates } : c
            )
        }));
    },

    deleteCategory: async (id) => {
        await db.deleteCategory(id);
        set((state) => ({
            categories: state.categories.filter((c) => c.id !== id)
        }));
    },

    getTransactionsByMonth: (month) => {
        const { transactions } = get();
        return transactions.filter(t => {
            const date = new Date(t.date);
            const tMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return tMonth === month;
        });
    },

    getBalance: () => {
        const { transactions } = get();
        return transactions.reduce((acc, t) => {
            return t.type === 'inflow' ? acc + t.amount : acc - t.amount;
        }, 0);
    },

    login: async (credentials) => {
        const { token, user } = await db.login(credentials);
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(user));

        const isOnboarded = user.isOnboarded !== undefined ? !!user.isOnboarded : !!user.currency;
        await AsyncStorage.setItem('has_onboarded', isOnboarded ? 'true' : 'false');

        if (user.currency) await AsyncStorage.setItem('currency', user.currency);
        if (user.dateFormat) await AsyncStorage.setItem('date_format', user.dateFormat);
        if (user.numberFormat) await AsyncStorage.setItem('number_format', user.numberFormat);

        set({
            token,
            user,
            currency: user.currency || 'USD',
            dateFormat: user.dateFormat || 'dd/MM/yyyy',
            numberFormat: user.numberFormat || '1,234.56',
            hasOnboarded: isOnboarded
        });
    },

    signup: async (userData) => {
        const { token, user } = await db.signup(userData);
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(user));

        if (user.currency) await AsyncStorage.setItem('currency', user.currency);
        if (user.dateFormat) await AsyncStorage.setItem('date_format', user.dateFormat);
        if (user.numberFormat) await AsyncStorage.setItem('number_format', user.numberFormat);

        set({
            token,
            user,
            currency: user.currency || 'USD',
            dateFormat: user.dateFormat || 'dd/MM/yyyy',
            numberFormat: user.numberFormat || '1,234.56',
            hasOnboarded: false // Force setup flow
        });
    },

    googleLogin: async (idToken) => {
        const { token, user } = await db.googleLogin(idToken);
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(user));

        const isOnboarded = user.isOnboarded !== undefined ? !!user.isOnboarded : !!user.currency;
        await AsyncStorage.setItem('has_onboarded', isOnboarded ? 'true' : 'false');

        if (user.currency) await AsyncStorage.setItem('currency', user.currency);
        if (user.dateFormat) await AsyncStorage.setItem('date_format', user.dateFormat);
        if (user.numberFormat) await AsyncStorage.setItem('number_format', user.numberFormat);

        set({
            token,
            user,
            currency: user.currency || 'USD',
            dateFormat: user.dateFormat || 'dd/MM/yyyy',
            numberFormat: user.numberFormat || '1,234.56',
            hasOnboarded: isOnboarded
        });
    },

    appleLogin: async (appleData) => {
        const { token, user } = await db.appleLogin(appleData);
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(user));

        const isOnboarded = user.isOnboarded !== undefined ? !!user.isOnboarded : !!user.currency;
        await AsyncStorage.setItem('has_onboarded', isOnboarded ? 'true' : 'false');

        if (user.currency) await AsyncStorage.setItem('currency', user.currency);
        if (user.dateFormat) await AsyncStorage.setItem('date_format', user.dateFormat);
        if (user.numberFormat) await AsyncStorage.setItem('number_format', user.numberFormat);

        set({
            token,
            user,
            currency: user.currency || 'USD',
            dateFormat: user.dateFormat || 'dd/MM/yyyy',
            numberFormat: user.numberFormat || '1,234.56',
            hasOnboarded: isOnboarded
        });
    },

    logout: async () => {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('auth_user');
        await AsyncStorage.removeItem('has_onboarded');
        set({ token: null, user: null, hasOnboarded: false });
    },

    pushNotification: async (title, message) => {
        const { notificationsEnabled } = get();
        if (!notificationsEnabled) return;

        console.log(`[Store] pushNotification (Local): ${title}`);

        try {
            await sendLocalNotification(title, message);
        } catch (err) {
            console.error('Error sending local notification:', err);
        }
    },

    updatePushToken: async (token) => {
        const { user } = get();
        if (!user) return;
        await db.updatePushToken(user.id, token);
    }
}));
