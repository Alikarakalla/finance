import { LiquidGlassCard as GlassCard } from '@/components/LiquidGlassComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

export default function SettingsScreen() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const router = useRouter();

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <LinearGradient
                colors={theme === 'dark' ? ['#000', '#1c1c1e'] : ['#F8F9FA', '#E8F5E9']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
                <View style={styles.headerSpacer} />
                <Text style={[styles.title, { color: Colors[theme].text }]}>Settings</Text>

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
                        <Switch value={true} />
                    </View>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    headerSpacer: { height: 60 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 20 },
    section: { marginBottom: 24, padding: 0 },
    row: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    label: { fontSize: 16, fontWeight: '500' },
    separator: { height: 1, marginLeft: 16 }
});
