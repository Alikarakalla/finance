import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import { TransactionType } from '@/types';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    XCircle
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import EmojiSelector from 'react-native-emoji-selector';
import ColorPicker, { HueSlider, OpacitySlider, Panel1, Preview, Swatches } from 'reanimated-color-picker';

const PRESET_COLORS = [
    '#4CAF50', '#8BC34A', '#F44336', '#FF9800', '#E91E63',
    '#9C27B0', '#673AB7', '#00BCD4', '#2196F3', '#3F51B5'
];

export default function AddCategoryModal() {
    const router = useRouter();
    const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
    const { addCategory, updateCategory, categories, transactions, selectedDate } = useFinanceStore();
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';

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

    const [name, setName] = useState('');
    const [type, setType] = useState<TransactionType>('outflow');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState('💰'); // Default emoji
    const [isSaving, setIsSaving] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const isEditing = !!categoryId;

    useEffect(() => {
        if (categoryId) {
            const cat = categories.find(c => c.id === categoryId);
            if (cat) {
                setName(cat.name);
                setType(cat.type);
                setSelectedColor(cat.color);
                const isLegacy = cat.icon.length > 4 && /^[a-zA-Z]+$/.test(cat.icon);
                setSelectedIcon(isLegacy ? '📁' : cat.icon);
            }
        }
    }, [categoryId, categories]);

    const onColorSelect = ({ hex }: { hex: string }) => {
        setSelectedColor(hex);
    };

    const handleEmojiSelect = (emoji: string) => {
        setSelectedIcon(emoji);
        setShowEmojiPicker(false);
    };



    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        setIsSaving(true);
        try {
            if (isEditing) {
                await updateCategory(categoryId!, {
                    name: name.trim(),
                    type,
                    icon: selectedIcon,
                    color: selectedColor,
                });
            } else {
                const newCategory = {
                    id: Date.now().toString(),
                    name: name.trim(),
                    type,
                    icon: selectedIcon,
                    color: selectedColor,
                    budget: null,
                    isDefault: false
                };
                await addCategory(newCategory);
            }
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message || (isEditing ? 'Failed to update category' : 'Failed to create category'));
        } finally {
            setIsSaving(false);
        }
    };

    const backgroundColor = theme === 'dark' ? '#000000' : '#ffffff';
    const textColor = theme === 'dark' ? '#ffffff' : '#000000';
    const placeholderColor = theme === 'dark' ? Colors.dark.gray : Colors.light.gray;
    const inputBorderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const emojiSelectorBg = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: isEditing ? 'Edit Category' : 'New Category',
                    headerTintColor: textColor,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <IconSymbol
                                name="chevron-left"
                                color={textColor}
                                size={24}
                            />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving}
                            style={{ padding: 8 }}
                        >
                            {isSaving ? (
                                <ActivityIndicator color={Colors.light.tint} />
                            ) : (
                                <Text style={{ color: Colors.light.tint, fontSize: 17, fontWeight: '600' }}>Save</Text>
                            )}
                        </TouchableOpacity>
                    ),
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.segmentContainer}>
                        <SegmentedControl
                            values={['Expense', 'Income']}
                            selectedIndex={type === 'inflow' ? 1 : 0}
                            onChange={(event) => {
                                const index = event.nativeEvent.selectedSegmentIndex;
                                setType(index === 1 ? 'inflow' : 'outflow');
                            }}
                            appearance={theme === 'dark' ? 'dark' : 'light'}
                            fontStyle={{ color: textColor, fontWeight: '600', fontSize: 13 }}
                            activeFontStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                            style={styles.segmentedControl}
                        />
                    </View>

                    <Text style={[styles.label, { color: Colors[theme].gray }]}>Category Name</Text>
                    <TextInput
                        style={[styles.input, { color: textColor, borderBottomColor: inputBorderColor }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Subscriptions"
                        placeholderTextColor={placeholderColor}
                    />

                    <View style={styles.sectionHeader}>
                        <Text style={[styles.label, { color: Colors[theme].gray }]}>Color</Text>
                        <TouchableOpacity onPress={() => setShowColorPicker(true)}>
                            <Text style={{ color: Colors.dashboard.cyan, fontWeight: '600' }}>Custom</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
                        {PRESET_COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: color },
                                    selectedColor === color && styles.selectedCircle
                                ]}
                                onPress={() => setSelectedColor(color)}
                            />
                        ))}
                    </ScrollView>

                    <Text style={[styles.label, { color: Colors[theme].gray, marginTop: 24 }]}>Icon</Text>
                    <TouchableOpacity
                        style={[styles.emojiSelector, { backgroundColor: emojiSelectorBg, borderColor: inputBorderColor }]}
                        onPress={() => setShowEmojiPicker(true)}
                    >
                        <View style={[styles.previewIconBoxMini, { backgroundColor: selectedColor + '20' }]}>
                            <Text style={{ fontSize: 24 }}>{selectedIcon}</Text>
                        </View>
                        <Text style={[styles.emojiSelectorText, { color: textColor }]}>Choose Emoji</Text>
                        <XCircle size={20} color={placeholderColor} style={{ transform: [{ rotate: '45deg' }] }} />
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Custom Color Picker Modal */}
            <Modal visible={showColorPicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1c1c1e' : '#fff' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Choose Color</Text>
                            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                                <Text style={{ color: Colors.dashboard.cyan, fontWeight: '700', fontSize: 16 }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <ColorPicker
                            value={selectedColor}
                            onComplete={onColorSelect}
                            style={{ width: '100%', gap: 20 }}
                        >
                            <Preview />
                            <Panel1 />
                            <HueSlider />
                            <OpacitySlider />
                            <Swatches colors={PRESET_COLORS} />
                        </ColorPicker>
                    </View>
                </View>
            </Modal>

            {/* Custom Emoji Picker Modal */}
            <Modal visible={showEmojiPicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1c1c1e' : '#fff', height: 500 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Choose Emoji</Text>
                            <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                                <Text style={{ color: Colors.dashboard.cyan, fontWeight: '700', fontSize: 16 }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            {/* @ts-ignore */}
                            <EmojiSelector
                                onEmojiSelected={handleEmojiSelect}
                                showSearchBar={true}
                                showTabs={true}
                                showHistory={false}
                                showSectionTitles={false}
                                columns={8}
                                theme={theme === 'dark' ? '#766dfc' : '#007AFF'}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 110, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '800' },
    card: { padding: 24, marginBottom: 24 },
    categoryPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 20, marginBottom: 10 },
    previewIconBox: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    previewInfo: { marginLeft: 16 },
    previewName: { fontSize: 20, fontWeight: '700' },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
    input: { fontSize: 18, fontWeight: '600', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    segmentContainer: { marginBottom: 20, marginTop: 10 },
    segmentedControl: { height: 36 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
    colorRow: { gap: 14, paddingVertical: 10 },
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
    colorCircle: { width: 40, height: 40, borderRadius: 20 },
    selectedCircle: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.1 }] },
    emojiSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginTop: 8
    },
    emojiSelectorText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
        flex: 1
    },
    previewIconBoxMini: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    // iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    // iconItem: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'transparent' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, minHeight: 500 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    modalTitle: { fontSize: 20, fontWeight: '800' }
});
