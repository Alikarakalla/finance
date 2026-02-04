import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Calendar,
    Clock,
    Hash,
    Info,
    Repeat,
    Trash2
} from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

export default function TransactionDetailScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = (colorScheme ?? 'light') as 'light' | 'dark';
    const { transactions, deleteTransaction } = useFinanceStore();

    const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
    const transaction = transactions.find(t => t.id === transactionId);

    if (!transaction) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <Text style={{ color: Colors[theme].text }}>Transaction not found</Text>
            </View>
        );
    }

    const handleDelete = () => {
        Alert.alert(
            "Delete Transaction",
            "Are you sure you want to delete this transaction?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteTransaction(transaction.id);
                        router.back();
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: "Details",
                    headerTitleStyle: { color: Colors[theme].text, fontWeight: '800' },
                    headerLeft: () => (
                        <Pressable
                            onPress={() => router.back()}
                            style={styles.headerBtn}
                        >
                            <IconSymbol
                                name="chevron-left"
                                color={theme === 'dark' ? '#fff' : '#000'}
                                size={24}
                                weight="medium"
                            />
                        </Pressable>
                    ),
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: '/add-transaction',
                                    params: {
                                        editingTransactionId: transaction.id
                                    }
                                })}
                                style={styles.headerBtn}
                            >
                                <IconSymbol name="edit" size={24} color={Colors[theme].text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
                                <Trash2 size={24} color={Colors.expense} />
                            </TouchableOpacity>
                        </View>
                    )
                }}
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Hero Header */}
                <View style={[styles.hero, { backgroundColor: transaction.type === 'inflow' ? Colors.income + '20' : Colors.expense + '20' }]}>
                    <Text style={[styles.heroAmount, { color: transaction.type === 'inflow' ? Colors.income : Colors.expense }]}>
                        {transaction.type === 'inflow' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </Text>
                    <Text style={[styles.heroCategory, { color: Colors[theme].text }]}>{transaction.categoryName || 'General'}</Text>
                </View>

                {/* Info List */}
                <View style={styles.section}>
                    <DetailRow
                        icon={<Calendar size={20} color={Colors[theme].gray} />}
                        label="Date"
                        value={format(new Date(transaction.date), 'EEEE, MMMM do yyyy')}
                        theme={theme}
                    />
                    <DetailRow
                        icon={<Clock size={20} color={Colors[theme].gray} />}
                        label="Time"
                        value={format(new Date(transaction.date), 'h:mm a')}
                        theme={theme}
                    />
                    <DetailRow
                        icon={<Info size={20} color={Colors[theme].gray} />}
                        label="Description"
                        value={transaction.description}
                        theme={theme}
                    />
                    {transaction.isRecurring && (
                        <DetailRow
                            icon={<Repeat size={20} color={Colors.dashboard.cyan} />}
                            label="Recurring"
                            value={transaction.recurringConfig?.frequency.toUpperCase() || 'YES'}
                            theme={theme}
                            valueColor={Colors.dashboard.cyan}
                        />
                    )}
                </View>

                {/* Meta Section */}
                <View style={styles.section}>
                    <View style={styles.metaRow}>
                        <Hash size={16} color={Colors[theme].gray} />
                        <Text style={[styles.metaText, { color: Colors[theme].gray }]}>ID: {transaction.id}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Clock size={16} color={Colors[theme].gray} />
                        <Text style={[styles.metaText, { color: Colors[theme].gray }]}>Created: {format(new Date(transaction.createdAt), 'MMM d, HH:mm')}</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const DetailRow = ({ icon, label, value, theme, valueColor }: any) => (
    <View style={[styles.detailRow, { borderBottomColor: theme === 'dark' ? '#222' : '#eee' }]}>
        <View style={styles.rowLeft}>
            {icon}
            <Text style={[styles.rowLabel, { color: Colors[theme as 'light' | 'dark'].gray }]}>{label}</Text>
        </View>
        <Text style={[styles.rowValue, { color: valueColor || Colors[theme as 'light' | 'dark'].text }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBtn: {
        width: 20,
        height: 20,
        borderRadius: 50,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: 'transparent',
                marginHorizontal: 8,
            },
            android: {
                backgroundColor: 'rgba(0,0,0,0.05)',
                marginHorizontal: 8,
            }
        })
    },
    content: { paddingTop: 120, paddingHorizontal: 20 },
    hero: {
        alignItems: 'center',
        paddingVertical: 40,
        borderRadius: 32,
        marginBottom: 30,
    },
    heroAmount: {
        fontSize: 48,
        fontWeight: '800',
    },
    heroCategory: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 8,
        opacity: 0.8
    },
    section: {
        backgroundColor: 'rgba(128,128,128,0.05)',
        borderRadius: 24,
        padding: 8,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    rowValue: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
        textAlign: 'right',
        marginLeft: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
    }
});
