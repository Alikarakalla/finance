import { LiquidGlassCard as GlassCard } from '@/components/LiquidGlassComponents';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function BudgetScreen() {
    const { categories } = useFinanceStore();
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <LinearGradient
                colors={theme === 'dark' ? ['#000', '#1c1c1e'] : ['#F8F9FA', '#E8F5E9']}
                style={StyleSheet.absoluteFill}
            />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerSpacer} />
                <Text style={[styles.title, { color: Colors[theme].text }]}>Categories</Text>

                <GlassCard style={styles.card} variant={theme === 'dark' ? 'dark' : 'default'} intensity={theme === 'dark' ? 40 : 70}>
                    <Text style={[styles.label, { color: Colors[theme].gray }]}>Monthly tracking categories</Text>
                    <Text style={{ color: Colors[theme].text, fontSize: 16 }}>
                        Track your spending across these categories. Your budget is automatically calculated based on your monthly income.
                    </Text>
                </GlassCard>

                <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>All Categories</Text>
                {categories.map(cat => (
                    <GlassCard key={cat.id} style={styles.catCard} variant={theme === 'dark' ? 'dark' : 'default'} intensity={theme === 'dark' ? 40 : 70}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.catColorDot, { backgroundColor: cat.color || Colors.dashboard.cyan }]} />
                            <Text style={[styles.catName, { color: Colors[theme].text }]}>{cat.name}</Text>
                        </View>
                        <Text style={{ color: Colors[theme].gray, textTransform: 'capitalize' }}>{cat.type}</Text>
                    </GlassCard>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    headerSpacer: { height: 60 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 20 },
    card: { padding: 24, marginBottom: 20 },
    label: { fontSize: 14, marginBottom: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, marginTop: 12 },
    catCard: { marginBottom: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    catName: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
    catColorDot: { width: 12, height: 12, borderRadius: 6 },
});
