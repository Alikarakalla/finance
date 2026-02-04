import { create } from 'zustand';
import * as db from '../services/db';
import { Category, Transaction } from '../types';

interface FinanceState {
    transactions: Transaction[];
    categories: Category[];

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

    // Getters
    getTransactionsByMonth: (month: string) => Transaction[];
    getBalance: () => number;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    transactions: [],
    categories: [],
    hasOnboarded: false,
    selectedDate: new Date(),

    completeOnboarding: () => set({ hasOnboarded: true }),
    setSelectedDate: (date: Date) => set({ selectedDate: date }),

    init: async () => {
        await db.initDatabase();
        const cats = await db.getCategories();
        const trans = await db.getTransactions();

        set({
            categories: cats,
            transactions: trans,
        });
    },

    refreshData: async () => {
        const cats = await db.getCategories();
        const trans = await db.getTransactions();

        set({
            categories: cats,
            transactions: trans,
        });
    },

    addTransaction: async (transaction) => {
        const result = await db.addTransaction(transaction);
        const trans = await db.getTransactions(); // Refresh
        set({ transactions: trans });
        return result;
    },

    updateTransaction: async (id, updates) => {
        await db.updateTransaction(id, updates);
        // Optimistic update below
        set((state) => ({
            transactions: state.transactions.map((t) =>
                t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
            )
        }));
    },

    deleteTransaction: async (id) => {
        const result = await db.deleteTransaction(id);
        set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id)
        }));
        return result;
    },

    addCategory: async (category) => {
        await db.addCategory(category);
        const cats = await db.getCategories();
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
    }
}));
