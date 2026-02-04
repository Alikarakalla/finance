export type TransactionType = 'inflow' | 'outflow';

export type RecurringFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';

export interface RecurringConfig {
    frequency: RecurringFrequency;
    endDate: number | null; // timestamp
    occurrences: number | null;
}

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    categoryId: string; // Foreign Key
    categoryName?: string; // For UI display
    date: number; // timestamp
    description: string;
    tags: string[];
    isRecurring: boolean;
    recurringConfig?: RecurringConfig;
    reminderDays?: number | null;
    receiptImage: string | null;
    createdAt: number;
    updatedAt: number;
}

export interface Category {
    id: string;
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
    budget: number | null;
    isDefault: boolean;
}

export interface Budget {
    id: string;
    month: string; // "2025-01"
    totalBudget: number;
    categoryBudgets: { [categoryId: string]: number };
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'alert' | 'info' | 'recurring' | 'system';
    is_read: boolean;
    created_at: number;
}
