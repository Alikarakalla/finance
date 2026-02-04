import { LiquidGlassCard as GlassCard } from '@/components/LiquidGlassComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { DATE_FORMATS, NUMBER_FORMATS } from '@/constants/Preferences';
import { useFinanceStore } from '@/store/financeStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
// @ts-ignore
import { getAllISOCodes } from 'iso-country-currency';
import { FlatList, Image, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';

export default function SettingsScreen() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const router = useRouter();
    const { user, logout, currency, setCurrency, dateFormat, setDateFormat, numberFormat, setNumberFormat, notificationsEnabled, toggleNotifications, pushNotification } = useFinanceStore();

    // Modal States
    const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
    const [dateFormatModalVisible, setDateFormatModalVisible] = useState(false);
    const [numberFormatModalVisible, setNumberFormatModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await logout();
    };

    // Filtered Currencies
    // Filtered Currencies
    const allCurrencies = useMemo(() => getAllISOCodes(), []);
    const filteredCurrencies = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return allCurrencies;
        return allCurrencies.filter((c: any) =>
            c.countryName.toLowerCase().includes(q) ||
            c.currency.toLowerCase().includes(q)
        );
    }, [searchQuery, allCurrencies]);

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <LinearGradient
                colors={theme === 'dark' ? ['#000', '#1c1c1e'] : ['#F8F9FA', '#E8F5E9']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
                <View style={styles.headerSpacer} />
                <Text style={[styles.title, { color: Colors[theme].text }]}>Settings</Text>

                {/* Profile / Auth Section */}
                <GlassCard style={styles.profileSection} variant={theme === 'dark' ? 'dark' : 'default'} intensity={theme === 'dark' ? 50 : 80}>
                    {user ? (
                        <View style={styles.profileRow}>
                            <View style={styles.avatarContainer}>
                                {user.profileImage ? (
                                    <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.dashboard.cyan + '20' }]}>
                                        <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={[styles.profileName, { color: Colors[theme].text }]}>{user.name}</Text>
                                <Text style={[styles.profileEmail, { color: Colors[theme].gray }]}>{user.email}</Text>
                            </View>
                            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                                <IconSymbol name="logout" size={20} color={Colors[theme].danger} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.loginPrompt} onPress={() => router.push('/auth')}>
                            <View style={styles.loginIconContainer}>
                                <IconSymbol name="person-add" size={32} color={Colors.dashboard.cyan} />
                            </View>
                            <View style={styles.loginContent}>
                                <Text style={[styles.loginTitle, { color: Colors[theme].text }]}>Sign in to Finance</Text>
                                <Text style={[styles.loginSubtitle, { color: Colors[theme].gray }]}>Sync data and unlock cloud features</Text>
                            </View>
                            <IconSymbol name="chevron-right" size={20} color={Colors[theme].gray} />
                        </TouchableOpacity>
                    )}
                </GlassCard>

                {/* Preferences Section */}
                <Text style={[styles.sectionTitle, { color: Colors[theme].gray }]}>Preferences</Text>
                <GlassCard style={styles.section} variant={theme === 'dark' ? 'dark' : 'default'} intensity={theme === 'dark' ? 40 : 70}>
                    <TouchableOpacity style={styles.row} onPress={() => setCurrencyModalVisible(true)}>
                        <View style={styles.rowLeft}>
                            <IconSymbol name="globe" size={20} color={Colors[theme].text} />
                            <Text style={[styles.label, { color: Colors[theme].text }]}>Currency</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: Colors[theme].gray }}>{currency}</Text>
                            <IconSymbol name="chevron-right" size={20} color={Colors[theme].gray} />
                        </View>
                    </TouchableOpacity>
                    <View style={[styles.separator, { backgroundColor: theme === 'dark' ? '#333' : '#eee' }]} />

                    <TouchableOpacity style={styles.row} onPress={() => setDateFormatModalVisible(true)}>
                        <View style={styles.rowLeft}>
                            <IconSymbol name="calendar" size={20} color={Colors[theme].text} />
                            <Text style={[styles.label, { color: Colors[theme].text }]}>Date Format</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: Colors[theme].gray }}>{dateFormat}</Text>
                            <IconSymbol name="chevron-right" size={20} color={Colors[theme].gray} />
                        </View>
                    </TouchableOpacity>
                    <View style={[styles.separator, { backgroundColor: theme === 'dark' ? '#333' : '#eee' }]} />

                    <TouchableOpacity style={styles.row} onPress={() => setNumberFormatModalVisible(true)}>
                        <View style={styles.rowLeft}>
                            <IconSymbol name="swap-vertical" size={20} color={Colors[theme].text} />
                            <Text style={[styles.label, { color: Colors[theme].text }]}>Number Format</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: Colors[theme].gray }}>{numberFormat}</Text>
                            <IconSymbol name="chevron-right" size={20} color={Colors[theme].gray} />
                        </View>
                    </TouchableOpacity>
                </GlassCard>

                {/* App Settings */}
                <Text style={[styles.sectionTitle, { color: Colors[theme].gray }]}>App</Text>
                <GlassCard style={styles.section} variant={theme === 'dark' ? 'dark' : 'default'} intensity={theme === 'dark' ? 40 : 70}>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <IconSymbol name="eye" size={20} color={Colors[theme].text} />
                            <Text style={[styles.label, { color: Colors[theme].text }]}>Dark Mode</Text>
                        </View>
                        <Switch value={theme === 'dark'} disabled={true} />
                    </View>
                    <View style={[styles.separator, { backgroundColor: theme === 'dark' ? '#333' : '#eee' }]} />
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <IconSymbol name="notifications" size={20} color={Colors[theme].text} />
                            <Text style={[styles.label, { color: Colors[theme].text }]}>Notifications</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={async () => {
                                await toggleNotifications();
                                Haptics.selectionAsync();
                            }}
                        />
                    </View>
                    <View style={[styles.separator, { backgroundColor: theme === 'dark' ? '#333' : '#eee' }]} />
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            pushNotification(
                                'Test Notification',
                                'This is a test notification from Finance app. It works! 🎉'
                            );
                        }}
                    >
                        <View style={styles.rowLeft}>
                            <IconSymbol name="bell.fill" size={20} color={Colors[theme].text} />
                            <Text style={[styles.label, { color: Colors[theme].text }]}>Send Test Notification</Text>
                        </View>
                        <IconSymbol name="chevron-right" size={20} color={Colors[theme].gray} />
                    </TouchableOpacity>
                </GlassCard>

                <GlassCard style={styles.section} variant={theme === 'dark' ? 'dark' : 'default'} intensity={theme === 'dark' ? 40 : 70}>
                    <TouchableOpacity style={styles.row} onPress={() => router.push('/category-management')}>
                        <View style={styles.rowLeft}>
                            <IconSymbol name="list" size={20} color={Colors[theme].text} />
                            <Text style={[styles.label, { color: Colors[theme].text }]}>Manage Categories</Text>
                        </View>
                        <IconSymbol name="chevron-right" size={20} color={Colors[theme].gray} />
                    </TouchableOpacity>
                </GlassCard>

                <GlassCard style={styles.section} variant={theme === 'dark' ? 'dark' : 'default'} intensity={theme === 'dark' ? 40 : 70}>
                    <TouchableOpacity style={styles.row}>
                        <Text style={[styles.label, { color: Colors[theme].danger }]}>Clear All Data</Text>
                        <IconSymbol name="chevron-right" size={20} color={Colors[theme].gray} />
                    </TouchableOpacity>
                </GlassCard>
            </View>

            {/* Currency Modal */}
            <Modal visible={currencyModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Select Currency</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setCurrencyModalVisible(false)}>
                            <IconSymbol name="close" size={20} color={theme === 'dark' ? '#fff' : '#000'} />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.searchContainer, { backgroundColor: theme === 'dark' ? '#1E2330' : '#f0f0f0' }]}>
                        <IconSymbol name="search" size={20} color="#666" />
                        <TextInput
                            style={[styles.searchInput, { color: theme === 'dark' ? '#fff' : '#000' }]}
                            placeholder="Search currency or country"
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <FlatList
                        data={filteredCurrencies}
                        keyExtractor={(item: any) => item.iso + item.currency}
                        renderItem={({ item }: { item: any }) => (
                            <TouchableOpacity
                                style={[styles.currencyItem, { borderBottomColor: theme === 'dark' ? '#333' : '#eee' }]}
                                onPress={async () => {
                                    try {
                                        await setCurrency(item.currency);
                                        setCurrencyModalVisible(false);
                                        Haptics.selectionAsync();
                                    } catch (err: any) {
                                        Alert.alert("Use Different Currency", "Automatic conversion is not available for this currency. Please select another.");
                                    }
                                }}
                            >
                                <Text style={styles.currencyFlag}>{item.flag}</Text>
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={[styles.currencyCode, { color: theme === 'dark' ? '#fff' : '#000', fontWeight: 'bold', fontSize: 16 }]}>{item.currency}</Text>
                                    <Text style={[styles.currencyName, { color: theme === 'dark' ? '#ccc' : '#666', fontSize: 14 }]}>{item.countryName}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    />
                </View>
            </Modal>

            {/* Number Format Modal */}
            <Modal visible={numberFormatModalVisible} transparent animationType="fade">
                <TouchableOpacity style={styles.dimOverlay} activeOpacity={1} onPress={() => setNumberFormatModalVisible(false)}>
                    <View style={[styles.popupMenu, { backgroundColor: theme === 'dark' ? '#1E2330' : '#fff' }]}>
                        <Text style={[styles.popupTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Number Format</Text>
                        {NUMBER_FORMATS.map((fmt) => (
                            <TouchableOpacity
                                key={fmt.label}
                                style={[styles.popupItem, { borderBottomColor: theme === 'dark' ? '#333' : '#eee' }]}
                                onPress={() => {
                                    setNumberFormat(fmt.label);
                                    setNumberFormatModalVisible(false); // Fix: Close modal
                                    Haptics.selectionAsync();
                                }}
                            >
                                {numberFormat === fmt.label && <IconSymbol name="check" size={16} color={Colors.light.tint} style={{ marginRight: 8 }} />}
                                <Text style={[styles.popupItemText, { color: theme === 'dark' ? '#fff' : '#000' }, numberFormat === fmt.label && { fontWeight: 'bold' }]}>
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
                    <View style={[styles.popupMenu, { backgroundColor: theme === 'dark' ? '#1E2330' : '#fff' }]}>
                        <Text style={[styles.popupTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>Date Format</Text>
                        {DATE_FORMATS.map((fmt) => (
                            <TouchableOpacity
                                key={fmt.label}
                                style={[styles.popupItem, { borderBottomColor: theme === 'dark' ? '#333' : '#eee' }]}
                                onPress={() => {
                                    setDateFormat(fmt.value);
                                    setDateFormatModalVisible(false);
                                    Haptics.selectionAsync();
                                }}
                            >
                                {dateFormat === fmt.value && <IconSymbol name="check" size={16} color={Colors.light.tint} style={{ marginRight: 8 }} />}
                                <Text style={[styles.popupItemText, { color: theme === 'dark' ? '#fff' : '#000' }, dateFormat === fmt.value && { fontWeight: 'bold' }]}>
                                    {fmt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    headerSpacer: { height: 60 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 12, textTransform: 'uppercase' },
    section: { marginBottom: 24, padding: 0 },
    row: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    label: { fontSize: 16, fontWeight: '500' },
    separator: { height: 1, marginLeft: 16 },
    profileSection: { marginBottom: 24, padding: 0, borderRadius: 24, overflow: 'hidden' },
    profileRow: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarContainer: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: Colors.dashboard.cyan, fontSize: 24, fontWeight: '700' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: '700' },
    profileEmail: { fontSize: 14, marginTop: 2 },
    logoutBtn: { padding: 8 },
    loginPrompt: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
    loginIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    loginContent: { flex: 1 },
    loginTitle: { fontSize: 17, fontWeight: '700' },
    loginSubtitle: { fontSize: 13, marginTop: 2 },
    // Modal Styles
    modalContainer: { flex: 1, paddingTop: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    modalTitle: { fontSize: 24, fontWeight: '700' },
    closeButton: { padding: 8 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 12, borderRadius: 12, marginBottom: 20 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
    modalList: { paddingHorizontal: 20, paddingBottom: 40 },
    listSectionHeader: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginTop: 20 },
    currencyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    currencyCode: { fontSize: 16, fontWeight: '700' },
    currencyName: { fontSize: 16 },
    currencyFlag: { fontSize: 24 },
    dimOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    popupMenu: { width: '80%', padding: 20, borderRadius: 24 },
    popupTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    popupItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    popupItemText: { fontSize: 16 },
});
