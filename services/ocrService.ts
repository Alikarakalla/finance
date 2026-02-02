export interface ReceiptData {
    totalAmount: number;
    merchantName: string;
    date: string;
    items?: string[];
}

export const extractReceiptData = async (imageUri: string): Promise<ReceiptData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock OCR result
    // In a real app, this would use Google Cloud Vision API or AWS Textract
    return {
        totalAmount: parseFloat((Math.random() * 100).toFixed(2)),
        merchantName: "Starbucks",
        date: new Date().toISOString().split('T')[0],
        items: ["Latte", "Croissant"]
    };
};
