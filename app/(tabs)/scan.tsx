import { LiquidGlassButton } from '@/components/LiquidGlassComponents';
import { extractReceiptData } from '@/services/ocrService';
import { useFinanceStore } from '@/store/financeStore';
import { Transaction } from '@/types';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ScanScreen() {
    const router = useRouter();
    const { addTransaction } = useFinanceStore();
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Form state
    const [amount, setAmount] = useState('');
    const [merchant, setMerchant] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('Food & Dining');
    const [description, setDescription] = useState('');

    const cameraRef = useRef<CameraView>(null);

    // Only activate camera when this tab is focused
    useFocusEffect(
        useCallback(() => {
            setIsFocused(true);
            return () => setIsFocused(false);
        }, [])
    );

    const handleTakePicture = async () => {
        if (!cameraRef.current) return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsProcessing(true);
            const photo = await cameraRef.current.takePictureAsync();
            if (photo?.uri) {
                await processReceipt(photo.uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to take picture');
            setIsProcessing(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 1,
            });
            if (!result.canceled && result.assets[0]) {
                setIsProcessing(true);
                await processReceipt(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const processReceipt = async (imageUri: string) => {
        try {
            const data = await extractReceiptData(imageUri);
            setAmount(data.totalAmount.toString());
            setMerchant(data.merchantName);
            setDate(data.date);
            setDescription(`Receipt from ${data.merchantName}`);
            setShowForm(true);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('Error', 'Failed to process. Enter details manually.');
            setShowForm(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveTransaction = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Invalid Amount', 'Enter a valid amount');
            return;
        }
        if (!description) {
            Alert.alert('Missing Description', 'Enter a description');
            return;
        }

        const transaction: Transaction = {
            id: Date.now().toString(),
            type: 'outflow', // Default to expense for receipts
            amount: parseFloat(amount),
            category: category,
            description: description,
            date: new Date(date).getTime(),
            tags: [],
            isRecurring: false,
            receiptImage: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        addTransaction(transaction);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Reset and go home
        setAmount('');
        setMerchant('');
        setDescription('');
        setCategory('Food & Dining');
        setShowForm(false);
        router.push('/(tabs)/transactions');
    };

    if (!permission || !permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#000000', '#1c1c1e']} style={StyleSheet.absoluteFill} />
                <Text style={styles.permTitle}>Camera Access Needed</Text>
                <Text style={styles.permText}>We need your camera to scan receipts.</Text>
                <LiquidGlassButton title="Grant Permission" onPress={requestPermission} />
            </View>
        );
    }

    if (showForm) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}
            >
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#1c1c1e', '#000000']} style={StyleSheet.absoluteFill} />

                <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>Add Expense</Text>
                    <TouchableOpacity onPress={() => setShowForm(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput
                        style={styles.largeInput}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        placeholder="$0.00"
                        placeholderTextColor="#555"
                        autoFocus
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={styles.input}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What is this for?"
                        placeholderTextColor="#555"
                    />
                </View>

                <View style={styles.categoryRow}>
                    {['Food', 'Shop', 'Transit', 'Bills'].map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.catChip,
                                category.includes(cat === 'Food' ? 'Food' : cat === 'Shop' ? 'Shopping' : cat === 'Transit' ? 'Transport' : cat) && styles.catChipActive
                            ]}
                            onPress={() => setCategory(cat === 'Food' ? 'Food & Dining' : cat === 'Shop' ? 'Shopping' : cat === 'Transit' ? 'Transport' : cat)}
                        >
                            <Text style={[styles.catText, category.includes(cat === 'Food' ? 'Food' : cat === 'Shop' ? 'Shopping' : cat === 'Transit' ? 'Transport' : cat) && styles.catTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ flex: 1 }} />
                <LiquidGlassButton title="Save Transaction" onPress={handleSaveTransaction} />
                <View style={{ height: 40 }} />
            </KeyboardAvoidingView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Only show camera when tab is focused */}
            {isFocused ? (
                <CameraView style={StyleSheet.absoluteFill} ref={cameraRef}>
                    <View style={styles.overlay}>
                        {/* Top Bar */}
                        <View style={styles.topBar}>
                            <BlurView intensity={30} tint="dark" style={styles.pill}>
                                <Text style={styles.pillText}>Receipt Scanner</Text>
                            </BlurView>
                        </View>

                        {/* Scanner Frame */}
                        <View style={styles.scannerFrame}>
                            <View style={[styles.corner, styles.tl]} />
                            <View style={[styles.corner, styles.tr]} />
                            <View style={[styles.corner, styles.bl]} />
                            <View style={[styles.corner, styles.br]} />
                            {isProcessing && <ActivityIndicator size="large" color="#fff" />}
                        </View>

                        {/* Bottom Controls */}
                        <View style={styles.bottomControls}>
                            <TouchableOpacity onPress={handlePickImage} style={styles.iconBtn}>
                                <BlurView intensity={40} tint="dark" style={styles.iconGlass}>
                                    <Text style={styles.iconEmoji}>🖼️</Text>
                                </BlurView>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleTakePicture} disabled={isProcessing} activeOpacity={0.7}>
                                <View style={styles.shutterOuter}>
                                    <View style={styles.shutterInner} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setShowForm(true)} style={styles.iconBtn}>
                                <BlurView intensity={40} tint="dark" style={styles.iconGlass}>
                                    <Text style={styles.iconEmoji}>✏️</Text>
                                </BlurView>
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            ) : (
                <LinearGradient colors={['#1c1c1e', '#000000']} style={StyleSheet.absoluteFill} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    permTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    permText: { color: '#aaa', marginBottom: 30 },

    // Camera Overlay
    overlay: { flex: 1, justifyContent: 'space-between', padding: 20, paddingBottom: 50 },
    topBar: { paddingTop: 60, alignItems: 'center' },
    pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },
    pillText: { color: '#fff', fontWeight: '600' },

    // Scanner Frame
    scannerFrame: {
        width: '100%',
        aspectRatio: 0.7,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    corner: { width: 40, height: 40, borderColor: '#fff', position: 'absolute', borderWidth: 4 },
    tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
    tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
    bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
    br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },

    // Bottom Controls
    bottomControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    shutterOuter: {
        width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff',
        alignItems: 'center', justifyContent: 'center'
    },
    shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
    iconBtn: { width: 50, height: 50 },
    iconGlass: { flex: 1, borderRadius: 25, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    iconEmoji: { fontSize: 20 },

    // Form
    formContainer: { flex: 1, padding: 20 },
    formHeader: { marginTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
    formTitle: { fontSize: 30, fontWeight: '800', color: '#fff' },
    cancelText: { color: '#8E8E93', fontSize: 17 },
    inputGroup: { marginBottom: 30 },
    label: { color: '#8E8E93', textTransform: 'uppercase', fontSize: 12, marginBottom: 10, letterSpacing: 1 },
    largeInput: { fontSize: 50, fontWeight: 'bold', color: '#fff' },
    input: { fontSize: 20, color: '#fff', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10 },

    categoryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#333' },
    catChipActive: { backgroundColor: '#007AFF' },
    catText: { color: '#aaa', fontWeight: '600' },
    catTextActive: { color: '#fff' },
});
