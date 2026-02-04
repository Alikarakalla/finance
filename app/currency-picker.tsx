import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFinanceStore } from '@/store/financeStore';
import { Stack, useRouter } from 'expo-router';
// @ts-ignore
import cc from 'currency-codes'; // New Library
import * as Haptics from 'expo-haptics';
import { getAllISOCodes } from 'iso-country-currency';
import React, { useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
// @ts-ignore
import { BlurView } from 'expo-blur';

export default function CurrencyPickerScreen() {
    const router = useRouter();
    const { setCurrency, currency } = useFinanceStore();

    // Theme Constants
    const BACKGROUND_COLOR = '#1c1c1e';
    const CARD_BACKGROUND = '#2c2c2e';
    const SEPARATOR_COLOR = '#38383A';

    const [searchQuery, setSearchQuery] = useState('');

    // --- Helpers ---
    const getFlag = (code: string) => {
        // Explicit cases for non-standard country mapping or shared currencies
        if (code === 'EUR') return '🇪🇺'; // European Union
        if (code === 'USD') return '🇺🇸'; // US
        if (code === 'GBP') return '🇬🇧'; // UK

        // Fallback: Use first 2 letters of currency code as Country Code
        const countryCode = code.slice(0, 2).toUpperCase();
        return countryCode.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
    };

    const getSymbol = (code: string, isoSymbol?: string) => {
        const overrides: Record<string, string> = {
            'JPY': '¥',
            'USD': '$',
            'GBP': '£',
            'EUR': '€',
            'KRW': '₩',
            'INR': '₹',
            'RUB': '₽',
            'TRY': '₺',
            'ILS': '₪',
            'VND': '₫',
            'THB': '฿',
            'NGN': '₦',
            'PHP': '₱',
            'IDR': 'Rp',
            'TWD': 'NT$',
            'LBP': 'L.L',
        };
        return overrides[code] || isoSymbol || code;
    };

    // --- Data Preparation ---
    const sections = useMemo(() => {
        // 1. Get Symbols Map from ISO library
        const isoCodes = getAllISOCodes();
        const symbolMap = new Map();
        isoCodes.forEach((c: any) => {
            if (c.symbol && !symbolMap.has(c.currency)) {
                symbolMap.set(c.currency, c.symbol);
            }
        });

        // 2. Map data from currency-codes library
        const allCurrencies = cc.data.map((c: any) => ({
            currency: c.code,
            name: c.currency, // "US Dollar"
            symbol: getSymbol(c.code, symbolMap.get(c.code)),
            flag: getFlag(c.code)
        }));

        // 3. Filter & Categorize
        const popularCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'CAD', 'AUD', 'CHF'];
        const popularData: any[] = [];
        const otherData: any[] = [];

        allCurrencies.forEach((item: any) => {
            // Filter Search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!item.name.toLowerCase().includes(q) && !item.currency.toLowerCase().includes(q)) {
                    return;
                }
            }

            // Popular check
            if (popularCodes.includes(item.currency)) {
                if (!searchQuery) popularData.push(item);
                // If searching, we skip adding to popular and let it fall into alphabetical?
                // Visual consistency: If searching "Dollar", show results in list.
                // Let's exclude popular from main list if NOT searching to avoid dupes.
            }

            if (!searchQuery && popularCodes.includes(item.currency)) return;

            otherData.push(item);
        });

        // Sort Popular
        popularData.sort((a, b) => popularCodes.indexOf(a.currency) - popularCodes.indexOf(b.currency));

        // Group Others
        const letterMap: Record<string, any[]> = {};
        otherData.forEach(item => {
            const letter = item.currency.charAt(0).toUpperCase();
            if (!letterMap[letter]) letterMap[letter] = [];
            letterMap[letter].push(item);
        });

        const result = [];
        if (popularData.length > 0) {
            result.push({ title: 'Popular', data: popularData });
        }

        Object.keys(letterMap).sort().forEach(letter => {
            result.push({ title: letter, data: letterMap[letter].sort((a: any, b: any) => a.currency.localeCompare(b.currency)) });
        });

        return result;

    }, [searchQuery]);


    // --- Render Item ---
    const renderItem = ({ item, index, section }: { item: any, index: number, section: any }) => {
        const isFirst = index === 0;
        const isLast = index === section.data.length - 1;

        return (
            <TouchableOpacity
                style={[
                    styles.row,
                    { backgroundColor: CARD_BACKGROUND },
                    isFirst && styles.rowFirst,
                    isLast && styles.rowLast,
                ]}
                onPress={() => {
                    setCurrency(item.currency);
                    Haptics.selectionAsync();
                    router.back();
                }}
                activeOpacity={0.7}
            >
                {/* Symbol */}
                <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>{item.symbol}</Text>
                </View>

                {/* Text Content */}
                <View style={[
                    styles.textContainer,
                    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR_COLOR }
                ]}>
                    <Text style={styles.currencyText} numberOfLines={1}>{item.currency} - {item.name}</Text>
                </View>

                {/* Flag */}
                <View style={[
                    styles.flagContainer,
                    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR_COLOR }
                ]}>
                    <Text style={styles.flagText}>{item.flag}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: "Select Currency",
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <IconSymbol name="close" size={18} color="#fff" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => null,
                    headerTitleStyle: { color: '#fff', fontSize: 17, fontWeight: '600' }
                }}
            />

            <SectionList
                sections={sections}
                keyExtractor={(item, index) => item.currency + index}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={{
                    paddingTop: 100,
                    paddingBottom: 150,
                    paddingHorizontal: 16
                }}
                stickySectionHeadersEnabled={false}
                showsVerticalScrollIndicator={false}
            />

            {/* Bottom Search Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.searchContainerWrapper}
                keyboardVerticalOffset={0}
            >
                <BlurView intensity={30} tint="dark" style={styles.searchBlur}>
                    <View style={styles.searchBar}>
                        <IconSymbol name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder="Search currency or country"
                            placeholderTextColor="#8E8E93"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            keyboardAppearance="dark"
                        />
                    </View>
                </BlurView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sectionHeader: {
        marginBottom: 8,
        marginTop: 16,
        paddingHorizontal: 4,
    },
    sectionHeaderText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '400',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56, // Taller rows
    },
    rowFirst: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: 'hidden',
    },
    rowLast: {
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        overflow: 'hidden',
    },
    symbolContainer: {
        width: 30, // Fixed width for alignment
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    symbolText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '500',
    },
    textContainer: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        marginLeft: 8,
    },
    currencyText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '400',
    },
    flagContainer: {
        height: '100%',
        justifyContent: 'center',
        paddingLeft: 12,
        minWidth: 30,
        alignItems: 'flex-end',
    },
    flagText: {
        fontSize: 22,
    },
    // Header Button
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Search
    searchContainerWrapper: {
        position: 'absolute',
        bottom: 30,
        left: 16,
        right: 16,
    },
    searchBlur: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 12,
        height: 50,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 17,
        height: '100%',
    }
});
