import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFinanceStore } from '@/store/financeStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
// @ts-ignore
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import Animated, {
    useAnimatedScrollHandler,
    useSharedValue
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// --- Helper Data ---

import { DATE_FORMATS, NUMBER_FORMATS } from '@/constants/Preferences';
import { useCurrencyFormatter, useDateFormatter } from '@/utils/format';

import { updateUserPreferences } from '@/services/db';
import cc from 'currency-codes';
// @ts-ignore
import { getAllISOCodes } from 'iso-country-currency';

const getSmartSymbol = (code: string) => {
    const overrides: Record<string, string> = {
        'CNY': '¥', 'JPY': '¥', 'USD': '$', 'GBP': '£', 'EUR': '€',
        'KRW': '₩', 'INR': '₹', 'RUB': '₽', 'TRY': '₺', 'ILS': '₪',
        'VND': '₫', 'THB': '฿', 'NGN': '₦', 'PHP': '₱', 'IDR': 'Rp',
        'TWD': 'NT$', 'LBP': 'L.L',
    };
    if (overrides[code]) return overrides[code];

    // Fallback to iso-country-currency lookup
    try {
        const isoCodes = getAllISOCodes();
        const found = isoCodes.find((c: any) => c.currency === code);
        return found?.symbol || code;
    } catch (e) {
        return code;
    }
};

WebBrowser.maybeCompleteAuthSession();

export default function OnboardingScreen() {
    const router = useRouter();
    const {
        completeOnboarding,
        setCurrency, setDateFormat, setNumberFormat,
        currency, dateFormat, numberFormat,
        user,
        googleLogin, appleLogin, login, signup
    } = useFinanceStore();
    const colorScheme = useColorScheme();
    const theme = 'dark'; // Force dark theme for onboarding based on images

    // Auth State
    const [loading, setLoading] = useState<string | null>(null);
    const [emailModalVisible, setEmailModalVisible] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: '964143418139-hkcngqfdi3maik3dg703taqlrk2uc8vd.apps.googleusercontent.com',
        webClientId: '964143418139-98dilfqi1vimsdqul8q01abgauaja441.apps.googleusercontent.com',
        redirectUri: AuthSession.makeRedirectUri({
            native: 'https://auth.expo.io/@anonymous/finance-manager',
        }),
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleSuccess(id_token);
        }
    }, [response]);

    // Navigate to preferences if user is already logged in (but needs onboarding)
    useEffect(() => {
        if (user) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: 2, animated: true });
            }, 500);
        }
    }, [user]);

    // Auto-detect Currency from IP
    useEffect(() => {
        const detectCurrency = async () => {
            try {
                const response = await fetch('https://ipapi.co/currency/');
                const detected = await response.text();
                // Ensure valid 3-letter code
                if (detected && /^[A-Z]{3}$/.test(detected)) {
                    console.log('Detected currency from IP:', detected);
                    // Update store (will be saved to preferences on "Continue")
                    setCurrency(detected);
                }
            } catch (e) {
                console.log('Failed to detect currency:', e);
            }
        };
        detectCurrency();
    }, []);

    const formatCurrency = useCurrencyFormatter();
    const formatDate = useDateFormatter();

    const x = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Modal States
    const [dateFormatModalVisible, setDateFormatModalVisible] = useState(false);
    const [numberFormatModalVisible, setNumberFormatModalVisible] = useState(false);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            x.value = event.contentOffset.x;
        },
    });

    const onViewableItemsChanged = React.useCallback(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems[0] && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }, []);

    const handleGoogleAuth = async () => {
        if (!request) return;
        setLoading('google');
        try {
            await promptAsync();
        } catch (err: any) {
            Alert.alert('Auth Error', err.message);
            setLoading(null);
        }
    };

    const handleGoogleSuccess = async (idToken: string) => {
        setLoading('google');
        try {
            await googleLogin(idToken);
            handleNext(); // Move to next slide
        } catch (err: any) {
            Alert.alert('Google Auth Failed', err.message);
        } finally {
            setLoading(null);
        }
    };

    const handleAppleAuth = async () => {
        setLoading('apple');
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            await appleLogin({
                identityToken: credential.identityToken,
                userIdentifier: credential.user,
                fullName: credential.fullName,
                email: credential.email
            });
            handleNext();
        } catch (e: any) {
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                Alert.alert('Apple Auth Failed', e.message);
            }
        } finally {
            setLoading(null);
        }
    };

    const handleEmailAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (authMode === 'signup' && !name) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setLoading('email');
        try {
            if (authMode === 'signup') {
                await signup({ name, email, password });
            } else {
                await login({ email, password });
            }
            setEmailModalVisible(false);
            // Move to Preferences slide (Index 2)
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: 2, animated: true });
            }, 500);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Authentication failed');
        } finally {
            setLoading(null);
        }
    };


    const handleNext = () => {
        if (currentIndex < 2) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        if (user) {
            try {
                await updateUserPreferences(user.id, {
                    currency,
                    dateFormat,
                    numberFormat
                });
                console.log('Preferences saved to DB via Onboarding');
            } catch (error) {
                console.error('Failed to save preferences during onboarding:', error);
            }
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        completeOnboarding();
        router.replace('/(tabs)');
    };

    // --- Slides ---

    const renderWelcomeSlide = () => (
        <View style={[styles.slide, { width }]}>
            <View style={styles.welcomeContent}>
                <Text style={styles.brandTitle}>Finance</Text>
                <Text style={styles.brandSubtitle}>makes it simple.</Text>
            </View>
            <TouchableOpacity style={styles.mainButton} onPress={handleNext}>
                <Text style={styles.mainButtonText}>Get Started</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAuthSlide = () => (
        <View style={[styles.slide, { width }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', flex: 1, justifyContent: 'center' }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                    <View style={styles.authHeader}>
                        <View style={styles.iconContainer}>
                            <IconSymbol name="wallet" size={40} color="#000" />
                        </View>
                        <Text style={styles.authTitle}>Finance</Text>
                        <Text style={styles.authSubtitle}>{authMode === 'signup' ? 'Create an account to start tracking.' : 'Welcome back!'}</Text>
                    </View>

                    <View style={styles.formContainer}>
                        {authMode === 'signup' && (
                            <View style={styles.inputWrapper}>
                                <IconSymbol name="person" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor="#666"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        )}

                        <View style={styles.inputWrapper}>
                            <IconSymbol name="envelope" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor="#666"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <IconSymbol name="lock.fill" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#666"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity style={styles.authButton} onPress={handleEmailAuth} disabled={!!loading}>
                            {loading === 'email' ? <ActivityIndicator color="#fff" /> : (
                                <Text style={styles.authButtonText}>{authMode === 'signup' ? 'Sign Up' : 'Log In'}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => {
                            setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                            Haptics.selectionAsync();
                        }} style={{ padding: 10 }}>
                            <Text style={styles.switchAuthText}>
                                {authMode === 'signup' ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>or continue with</Text>
                        <View style={styles.divider} />
                    </View>

                    <View style={styles.socialRow}>
                        {Platform.OS === 'ios' && (
                            <TouchableOpacity style={styles.socialIconBtn} onPress={handleAppleAuth} disabled={!!loading}>
                                {loading === 'apple' ? <ActivityIndicator size="small" color="#fff" /> :
                                    <FontAwesome name="apple" size={24} color="#fff" />
                                }
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: '#fff' }]} onPress={handleGoogleAuth} disabled={!!loading}>
                            {loading === 'google' ? <ActivityIndicator size="small" color="#000" /> :
                                <FontAwesome name="google" size={24} color="#000" />
                            }
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );

    const renderPreferencesSlide = () => (
        <View style={[styles.slide, { width, justifyContent: 'flex-start', paddingTop: 60 }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => flatListRef.current?.scrollToIndex({ index: 1 })}>
                <IconSymbol name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.prefTitle}>Choose your preferences</Text>
            <Text style={styles.prefSubtitle}>Customize how numbers and dates appear</Text>

            <View style={styles.settingsGroup}>
                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/currency-picker')}>
                    <View style={styles.settingLeft}>
                        <IconSymbol name="globe" size={24} color="#fff" />
                        <Text style={styles.settingLabel}>Currency</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={styles.settingValue}>
                            {cc.code(currency)?.currency || currency} ({getSmartSymbol(currency)})
                        </Text>
                        <IconSymbol name="chevron-right" size={20} color="#666" />
                    </View>
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity style={styles.settingItem} onPress={() => setDateFormatModalVisible(true)}>
                    <View style={styles.settingLeft}>
                        <IconSymbol name="calendar" size={24} color="#fff" />
                        <Text style={styles.settingLabel}>Date Format</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={styles.settingValue}>{dateFormat}</Text>
                        <IconSymbol name="swap-vertical" size={16} color="#666" />
                    </View>
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity style={styles.settingItem} onPress={() => setNumberFormatModalVisible(true)}>
                    <View style={styles.settingLeft}>
                        <Text style={[styles.settingLabel, { fontSize: 20, fontWeight: 'bold', width: 24, textAlign: 'center' }]}>#</Text>
                        <Text style={styles.settingLabel}>Number Format</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={styles.settingValue}>{numberFormat}</Text>
                        <IconSymbol name="swap-vertical" size={16} color="#666" />
                    </View>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>Example Transactions</Text>

            <View style={styles.exampleCard}>
                <View style={styles.exampleRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#FFD70020' }]}>
                        <Text style={{ fontSize: 20 }}>💰</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.exampleTitle}>Monthly Salary</Text>
                        <Text style={styles.exampleDate}>{formatDate(new Date(2026, 1, 1))}</Text>
                    </View>
                    <Text style={[styles.exampleAmount, { color: '#4CAF50' }]}>
                        {formatCurrency(4500)}
                    </Text>
                </View>
                <View style={[styles.separator, { marginLeft: 56 }]} />
                <View style={styles.exampleRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#80808030' }]}>
                        <IconSymbol name="cart" size={20} color="#aaa" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.exampleTitle}>Weekly Groceries</Text>
                        <Text style={styles.exampleDate}>{formatDate(new Date(2026, 0, 31))}</Text>
                    </View>
                    <Text style={styles.exampleAmount}>
                        {formatCurrency(125.50)}
                    </Text>
                </View>
            </View>
            <Text style={styles.footerNote}>These examples update to show how your chosen formats will appear</Text>

            <TouchableOpacity style={styles.continueButton} onPress={handleComplete}>
                <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
        </View>
    );


    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#000000']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.container}>
                <Animated.FlatList
                    ref={flatListRef as any}
                    data={[1, 2, 3]} // 3 slides
                    renderItem={({ index }) => {
                        if (index === 0) return renderWelcomeSlide();
                        if (index === 1) return renderAuthSlide();
                        return renderPreferencesSlide();
                    }}
                    horizontal
                    pagingEnabled
                    scrollEnabled={false} // Disable manual swipe to force flow
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.toString()}
                />

                {/* Email Auth Modal */}
                <Modal visible={emailModalVisible} animationType="slide" presentationStyle="pageSheet">
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{authMode === 'signup' ? 'Sign Up' : 'Log In'}</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setEmailModalVisible(false)}>
                                <IconSymbol name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ padding: 20, gap: 16 }}>
                            {authMode === 'signup' && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor="#666"
                                    value={name} onChangeText={setName}
                                />
                            )}
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#666"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email} onChangeText={setEmail}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#666"
                                secureTextEntry
                                value={password} onChangeText={setPassword}
                            />

                            <TouchableOpacity style={[styles.mainButton, { position: 'relative', width: '100%', marginTop: 10 }]} onPress={handleEmailAuth} disabled={!!loading}>
                                <Text style={styles.mainButtonText}>
                                    {loading ? 'Processing...' : (authMode === 'signup' ? 'Create Account' : 'Log In')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}>
                                <Text style={{ color: '#fff', textAlign: 'center', marginTop: 10 }}>
                                    {authMode === 'signup' ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>


                {/* Number Format Modal (Bottom Sheet style using transparent modal) */}
                <Modal visible={numberFormatModalVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.dimOverlay} activeOpacity={1} onPress={() => setNumberFormatModalVisible(false)}>
                        <View style={styles.popupMenu}>
                            <Text style={styles.popupTitle}>Number Format</Text>
                            {NUMBER_FORMATS.map((fmt) => (
                                <TouchableOpacity
                                    key={fmt.label}
                                    style={styles.popupItem}
                                    onPress={() => {
                                        setNumberFormat(fmt.label);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    {numberFormat === fmt.label && <IconSymbol name="check" size={16} color="#fff" style={{ marginRight: 8 }} />}
                                    <Text style={[styles.popupItemText, numberFormat === fmt.label && { fontWeight: 'bold' }]}>
                                        {fmt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Date Format Modal */}
                <Modal visible={dateFormatModalVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.dimOverlay} activeOpacity={1} onPress={() => setDateFormatModalVisible(false)}>
                        <View style={styles.popupMenu}>
                            <Text style={styles.popupTitle}>Date Format</Text>
                            {DATE_FORMATS.map((fmt) => (
                                <TouchableOpacity
                                    key={fmt.label}
                                    style={styles.popupItem}
                                    onPress={() => {
                                        setDateFormat(fmt.value);
                                        setDateFormatModalVisible(false);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    {dateFormat === fmt.value && <IconSymbol name="check" size={16} color="#fff" style={{ marginRight: 8 }} />}
                                    <Text style={[styles.popupItemText, dateFormat === fmt.value && { fontWeight: 'bold' }]}>
                                        {fmt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    slide: { width: width, height: '100%', alignItems: 'center', paddingHorizontal: 20, justifyContent: 'center' },
    welcomeContent: { alignItems: 'center', marginBottom: 100 },
    brandTitle: { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    brandSubtitle: { fontSize: 48, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: -1, marginTop: -5 },
    mainButton: { position: 'absolute', bottom: 60, backgroundColor: '#fff', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30, width: '90%', alignItems: 'center' },
    mainButtonText: { color: '#000', fontSize: 18, fontWeight: '700' },

    // Auth Styles
    authTitle: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -1 },
    authSubtitle: { fontSize: 16, color: '#aaa', textAlign: 'center', marginTop: 8 },

    authHeader: { alignItems: 'center', marginBottom: 30, width: '100%' },
    iconContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    formContainer: { width: '100%', paddingHorizontal: 24, gap: 16 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e', borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#333' },
    inputIcon: { marginRight: 12 },

    authButton: { backgroundColor: '#0A84FF', height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    authButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    switchAuthText: { color: '#888', textAlign: 'center', fontSize: 14 },

    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30, width: '100%', paddingHorizontal: 24 },
    divider: { flex: 1, height: 1, backgroundColor: '#333' },
    dividerText: { color: '#666', paddingHorizontal: 16, fontSize: 14 },

    socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
    socialIconBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },

    socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 16, borderRadius: 30, gap: 10 },
    socialBtnText: { fontSize: 17, fontWeight: '600' },
    emailLink: { marginTop: 16 },
    emailLinkText: { color: '#888', fontSize: 16, textDecorationLine: 'underline' },
    input: { flex: 1, color: '#fff', fontSize: 16 },

    // Page 3
    backButton: { position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
    prefTitle: { fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center', marginTop: 40, marginBottom: 8 },
    prefSubtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 40 },
    settingsGroup: { width: '100%', backgroundColor: '#1c1c1e', borderRadius: 16, overflow: 'hidden' },
    settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    settingLabel: { color: '#fff', fontSize: 16, fontWeight: '500' },
    settingValue: { color: '#888', fontSize: 16 },
    separator: { height: 1, backgroundColor: '#333', marginLeft: 52 },
    sectionHeader: { alignSelf: 'flex-start', color: '#888', fontSize: 15, fontWeight: '600', marginTop: 30, marginBottom: 10, marginLeft: 4 },
    exampleCard: { width: '100%', backgroundColor: '#1c1c1e', borderRadius: 20, padding: 1, overflow: 'hidden' },
    exampleRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    exampleTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
    exampleDate: { color: '#666', fontSize: 13, marginTop: 2 },
    exampleAmount: { color: '#fff', fontSize: 16, fontWeight: '600' },
    footerNote: {
        color: '#666',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 20,
    },
    continueButton: { marginTop: 'auto', marginBottom: 20, backgroundColor: '#fff', paddingVertical: 18, width: '100%', borderRadius: 30, alignItems: 'center' },
    continueButtonText: { color: '#000', fontSize: 18, fontWeight: '700' },

    // Modals
    modalContainer: { flex: 1, backgroundColor: '#000' },

    // Auth Modal Styles
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
    modalTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
    closeButton: { position: 'absolute', right: 16, padding: 8, backgroundColor: '#333', borderRadius: 20 },

    // Liquid Glass Search Styles
    searchBarWrapper: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    searchInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 55,
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        marginLeft: 10,
        fontSize: 17,
        height: '100%'
    },

    // List Styles
    currencyRow: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
        borderBottomWidth: 0.3,
        borderBottomColor: '#2C2C2E'
    },
    flag: { fontSize: 30, marginRight: 15 },
    currencyCode: { color: '#FFF', fontSize: 18, fontWeight: '600' },
    countryName: { color: '#8E8E93', fontSize: 14 },

    // Legacy styles that might still be used by Number/Date modals?
    // They used popupMenu. Keeping them.
    dimOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    popupMenu: { backgroundColor: '#2c2c2e', width: 250, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 8 },
    popupTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
    popupItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    popupItemText: { color: '#fff', fontSize: 16 },
});
