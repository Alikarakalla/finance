import { Colors } from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SavingRateInfoScreen() {
    const router = useRouter();
    const primaryColor = '#0A3D3C'; // Same as the Saving Rate card

    return (
        <View style={styles.outerContainer}>
            <View style={styles.container}>
                <BlurView intensity={100} tint="dark" style={styles.blur}>
                    <LinearGradient
                        colors={[primaryColor, '#000000']}
                        style={styles.gradient}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>What is it?</Text>
                                <Text style={styles.text}>
                                    Your saving rate is the percentage of your total income (inflow) that you keep after all expenses (outflow) are paid.
                                </Text>
                            </View>

                            <View style={styles.formulaCard}>
                                <Text style={styles.formulaTitle}>Calculation Logic</Text>
                                <Text
                                    style={styles.formulaText}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.5}
                                >
                                    (Income - Expenses) / Income × 100
                                </Text>
                            </View>

                            <View style={styles.benchmarks}>
                                <Text style={styles.sectionTitle}>Benchmarks</Text>

                                <View style={styles.benchmarkItem}>
                                    <View style={[styles.dot, { backgroundColor: '#0D93FC' }]} />
                                    <View style={styles.benchmarkContent}>
                                        <Text style={styles.benchmarkLabel}>Excellent (20%+)</Text>
                                        <Text style={styles.benchmarkDesc}>You're building wealth rapidly. Keep it up!</Text>
                                    </View>
                                </View>

                                <View style={styles.benchmarkItem}>
                                    <View style={[styles.dot, { backgroundColor: Colors.dashboard.orange }]} />
                                    <View style={styles.benchmarkContent}>
                                        <Text style={styles.benchmarkLabel}>Good (10-20%)</Text>
                                        <Text style={styles.benchmarkDesc}>A solid foundation for future goals.</Text>
                                    </View>
                                </View>

                                <View style={styles.benchmarkItem}>
                                    <View style={[styles.dot, { backgroundColor: Colors.expense }]} />
                                    <View style={styles.benchmarkContent}>
                                        <Text style={styles.benchmarkLabel}>Needs Focus (Under 10%)</Text>
                                        <Text style={styles.benchmarkDesc}>Try identifying small recurring costs to cut.</Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </LinearGradient>
                </BlurView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#0A3D3C',
    },
    container: {
        flex: 1,
        margin: -20,
    },
    blur: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        padding: 20,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
    },
    text: {
        fontSize: 15,
        lineHeight: 22,
        color: 'rgba(255,255,255,0.8)',
    },
    formulaCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
    },
    formulaTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    formulaText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    benchmarks: {
        marginBottom: 40,
    },
    benchmarkItem: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 16,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 6,
    },
    benchmarkContent: {
        flex: 1,
    },
    benchmarkLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    benchmarkDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    }
});
