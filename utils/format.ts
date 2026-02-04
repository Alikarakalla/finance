import { CURRENCIES, NUMBER_FORMATS } from '@/constants/Preferences';
import { useFinanceStore } from '@/store/financeStore';
import { format } from 'date-fns';
// @ts-ignore
import { getAllISOCodes } from 'iso-country-currency';

// Build a symbol map once
const SYMBOL_MAP: Record<string, string> = {};
try {
    const all = getAllISOCodes();
    all.forEach((c: any) => {
        if (c.currency && c.symbol) {
            SYMBOL_MAP[c.currency] = c.symbol;
        }
    });
} catch (e) {
    // Silent fail
}

const getSymbol = (currencyCode: string): string => {
    if (!currencyCode) return '$';
    // 1. Try our generated map
    if (SYMBOL_MAP[currencyCode]) return SYMBOL_MAP[currencyCode];
    // 2. Try the old constant
    const legacy = CURRENCIES.find(c => c.code === currencyCode);
    if (legacy) return legacy.symbol;
    // 3. Fallback to code itself (e.g. "XOF") usually better than "$" if unknown
    return currencyCode;
};

export const formatCurrency = (amount: number): string => {
    // We access the store state directly to avoid hook rules in non-hook functions
    const { currency, numberFormat } = useFinanceStore.getState();

    // Find currency symbol
    const symbol = getSymbol(currency);

    // Find number format
    const fmt = NUMBER_FORMATS.find(f => f.label === numberFormat) || NUMBER_FORMATS[0];

    // Format number
    const parts = Math.abs(amount).toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, fmt.thousand);
    const formattedNumber = parts.join(fmt.decimal);

    // Initial sign
    const sign = amount < 0 ? '-' : '';

    return `${sign}${symbol}${formattedNumber}`;
};

export const formatDate = (date: Date | number | string, customFormat?: string): string => {
    const { dateFormat } = useFinanceStore.getState();
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    try {
        return format(d, customFormat || dateFormat);
    } catch (e) {
        return format(d, 'dd/MM/yyyy');
    }
};

// Hook version
export const useCurrencyFormatter = () => {
    const { currency, numberFormat } = useFinanceStore();

    // Memoizing this function isn't strictly necessary but good if it's used in dependency arrays
    // But since it depends on currency/numberFormat, it recreates anyway.
    return (amount: number) => {
        const symbol = getSymbol(currency);
        const fmt = NUMBER_FORMATS.find(f => f.label === numberFormat) || NUMBER_FORMATS[0];

        const parts = Math.abs(amount).toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, fmt.thousand);
        const formattedNumber = parts.join(fmt.decimal);

        const sign = amount < 0 ? '-' : '';
        return `${sign}${symbol}${formattedNumber}`;
    };
};

export const useDateFormatter = () => {
    const { dateFormat } = useFinanceStore();
    return (date: Date | number | string) => {
        const d = new Date(date);
        return format(d, dateFormat);
    };
};
