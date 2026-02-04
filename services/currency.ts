export const fetchExchangeRates = async (base: string = 'USD'): Promise<Record<string, number> | null> => {
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
        const data = await response.json();
        if (data.result === 'success') {
            return data.rates;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        return null;
    }
};

export const convertAmount = (amount: number, fromRate: number, toRate: number): number => {
    // Convert to base (USD), then to target
    // If rates are relative to base USD:
    // Amount (From) -> Amount / FromRate = Amount (USD)
    // Amount (USD) * ToRate = Amount (To)
    // So: Amount * (ToRate / FromRate)

    if (!fromRate || !toRate) return amount;
    return amount * (toRate / fromRate);
};
