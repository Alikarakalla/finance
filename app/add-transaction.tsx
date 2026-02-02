import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import { RecurringFrequency, TransactionType } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
// import { MenuView, NativeActionEvent } from '@react-native-menu/menu';

import { Divider, Menu, Provider as PaperProvider } from 'react-native-paper';

export default function AddTransactionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addTransaction, categories, refreshData, transactions, selectedDate } = useFinanceStore();
    console.log('[UI AddTransaction] Categories in store:', categories.length);

    // Calculate baseColor for gradient (matching Home Screen logic)
    const currentMonth = format(selectedDate, 'yyyy-MM');
    const monthlyTransactions = transactions.filter(t => format(new Date(t.date), 'yyyy-MM') === currentMonth);
    const monthlyInflow = monthlyTransactions
        .filter(t => t.type === 'inflow')
        .reduce((acc, t) => acc + t.amount, 0);
    const monthlyOutflow = monthlyTransactions
        .filter(t => t.type === 'outflow')
        .reduce((acc, t) => acc + t.amount, 0);
    const monthlyBudget = monthlyInflow;
    const leftToSpend = monthlyBudget - monthlyOutflow;
    const availablePercentage = monthlyBudget > 0 ? Math.max(0, Math.min(100, (leftToSpend / monthlyBudget) * 100)) : 0;

    const baseColor = availablePercentage < 25
        ? Colors.expense
        : availablePercentage < 50
            ? Colors.dashboard.orange
            : '#0D93FC';

    const [type, setType] = useState<TransactionType>((params.type as TransactionType) || 'outflow');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); // Store ID
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
    const [image, setImage] = useState<string | null>(null);

    // Reminder State
    const [reminder, setReminder] = useState<string>('None');
    const [reminderMenuVisible, setReminderMenuVisible] = useState(false);

    useEffect(() => {
        refreshData();
    }, []);

    // Filter categories by type
    const filteredCategories = categories.filter(c => c.type === type);

    const handleSave = async () => {
        if (!amount || isNaN(Number(amount))) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }
        if (!selectedCategoryId) {
            Alert.alert('Error', 'Please select a category');
            return;
        }

        const selectedCat = categories.find(c => c.id === selectedCategoryId);

        const newTransaction = {
            id: Date.now().toString(),
            type,
            amount: parseFloat(amount),
            categoryId: selectedCategoryId,
            categoryName: selectedCat?.name, // Store for UI
            date: date.getTime(),
            description: description || 'No description',
            tags: [],
            isRecurring,
            recurringConfig: isRecurring ? {
                frequency,
                endDate: null,
                occurrences: null
            } : undefined,
            receiptImage: image,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const response = await addTransaction(newTransaction);

        // Debug Alert
        Alert.alert(
            'Transaction Saved',
            `App marked recurring: ${isRecurring ? 'YES' : 'NO'}\n` +
            `Server saved recurring: ${response?.savedAsRecurring ? 'YES' : 'NO'}\n` +
            `Server Version: ${response?.v || 'Old/Unknown'}\n` +
            `Frequency: ${frequency.toUpperCase()}`
        );

        router.back();
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    return (
        <PaperProvider>
            <LinearGradient
                colors={[baseColor + '1A', '#000000']}
                locations={[0, 0.35]}
                style={styles.container}
            >
                <StatusBar barStyle="light-content" />
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTransparent: true,
                        headerTitle: "Add Transaction",
                        headerTintColor: '#fff',
                        headerLeft: () => (
                            <Pressable
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <IconSymbol
                                    name="chevron-left"
                                    color="#fff"
                                    size={24}
                                />
                            </Pressable>
                        ),
                        headerRight: () => (
                            <View style={styles.headerRightContainer}>
                                <Pressable
                                    onPress={() => { /* Clear or help */ }}
                                    style={{ padding: 8 }}
                                >
                                    <IconSymbol name="more-horiz" size={24} color="#fff" />
                                </Pressable>
                            </View>
                        )
                    }}
                />

                <ScrollView contentContainerStyle={styles.content}>

                    {/* Type Switcher */}
                    {/* Type Switcher */}
                    <View style={styles.segmentContainer}>
                        <SegmentedControl
                            values={['Income', 'Expense']}
                            selectedIndex={type === 'outflow' ? 1 : 0}
                            onChange={(event) => {
                                const index = event.nativeEvent.selectedSegmentIndex;
                                setType(index === 0 ? 'inflow' : 'outflow');
                                setSelectedCategoryId('');
                            }}
                            // @ts-ignore: 'glass' is a valid value for iOS 13+ but missing in types
                            appearance="glass"
                            fontStyle={{ color: '#8E8E93', fontWeight: '600', fontSize: 13 }}
                            activeFontStyle={{ color: '#fff' }}
                            tintColor="rgba(255, 255, 255, 0.15)"
                            style={styles.segmentedControl}
                        />
                    </View>

                    {/* Amount Input */}
                    <View style={styles.amountContainer}>
                        <Text style={[styles.currencySymbol, { color: type === 'inflow' ? Colors.income : Colors.expense }]}>$</Text>
                        <TextInput
                            style={[styles.amountInput, { color: type === 'inflow' ? Colors.income : Colors.expense }]}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            placeholderTextColor="#666"
                            autoFocus
                        />
                    </View>

                    {/* Category Selection */}
                    <Text style={styles.label}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {filteredCategories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    selectedCategoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                                ]}
                                onPress={() => setSelectedCategoryId(cat.id)}
                            >
                                <View style={[styles.categoryIcon, selectedCategoryId === cat.id && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                                    {/* Using icon name directly if valid, else fallback */}
                                    <IconSymbol name="pie-chart" size={16} color={selectedCategoryId === cat.id ? '#fff' : cat.color} />
                                </View>
                                <Text style={[styles.categoryText, selectedCategoryId === cat.id && { color: '#fff' }]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.categoryChip, styles.addCategoryChip]}
                            onPress={() => router.push('/add-category')}
                        >
                            <IconSymbol name="plus" size={16} color={Colors.light.text} />
                            <Text style={styles.categoryText}>Add</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <Text style={styles.label}>Date</Text>
                    <View style={[styles.formRow, { justifyContent: 'space-between', paddingVertical: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <IconSymbol name="calendar-today" size={20} color={Colors.light.gray} />
                            <Text style={styles.formLabel}>Transaction Date</Text>
                        </View>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="compact"
                            onChange={(event, selectedDate) => {
                                if (selectedDate) setDate(selectedDate);
                            }}
                            accentColor="#007AFF"
                            style={{ width: 120 }}
                        />
                    </View>

                    {/* Description */}
                    <Text style={styles.label}>Description</Text>
                    <View style={styles.formRow}>
                        <IconSymbol name="edit" size={20} color={Colors.light.gray} />
                        <TextInput
                            style={styles.input}
                            placeholder="What is this for?"
                            placeholderTextColor="#666"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Recurring */}
                    <View style={[styles.formRow, { justifyContent: 'space-between', marginTop: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <IconSymbol name="more-horiz" size={20} color={Colors.light.gray} />
                            <Text style={styles.formLabel}>Recurring Payment</Text>
                        </View>
                        <Switch
                            value={isRecurring}
                            onValueChange={setIsRecurring}
                            trackColor={{ false: '#767577', true: Colors.light.tint }}
                        />
                    </View>

                    {isRecurring && (
                        <View style={{ marginTop: 12 }}>
                            <Text style={styles.label}>Frequency</Text>
                            <View style={styles.segmentContainer}>
                                {/* Uncomment for Native Dev Build
                            <MenuView
                                title="Choose Frequency"
                                onPressAction={({ nativeEvent }) => {
                                    setFrequency(nativeEvent.event as RecurringFrequency);
                                }}
                                actions={[
                                    {
                                        id: 'weekly',
                                        title: 'Weekly',
                                        image: 'calendar.circle',
                                        state: frequency === 'weekly' ? 'on' : 'off',
                                    },
                                    {
                                        id: 'monthly',
                                        title: 'Monthly',
                                        image: 'moon.circle',
                                        state: frequency === 'monthly' ? 'on' : 'off',
                                    },
                                    {
                                        id: 'yearly',
                                        title: 'Yearly',
                                        image: 'globe',
                                        state: frequency === 'yearly' ? 'on' : 'off',
                                    },
                                ]}
                                shouldOpenOnLongPress={false}
                            >
                                <Pressable style={styles.selectorButton}>
                                    <Text style={styles.buttonText}>
                                        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                                    </Text>
                                    <IconSymbol name="chevron-right" size={20} color={PlatformColor('systemGray')} style={{ transform: [{ rotate: '90deg' }] }} />
                                </Pressable>
                            </MenuView>
                            */}
                                {/* Fallback for Expo Go */}
                                <SegmentedControl
                                    values={['Weekly', 'Monthly', 'Yearly']}
                                    selectedIndex={['weekly', 'monthly', 'yearly'].indexOf(frequency)}
                                    onChange={(event) => {
                                        const index = event.nativeEvent.selectedSegmentIndex;
                                        setFrequency((['weekly', 'monthly', 'yearly'] as const)[index]);
                                    }}
                                    // @ts-ignore
                                    appearance="glass"
                                    fontStyle={{ color: '#8E8E93', fontWeight: '600', fontSize: 13 }}
                                    activeFontStyle={{ color: '#fff' }}
                                    tintColor="rgba(255, 255, 255, 0.15)"
                                    style={styles.segmentedControl}
                                />
                            </View>
                        </View>
                    )}

                    {/* Notify Me - Reminder */}
                    <View style={[styles.formRow, { justifyContent: 'space-between', marginTop: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <IconSymbol name="notifications" size={20} color={Colors.light.gray} />
                            <Text style={styles.formLabel}>Notify Me</Text>
                        </View>

                        <Menu
                            visible={reminderMenuVisible}
                            onDismiss={() => setReminderMenuVisible(false)}
                            anchor={
                                <TouchableOpacity onPress={() => setReminderMenuVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 16, marginRight: 8 }}>{reminder}</Text>
                                    <IconSymbol name="chevron-right" size={20} color={Colors.light.gray} />
                                </TouchableOpacity>
                            }
                            contentStyle={{ backgroundColor: '#1E2330', borderRadius: 12, borderWidth: 1, borderColor: '#333' }}
                        >
                            <Menu.Item
                                onPress={() => { setReminder('None'); setReminderMenuVisible(false); }}
                                title="None"
                                titleStyle={{ color: '#fff' }}
                            />
                            <Divider style={{ backgroundColor: '#333' }} />
                            <Menu.Item
                                onPress={() => { setReminder('1 Day Before'); setReminderMenuVisible(false); }}
                                title="1 Day Before"
                                titleStyle={{ color: '#fff' }}
                            />
                            <Divider style={{ backgroundColor: '#333' }} />
                            <Menu.Item
                                onPress={() => { setReminder('3 Days Before'); setReminderMenuVisible(false); }}
                                title="3 Days Before"
                                titleStyle={{ color: '#fff' }}
                            />
                            <Divider style={{ backgroundColor: '#333' }} />
                            <Menu.Item
                                onPress={() => { setReminder('7 Days Before'); setReminderMenuVisible(false); }}
                                title="7 Days Before"
                                titleStyle={{ color: '#fff' }}
                            />
                        </Menu>
                    </View>

                    {/* Attachment */}
                    <Text style={styles.label}>Attachment</Text>
                    <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} />
                        ) : (
                            <>
                                <IconSymbol name="camera-alt" size={24} color={Colors.light.gray} />
                                <Text style={styles.uploadText}>Attach Receipt</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Save Button */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>Save Transaction</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient >
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dashboard.background, // Dark background
    },
    backButton: {
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
    headerRightContainer: {
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
    content: {
        padding: 20,
        paddingTop: 110, // Space for header content
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 24,
    },
    segmentContainer: {
        marginBottom: 24,
    },
    segmentedControl: {
        height: 40,
        // The glass effect handles borderRadius and shadows natively on iOS
    },
    selectorButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 16,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '600',
        marginRight: 4,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '700',
        minWidth: 100,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#AAA',
        marginBottom: 12,
        marginTop: 12,
    },
    categoryScroll: {
        marginBottom: 12,
        flexGrow: 0,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#1E2330',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    addCategoryChip: {
        backgroundColor: 'transparent',
        borderStyle: 'dashed',
        borderColor: '#666',
    },
    categoryIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ddd',
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E2330',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    formValue: {
        fontSize: 16,
        color: '#fff',
    },
    formLabel: {
        fontSize: 16,
        color: '#fff',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    uploadBox: {
        height: 120,
        backgroundColor: '#1E2330',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    uploadText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        resizeMode: 'cover',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: Colors.dashboard.background, // Solid bg behind button to cover content
        paddingBottom: 40,
    },
    saveBtn: {
        backgroundColor: Colors.light.tint,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.light.tint,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
