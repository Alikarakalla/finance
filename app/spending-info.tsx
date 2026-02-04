import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SpendingInfoScreen() {
    const primaryColor = '#2B1A10';

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
                                <Text style={styles.sectionTitle}>Spending Habits</Text>
                                <Text style={styles.text}>
                                    This section visualizes your recent expense activity. It helps you quickly spot high-cost transactions.
                                </Text>
                            </View>

                            <View style={styles.formulaCard}>
                                <Text style={styles.formulaTitle}>Tracking logic</Text>
                                <Text
                                    style={styles.formulaText}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.5}
                                >
                                    Latest 10 Transactions
                                </Text>
                            </View>

                            <View style={styles.benchmarks}>
                                <Text style={styles.sectionTitle}>How to read the chart</Text>

                                <View style={styles.benchmarkItem}>
                                    <View style={[styles.dot, { backgroundColor: '#FF9500' }]} />
                                    <View style={styles.benchmarkContent}>
                                        <Text style={styles.benchmarkLabel}>Bar Height</Text>
                                        <Text style={styles.benchmarkDesc}>The taller the bar, the higher the individual expense was.</Text>
                                    </View>
                                </View>

                                <View style={styles.benchmarkItem}>
                                    <View style={[styles.dot, { backgroundColor: 'rgba(255,149,0,0.5)' }]} />
                                    <View style={styles.benchmarkContent}>
                                        <Text style={styles.benchmarkLabel}>Recent History</Text>
                                        <Text style={styles.benchmarkDesc}>The bars move from left (older) to right (most recent).</Text>
                                    </View>
                                </View>

                                <View style={styles.benchmarkItem}>
                                    <View style={[styles.dot, { backgroundColor: '#fff' }]} />
                                    <View style={styles.benchmarkContent}>
                                        <Text style={styles.benchmarkLabel}>Interactive</Text>
                                        <Text style={styles.benchmarkDesc}>Tap any bar to see the exact dollar amount spent.</Text>
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
        backgroundColor: '#2B1A10',
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
