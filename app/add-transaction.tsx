import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { CURRENCIES } from '@/constants/Preferences';
import { useFinanceStore } from '@/store/financeStore';
import { RecurringFrequency, TransactionType } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
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
    View,
    useColorScheme
} from 'react-native';
// import { MenuView, NativeActionEvent } from '@react-native-menu/menu';

import { Divider, Menu, Provider as PaperProvider } from 'react-native-paper';

export default function AddTransactionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addTransaction, updateTransaction, categories, refreshData, transactions, selectedDate, currency } = useFinanceStore();
    console.log('[UI AddTransaction] Categories in store:', categories.length);

    // Edit Mode Logic
    const editingTransactionId = params.editingTransactionId as string | undefined;
    const editingTransaction = editingTransactionId ? transactions.find(t => t.id === editingTransactionId) : undefined;
    const isEditing = !!editingTransaction;

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

    const [type, setType] = useState<TransactionType>(
        (editingTransaction?.type as TransactionType) || (params.type as TransactionType) || 'outflow'
    );
    const [amount, setAmount] = useState(editingTransaction ? editingTransaction.amount.toString() : '');
    const [description, setDescription] = useState(editingTransaction?.description || '');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(editingTransaction?.categoryId || '');
    const [date, setDate] = useState(editingTransaction ? new Date(editingTransaction.date) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isRecurring, setIsRecurring] = useState(editingTransaction?.isRecurring || false);
    const [frequency, setFrequency] = useState<RecurringFrequency>(
        (editingTransaction?.recurringConfig?.frequency as RecurringFrequency) || 'monthly'
    );
    const [image, setImage] = useState<string | null>(editingTransaction?.receiptImage || null);

    // Reminder Map
    const reminderMap: Record<number, string> = {
        0: 'None',
        1: '1 Day Before',
        3: '3 Days Before',
        7: '7 Days Before'
    };
    const reminderReverseMap: Record<string, number> = {
        'None': 0,
        '1 Day Before': 1,
        '3 Days Before': 3,
        '7 Days Before': 7
    };

    // Reminder State
    const [reminder, setReminder] = useState<string>(
        editingTransaction?.reminderDays ? reminderMap[editingTransaction.reminderDays] || 'None' : 'None'
    );
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

        const transactionData = {
            id: isEditing ? editingTransaction!.id : Date.now().toString(),
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
            reminderDays: reminderReverseMap[reminder] || null,
            receiptImage: image,
            createdAt: isEditing ? editingTransaction!.createdAt : Date.now(),
            updatedAt: Date.now(),
        };

        if (isEditing) {
            await updateTransaction(transactionData.id, transactionData);
            Alert.alert('Success', 'Transaction updated');
        } else {
            const response = await addTransaction(transactionData);
            // Debug Alert for Add
            if (!isEditing) {
                Alert.alert(
                    'Transaction Saved',
                    `App marked recurring: ${isRecurring ? 'YES' : 'NO'}\n` +
                    `Server saved recurring: ${response?.savedAsRecurring ? 'YES' : 'NO'}\n` +
                    `Server Version: ${response?.v || 'Old/Unknown'}\n` +
                    `Frequency: ${frequency.toUpperCase()}`
                );
            }
        }




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

    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const backgroundColor = theme === 'dark' ? '#000000' : '#ffffff';
    const textColor = theme === 'dark' ? '#ffffff' : '#000000';
    const formBackgroundColor = theme === 'dark' ? '#1E2330' : '#F2F2F7';
    const formTextColor = theme === 'dark' ? '#ffffff' : '#000000';
    const placeholderColor = theme === 'dark' ? '#666' : '#999';

    return (
        <PaperProvider>
            <View style={[styles.container, { backgroundColor }]}>
                <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTransparent: true,
                        headerTitle: isEditing ? "Edit Transaction" : "Add Transaction",
                        headerTintColor: textColor,
                        headerLeft: () => (
                            <Pressable
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <IconSymbol
                                    name="chevron-left"
                                    color={textColor}
                                    size={24}
                                />
                            </Pressable>
                        ),
                        headerRight: () => (
                            // <TouchableOpacity
                            //     onPress={handleSave}
                            //     style={{ padding: 8, marginRight: 8 }}
                            // >
                            //     <Text style={{ color: Colors.light.tint, fontSize: 17, fontWeight: '600' }}>Save</Text>
                            // </TouchableOpacity>

                            <Pressable
                                onPress={handleSave}
                                style={{ padding: 8 }}
                            >
                                <Text style={{ color: Colors.light.tint, fontSize: 17, fontWeight: '600' }}>Save</Text>
                            </Pressable>
                        )
                    }}
                />

                <ScrollView contentContainerStyle={styles.content}>

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
                            appearance={theme === 'dark' ? 'dark' : 'light'}
                            fontStyle={{ color: textColor, fontWeight: '600', fontSize: 13 }}
                            activeFontStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                            style={styles.segmentedControl}
                        />
                    </View>

                    {/* Amount Input */}
                    <View style={styles.amountContainer}>
                        <Text style={[styles.currencySymbol, { color: type === 'inflow' ? Colors.income : Colors.expense }]}>
                            {CURRENCIES.find(c => c.code === currency)?.symbol || '$'}
                        </Text>
                        <TextInput
                            style={[styles.amountInput, { color: type === 'inflow' ? Colors.income : Colors.expense }]}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            placeholderTextColor={placeholderColor}
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
                                    { backgroundColor: formBackgroundColor, borderColor: 'transparent' },
                                    selectedCategoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                                ]}
                                onPress={() => setSelectedCategoryId(cat.id)}
                            >
                                <View style={[styles.categoryIcon, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }, selectedCategoryId === cat.id && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                                    <IconSymbol name="pie-chart" size={16} color={selectedCategoryId === cat.id ? '#fff' : cat.color} />
                                </View>
                                <Text style={[styles.categoryText, { color: formTextColor }, selectedCategoryId === cat.id && { color: '#fff' }]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.categoryChip, styles.addCategoryChip, { borderColor: placeholderColor }]}
                            onPress={() => router.push('/add-category')}
                        >
                            <IconSymbol name="plus" size={16} color={placeholderColor} />
                            <Text style={[styles.categoryText, { color: placeholderColor }]}>Add</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <Text style={styles.label}>Date</Text>
                    <View style={[styles.formRow, { backgroundColor: formBackgroundColor, justifyContent: 'space-between', paddingVertical: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <IconSymbol name="calendar-today" size={20} color={Colors[theme].gray} />
                            <Text style={[styles.formLabel, { color: formTextColor }]}>Transaction Date</Text>
                        </View>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="compact"
                            onChange={(event, selectedDate) => {
                                if (selectedDate) setDate(selectedDate);
                            }}
                            accentColor={Colors.light.tint}
                            style={{ width: 120 }}
                            themeVariant={theme}
                        />
                    </View>

                    {/* Description */}
                    <Text style={styles.label}>Description</Text>
                    <View style={[styles.formRow, { backgroundColor: formBackgroundColor }]}>
                        <IconSymbol name="edit" size={20} color={Colors[theme].gray} />
                        <TextInput
                            style={[styles.input, { color: formTextColor }]}
                            placeholder="What is this for?"
                            placeholderTextColor={placeholderColor}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Recurring */}
                    <View style={[styles.formRow, { backgroundColor: formBackgroundColor, justifyContent: 'space-between', marginTop: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <IconSymbol name="more-horiz" size={20} color={Colors[theme].gray} />
                            <Text style={[styles.formLabel, { color: formTextColor }]}>Recurring Payment</Text>
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
                                <SegmentedControl
                                    values={['Weekly', 'Monthly', 'Yearly']}
                                    selectedIndex={['weekly', 'monthly', 'yearly'].indexOf(frequency)}
                                    onChange={(event) => {
                                        const index = event.nativeEvent.selectedSegmentIndex;
                                        setFrequency((['weekly', 'monthly', 'yearly'] as const)[index]);
                                    }}
                                    appearance={theme === 'dark' ? 'dark' : 'light'}
                                    fontStyle={{ color: textColor, fontWeight: '600', fontSize: 13 }}
                                    activeFontStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                                    style={styles.segmentedControl}
                                />
                            </View>
                        </View>
                    )}

                    {/* Notify Me - Reminder */}
                    <View style={[styles.formRow, { backgroundColor: formBackgroundColor, justifyContent: 'space-between', marginTop: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <IconSymbol name="notifications" size={20} color={Colors[theme].gray} />
                            <Text style={[styles.formLabel, { color: formTextColor }]}>Notify Me</Text>
                        </View>

                        <Menu
                            visible={reminderMenuVisible}
                            onDismiss={() => setReminderMenuVisible(false)}
                            anchor={
                                <TouchableOpacity onPress={() => setReminderMenuVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: formTextColor, fontSize: 16, marginRight: 8 }}>{reminder}</Text>
                                    <IconSymbol name="chevron-right" size={20} color={Colors[theme].gray} />
                                </TouchableOpacity>
                            }
                            contentStyle={{ backgroundColor: formBackgroundColor, borderRadius: 12, borderWidth: 1, borderColor: theme === 'dark' ? '#333' : '#ddd' }}
                        >
                            <Menu.Item
                                onPress={() => { setReminder('None'); setReminderMenuVisible(false); }}
                                title="None"
                                titleStyle={{ color: formTextColor }}
                            />
                            <Divider style={{ backgroundColor: theme === 'dark' ? '#333' : '#ddd' }} />
                            <Menu.Item
                                onPress={() => { setReminder('1 Day Before'); setReminderMenuVisible(false); }}
                                title="1 Day Before"
                                titleStyle={{ color: formTextColor }}
                            />
                            <Divider style={{ backgroundColor: theme === 'dark' ? '#333' : '#ddd' }} />
                            <Menu.Item
                                onPress={() => { setReminder('3 Days Before'); setReminderMenuVisible(false); }}
                                title="3 Days Before"
                                titleStyle={{ color: formTextColor }}
                            />
                            <Divider style={{ backgroundColor: theme === 'dark' ? '#333' : '#ddd' }} />
                            <Menu.Item
                                onPress={() => { setReminder('7 Days Before'); setReminderMenuVisible(false); }}
                                title="7 Days Before"
                                titleStyle={{ color: formTextColor }}
                            />
                        </Menu>
                    </View>

                    {/* Attachment */}
                    <Text style={styles.label}>Attachment</Text>
                    <TouchableOpacity style={[styles.uploadBox, { backgroundColor: formBackgroundColor, borderColor: placeholderColor }]} onPress={pickImage}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} />
                        ) : (
                            <>
                                <IconSymbol name="camera-alt" size={24} color={placeholderColor} />
                                <Text style={[styles.uploadText, { color: placeholderColor }]}>Attach Receipt</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>
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
