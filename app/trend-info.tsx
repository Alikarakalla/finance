import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TrendInfoScreen() {
    const primaryColor = '#131C33';

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
                                <Text style={styles.sectionTitle}>Monthly Trend</Text>
                                <Text style={styles.text}>
                                    This tracks how your financial performance this month compares to the same time last month.
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
                                    ThisMonth(Net) vs LastMonth(Net)
                                </Text>
                            </View>

                            <View style={styles.benchmarks}>
                                <Text style={styles.sectionTitle}>What the line shows</Text>

                                <View style={styles.benchmarkItem}>
                                    <View style={[styles.dot, { backgroundColor: '#0D93FC' }]} />
                                    <View style={styles.benchmarkContent}>
                                        <Text style={styles.benchmarkLabel}>Upward Push</Text>
                                        <Text style={styles.benchmarkDesc}>You are currently saving at a higher rate than last month.</Text>
                                    </View>
                                </View>

                                <View style={styles.benchmarkItem}>
                                    <View style={[styles.dot, { backgroundColor: '#FF453A' }]} />
                                    <View style={styles.benchmarkContent}>
                                        <Text style={styles.benchmarkLabel}>Downward Dip</Text>
                                        <Text style={styles.benchmarkDesc}>Your current expenses are outpacing your previous month's rhythm.</Text>
                                    </View>
                                </View>

                                <View style={styles.benchmarkItem}>
                                    <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
                                    <View style={styles.benchmarkContent}>
                                        <Text style={styles.benchmarkLabel}>Flat Line</Text>
                                        <Text style={styles.benchmarkDesc}>Your spending habits are perfectly consistent month-over-month.</Text>
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
        backgroundColor: '#131C33',
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
