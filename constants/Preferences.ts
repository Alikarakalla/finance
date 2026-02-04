export const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$', flag: '🇦🇺' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
    { code: 'LBP', name: 'Lebanese Pound', symbol: 'L.L.', flag: '🇱🇧' },
];

export const DATE_FORMATS = [
    { label: '03/02/2026', value: 'dd/MM/yyyy' },
    { label: '02/03/2026', value: 'MM/dd/yyyy' },
    { label: '2026/02/03', value: 'yyyy/MM/dd' },
    { label: '03-02-2026', value: 'dd-MM-yyyy' },
    { label: '02-03-2026', value: 'MM-dd-yyyy' },
    { label: '2026-02-03', value: 'yyyy-MM-dd' },
    { label: '03 Feb 2026', value: 'dd MMM yyyy' },
    { label: 'Feb 03, 2026', value: 'MMM dd, yyyy' },
];

export const NUMBER_FORMATS = [
    { label: '1,234.56', decimal: '.', thousand: ',' },
    { label: '1.234,56', decimal: ',', thousand: '.' },
    { label: '1 234.56', decimal: '.', thousand: ' ' },
    { label: '1\'234.56', decimal: '.', thousand: '\'' },
];
