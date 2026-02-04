import { LiquidGlassCard as GlassCard } from '@/components/LiquidGlassComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import { useCurrencyFormatter } from '@/utils/format';
import { format, isToday, isYesterday } from 'date-fns';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { HelpCircle, Repeat } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
// import { ICON_MAP } from '../add-category';

export default function TransactionsScreen() {
    const router = useRouter();
    const { transactions, deleteTransaction, categories } = useFinanceStore();
    const formatCurrency = useCurrencyFormatter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'inflow' | 'outflow'>('all');
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';

    // Filter and Sort
    const filteredTransactions = useMemo(() => {
        let result = [...transactions].sort((a, b) => b.date - a.date);

        if (filterType !== 'all') {
            result = result.filter(t => t.type === filterType);
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.description.toLowerCase().includes(lowerQuery) ||
                (t.categoryName || t.categoryId).toLowerCase().includes(lowerQuery)
            );
        }

        return result;
    }, [transactions, searchQuery, filterType]);

    // Grouping
    const sections = useMemo(() => {
        const groups: { title: string; data: typeof transactions }[] = [];

        filteredTransactions.forEach(t => {
            const date = new Date(t.date);
            let title = format(date, 'MMMM d, yyyy');

            if (isToday(date)) title = 'Today';
            else if (isYesterday(date)) title = 'Yesterday';

            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.title === title) {
                lastGroup.data.push(t);
            } else {
                groups.push({ title, data: [t] });
            }
        });

        return groups;
    }, [filteredTransactions]);

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Transaction",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) }
            ]
        );
    };

    const getCategoryColor = (catName: string) => {
        const cat = categories.find(c => c.name === catName);
        return cat ? cat.color : Colors[theme].gray;
    };


    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <LinearGradient
                colors={theme === 'dark' ? ['#000', '#1c1c1e'] : ['#F8F9FA', '#E8F5E9']}
                style={StyleSheet.absoluteFill}
            />
            {/* Header / Search Area */}
            <View style={[styles.header, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <IconSymbol name="chevron-left" size={28} color={Colors[theme].text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: Colors[theme].text }]}>All Activity</Text>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: theme === 'dark' ? '#1E2330' : '#F5F5F5' }]}>
                    <IconSymbol name="search" size={20} color={Colors[theme].gray} style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.searchInput, { color: Colors[theme].text }]}
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={Colors[theme].gray}
                    />
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterRow}>
                    {(['all', 'inflow', 'outflow'] as const).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.filterChip,
                                { backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' },
                                filterType === type && styles.filterChipActive,
                                filterType === type && { backgroundColor: type === 'all' ? Colors[theme].tint : (type === 'inflow' ? Colors.income : Colors.expense) }
                            ]}
                            onPress={() => setFilterType(type as any)}
                        >
                            <Text style={[styles.filterText, { color: theme === 'dark' ? '#ccc' : '#666' }, filterType === type && styles.filterTextActive]}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderSectionHeader={({ section: { title } }) => (
                    <BlurView intensity={20} style={styles.sectionHeader} tint={theme}>
                        <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>{title}</Text>
                    </BlurView>
                )}
                renderItem={({ item }) => {
                    const category = categories.find(c => c.id === item.categoryId);
                    // const IconComp = category ? (ICON_MAP[category.icon] || HelpCircle) : HelpCircle;
                    const iconIsEmoji = category?.icon && category.icon.length <= 4 && !/^[a-zA-Z]+$/.test(category.icon);

                    return (
                        <TouchableOpacity
                            onLongPress={() => handleDelete(item.id)}
                            onPress={() => router.push({ pathname: '/transaction-detail', params: { transactionId: item.id } })}
                        >
                            <GlassCard style={styles.card} intensity={theme === 'dark' ? 40 : 60} variant={theme === 'dark' ? 'dark' : 'default'}>
                                <View style={styles.row}>
                                    <View style={[styles.iconBox, { backgroundColor: (category?.color || '#333') + '20' }]}>
                                        {iconIsEmoji ? (
                                            <Text style={{ fontSize: 20 }}>{category?.icon || '?'}</Text>
                                        ) : (
                                            <HelpCircle size={20} color={category?.color || (theme === 'dark' ? '#666' : '#999')} />
                                        )}
                                    </View>
                                    <View style={styles.details}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={[styles.itemCategory, { color: Colors[theme].text }]}>{item.categoryName || item.categoryId}</Text>
                                            {item.isRecurring && (
                                                <View style={[styles.recurringBadge, { backgroundColor: Colors.dashboard.cyan + '20' }]}>
                                                    <Repeat size={10} color={Colors.dashboard.cyan} strokeWidth={3} />
                                                    <Text style={[styles.recurringBadgeText, { color: Colors.dashboard.cyan }]}>
                                                        {item.recurringConfig?.frequency?.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.itemDesc, { color: Colors[theme].gray }]}>{item.description}</Text>
                                    </View>
                                    <View style={styles.amountBox}>
                                        <Text style={[styles.amount, { color: item.type === 'inflow' ? Colors.income : Colors.expense }]}>
                                            {item.type === 'inflow' ? '+' : '-'} {formatCurrency(Number(item.amount || 0))}
                                        </Text>
                                        {item.receiptImage && <IconSymbol name="camera-alt" size={12} color={Colors[theme].gray} style={{ marginTop: 4 }} />}
                                    </View>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    );
                }}
                stickySectionHeadersEnabled={true}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: Colors[theme].gray }]}>No transactions found.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
    },
    filterChip: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    filterChipActive: {
        // color handled inline
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    sectionHeader: {
        paddingVertical: 8,
        marginBottom: 8,
        marginTop: 16,
        borderRadius: 8,
        overflow: 'hidden',
        paddingHorizontal: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        marginBottom: 12,
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    details: {
        flex: 1,
    },
    itemCategory: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemDesc: {
        fontSize: 14,
    },
    amountBox: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
    recurringBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 2,
    },
    recurringBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
});
