import { LiquidGlassCard as GlassCard } from '@/components/LiquidGlassComponents';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ChevronLeft,
    Edit3,
    HelpCircle,
    Plus,
    Trash2
} from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

export default function CategoryManagementScreen() {
    const { categories, deleteCategory } = useFinanceStore();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${name}"? This will also delete all transactions associated with this category.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategory(id);
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete category');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        // const IconComp = ICON_MAP[item.icon] || HelpCircle;
        const isLegacy = item.icon.length > 4 && /^[a-zA-Z]+$/.test(item.icon);

        return (
            <GlassCard
                style={styles.categoryCard}
                variant={theme === 'dark' ? 'dark' : 'default'}
                intensity={theme === 'dark' ? 40 : 70}
            >
                <View style={styles.itemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                        {isLegacy ? (
                            <HelpCircle size={24} color={item.color} strokeWidth={2.5} />
                        ) : (
                            <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                        )}
                    </View>
                    <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: Colors[theme].text }]}>{item.name}</Text>
                        <Text style={[styles.itemType, { color: item.type === 'inflow' ? Colors.income : Colors.expense }]}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push({ pathname: '/add-category', params: { categoryId: item.id } })}
                    >
                        <Edit3 size={20} color={Colors[theme].gray} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDelete(item.id, item.name)}
                    >
                        <Trash2 size={20} color={Colors.expense} />
                    </TouchableOpacity>
                </View>
            </GlassCard>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: "",
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.headerBtn}
                        >
                            <ChevronLeft size={28} color={Colors[theme].text} strokeWidth={2.5} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            style={[styles.headerBtn, styles.addBtnHeader, { backgroundColor: Colors.dashboard.cyan }]}
                            onPress={() => router.push('/add-category')}
                        >
                            <Plus size={22} color="#fff" strokeWidth={3} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={<View style={{ height: 10 }} />}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <HelpCircle size={48} color={Colors[theme].gray} />
                        <Text style={[styles.emptyText, { color: Colors[theme].gray }]}>No categories found</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    addBtnHeader: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    listContent: { paddingHorizontal: 20, paddingTop: 110, paddingBottom: 40 },
    categoryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 24
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    itemInfo: { gap: 2 },
    itemName: { fontSize: 17, fontWeight: '700' },
    itemType: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    actions: { flexDirection: 'row', gap: 4 },
    actionBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 100, gap: 12 },
    emptyText: { fontSize: 16, fontWeight: '600' }
});
