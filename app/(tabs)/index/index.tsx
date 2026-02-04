import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import { Transaction } from '@/types';
import { useCurrencyFormatter, useDateFormatter } from '@/utils/format';
import { format } from 'date-fns';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { HelpCircle, Repeat } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import {
    createAnimatedComponent,
    runOnJS,
    useAnimatedProps,
    useAnimatedReaction,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Mask, Path } from 'react-native-svg';
// import { ICON_MAP } from '../../add-category';

// --- Components ---

const AnimatedCircle = createAnimatedComponent(Circle);

const DashedCircularProgress = ({
    size = 220,
    strokeWidth = 14,
    percentage = 70,
    color = Colors.dashboard.cyan,
    labelValue,
    labelSubtitle,
    theme = 'dark',
    triggerKey
}: {
    size?: number,
    strokeWidth?: number,
    percentage?: number,
    color?: string,
    labelValue: string,
    labelSubtitle: string,
    theme?: 'light' | 'dark',
    triggerKey?: string
}) => {
    const radius = (size - strokeWidth) / 2;
    const innerRadius = radius - strokeWidth - 10;
    const circumference = radius * 2 * Math.PI;
    const innerCircumference = innerRadius * 2 * Math.PI;

    const dotCount = 40;
    const dotPitch = innerCircumference / dotCount;
    // dots created via strokeLinecap on zero-width dash
    const dotDashArray = [0.1, dotPitch - 0.1];

    const trackColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    const textColor = Colors[theme].text;
    const subTextColor = Colors[theme].gray;

    // Animation values
    const progress = useSharedValue(0);

    const triggerHaptic = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    useAnimatedReaction(
        () => Math.floor(progress.value / 5),
        (currentTick, previousTick) => {
            if (currentTick !== previousTick && currentTick > 0) {
                runOnJS(triggerHaptic)();
            }
        }
    );

    useEffect(() => {
        progress.value = 0;
        progress.value = withDelay(400, withTiming(percentage || 0, {
            duration: 1200
        }, (finished) => {
            if (finished) {
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
            }
        }));
    }, [triggerKey]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDasharray: [
            (circumference * Math.max(0, Math.min(100, progress.value))) / 100,
            circumference
        ]
    }));

    const innerAnimatedProps = useAnimatedProps(() => ({
        strokeDasharray: [
            (innerCircumference * Math.max(0, Math.min(100, progress.value))) / 100,
            innerCircumference
        ]
    }));

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                {/* Background Track (Solid Outer) */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Progress Ring (Outer Solid) */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    strokeDashoffset={-circumference / dotCount}
                />

                {/* Inner Decorative Dot Track (Gray Dots) */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={innerRadius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={8}
                    fill="transparent"
                    strokeDasharray={dotDashArray}
                    strokeLinecap="round"
                    strokeDashoffset={-dotPitch}
                />

                {/* Inner Decorative Dot Progress (Colored Dots) */}
                <Defs>
                    <Mask id="innerDotMask">
                        <AnimatedCircle
                            cx={size / 2}
                            cy={size / 2}
                            r={innerRadius}
                            stroke="white"
                            strokeWidth={8}
                            fill="transparent"
                            animatedProps={innerAnimatedProps}
                            strokeLinecap="round"
                            strokeDashoffset={-dotPitch}
                        />
                    </Mask>
                </Defs>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={innerRadius}
                    stroke={color}
                    strokeWidth={8}
                    fill="transparent"
                    strokeDasharray={dotDashArray}
                    strokeLinecap="round"
                    strokeDashoffset={-dotPitch}
                    mask="url(#innerDotMask)"
                />
            </Svg>

            <View style={[styles.circleLabelContainer, { width: innerRadius * 1.5 }]}>
                <Text
                    style={[styles.circleValue, { color: textColor, fontSize: 32, fontWeight: '800', textAlign: 'center' }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.4}
                >
                    {labelValue}
                </Text>
                <Text style={[styles.circleSubtitle, { color: subTextColor, fontSize: 13, marginTop: 4, fontWeight: '500', textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit>{labelSubtitle}</Text>
            </View>
        </View>
    );
};

const StatItem = ({ label, value, color, theme = 'dark' }: { label: string, value: string, color?: string, theme?: 'light' | 'dark' }) => (
    <View style={styles.statItem}>
        <Text style={[styles.statLabel, { color: Colors[theme].gray }]}>{label} <IconSymbol name="chevron-right" size={10} color={Colors[theme].gray} /></Text>
        <Text style={[styles.statValue, { color: color || Colors[theme].text }]}>{value}</Text>
    </View>
);

const MiniDonutChart = ({ data, size = 70, strokeWidth = 10 }: { data: { amount: number, color: string, name?: string }[], size?: number, strokeWidth?: number }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const timeoutRef = useRef<any>(null);
    const formatCurrency = useCurrencyFormatter();

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const total = data.reduce((acc, d) => acc * 1 + d.amount * 1, 0);

    let currentOffset = 0;

    const handlePress = (index: number) => {
        if (data[index].name === undefined) return; // Ignore fallback data
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(index);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSelected(null), 2000);
    };

    return (
        <View style={{ width: size, height: size, alignSelf: 'center' }}>
            {/* Tooltip */}
            {selected !== null && data[selected].name && (
                <View style={{
                    position: 'absolute',
                    top: -55,
                    left: -35,
                    width: 140,
                    zIndex: 100,
                    alignItems: 'center'
                }}>
                    <BlurView intensity={30} tint="dark" style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 10,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                    }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
                            {data[selected].name}
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' }}>
                            {formatCurrency(data[selected].amount)}
                        </Text>
                    </BlurView>
                </View>
            )}

            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                {data.map((d, i) => {
                    const percentage = (d.amount / total) * 100;
                    if (percentage === 0) return null;

                    const strokeDasharray = [
                        (circumference * Math.max(0, percentage - 8)) / 100,
                        circumference
                    ];
                    const offset = currentOffset;
                    currentOffset += (circumference * percentage) / 100;

                    return (
                        <Circle
                            key={i}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={d.color}
                            strokeWidth={selected === i ? strokeWidth + 4 : strokeWidth}
                            fill="transparent"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            onPress={() => handlePress(i)}
                            opacity={selected === null || selected === i ? 1 : 0.4}
                        />
                    );
                })}
            </Svg>
        </View>
    );
};

const SimpleBarChart = ({ data, color }: { data: number[], color: string }) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const timeoutRef = useRef<any>(null);
    const formatCurrency = useCurrencyFormatter();

    const width = 130;
    const height = 40;
    const barWidth = 8;
    const gap = 4;
    const max = Math.max(...data, 1);

    const handlePress = (index: number) => {
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setSelectedIndex(index);

        // Auto-hide tooltip after 2 seconds
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setSelectedIndex(null);
        }, 2000);
    };

    return (
        <View style={{ marginTop: 15 }}>
            {/* Tooltip */}
            {selectedIndex !== null && (
                <View style={{
                    position: 'absolute',
                    top: -45,
                    left: (selectedIndex * (barWidth + gap)) - 15,
                    zIndex: 100,
                    alignItems: 'center'
                }}>
                    <BlurView intensity={25} tint="dark" style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 5,
                    }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                            ${data[selectedIndex].toLocaleString()}
                        </Text>
                    </BlurView>
                    {/* Tooltip Triangle */}
                    <View style={{
                        width: 0,
                        height: 0,
                        backgroundColor: 'transparent',
                        borderStyle: 'solid',
                        borderLeftWidth: 5,
                        borderRightWidth: 5,
                        borderTopWidth: 5,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderTopColor: 'rgba(255,255,255,0.2)',
                    }} />
                </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap, height }}>
                {data.map((val, i) => (
                    <TouchableOpacity
                        key={i}
                        activeOpacity={0.7}
                        onPress={() => handlePress(i)}
                        style={{
                            width: barWidth,
                            height: (val / max) * height,
                            backgroundColor: selectedIndex === i ? '#fff' : color,
                            borderRadius: 2,
                            opacity: (selectedIndex === null)
                                ? (i === data.length - 1 ? 1 : 0.6)
                                : (selectedIndex === i ? 1 : 0.3)
                        }}
                    />
                ))}
            </View>
        </View>
    );
};

const TrendSparkline = ({ data, color, width = 140, height = 50 }: { data: number[], color: string, width?: number, height?: number }) => {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height * 0.8) - (height * 0.1);
        return { x, y };
    });

    const pathData = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

    return (
        <View style={{ width, height, marginTop: 10 }}>
            <Svg width={width} height={height}>
                <Path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
};

const SavingRateGauge = ({ percentage }: { percentage: number }) => {
    const width = 130;
    const height = 75;
    const strokeWidth = 12;
    const radius = (width - strokeWidth) / 2;
    const cx = width / 2;
    const cy = height - 5;

    // Helper to create arc path
    const getArcPath = (startPct: number, endPct: number) => {
        // limit percentages
        const s = Math.max(0, Math.min(100, startPct));
        const e = Math.max(0, Math.min(100, endPct));

        // Convert to radians (PI to 0)
        const startRad = Math.PI * (1 - s / 100);
        const endRad = Math.PI * (1 - e / 100);

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy - radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy - radius * Math.sin(endRad);

        return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
    };

    // Calculate indicator position
    const currentRad = Math.PI * (1 - Math.max(0, Math.min(100, percentage)) / 100);
    const ix = cx + radius * Math.cos(currentRad);
    const iy = cy - radius * Math.sin(currentRad);

    return (
        <View style={{ width, height, alignSelf: 'center', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Svg width={width} height={height}>
                {/* Segment 1: Low (Red) 0-30% */}
                <Path
                    d={getArcPath(0, 28)}
                    stroke={Colors.expense}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Segment 2: Good (Orange) 36-64% */}
                <Path
                    d={getArcPath(36, 64)}
                    stroke={Colors.dashboard.orange}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Segment 3: Excellent (Blue) 72-100% */}
                <Path
                    d={getArcPath(72, 100)}
                    stroke="#0D93FC"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Current Value Indicator */}
                <Circle
                    cx={ix}
                    cy={iy}
                    r={8}
                    fill="#fff"
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth={2}
                />
                {/* Glow for indicator */}
                <Circle
                    cx={ix}
                    cy={iy}
                    r={12}
                    fill="#fff"
                    fillOpacity={0.2}
                />
            </Svg>
        </View>
    );
};

const InsightCard = ({
    title,
    value,
    subtitle,
    icon,
    color,
    content,
    theme = 'dark',
    legend,
    onPress
}: {
    title: string,
    value: string,
    subtitle?: string,
    icon?: string,
    color: string,
    content?: React.ReactNode,
    theme?: 'light' | 'dark',
    legend?: { name: string, color: string },
    onPress?: () => void
}) => {
    const finalBg = theme === 'dark' ? color : 'rgba(0,0,0,0.05)';
    const titleColor = '#8E8E93';
    const valueColor = '#fff';

    return (
        <View style={[styles.insightCard, { backgroundColor: finalBg }]}>
            <TouchableOpacity
                activeOpacity={onPress ? 0.7 : 1}
                onPress={onPress}
                disabled={!onPress}
            >
                <View style={styles.insightHeader}>
                    <IconSymbol name={icon as any || "bar-chart"} size={14} color={titleColor} />
                    <Text style={[styles.insightTitle, { color: titleColor }]}>{title}</Text>
                </View>
                <Text style={[styles.insightValue, { color: valueColor, marginTop: 4 }]}>{value}</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, justifyContent: 'center', marginVertical: 10 }}>
                {content}
            </View>

            <TouchableOpacity
                activeOpacity={onPress ? 0.7 : 1}
                onPress={onPress}
                disabled={!onPress}
            >
                {legend && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: legend.color }} />
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{legend.name}</Text>
                    </View>
                )}
                {!legend && subtitle && <Text style={[styles.insightSubtitle, { color: '#8E8E93' }]}>{subtitle}</Text>}
            </TouchableOpacity>
        </View>
    );
};

const TransactionItem = ({ t, theme = 'dark', categories, onPress, isLast }: { t: Transaction, theme?: 'light' | 'dark', categories: any[], onPress: () => void, isLast: boolean }) => {
    const category = categories.find(c => c.id === t.categoryId);
    const iconIsEmoji = category?.icon && category.icon.length <= 4 && !/^[a-zA-Z]+$/.test(category.icon);

    const formatCurrency = useCurrencyFormatter();
    const formatDate = useDateFormatter();

    const formattedAmount = `${formatCurrency(Math.abs(t.amount))}${t.type === 'outflow' ? '-' : ''}`;

    return (
        <View>
            <TouchableOpacity
                style={styles.tItem}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={[styles.tIconPlaceholder, { backgroundColor: (category?.color || '#333') + '20', borderRadius: 20 }]}>
                    {iconIsEmoji ? (
                        <Text style={{ fontSize: 20 }}>{category?.icon}</Text>
                    ) : (
                        <HelpCircle size={20} color={category?.color || (theme === 'dark' ? '#fff' : '#999')} />
                    )}
                </View>
                <View style={styles.tContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={[styles.tCategory, { color: Colors[theme].text, fontSize: 17 }]}>{t.categoryName || 'General'}</Text>
                        {t.isRecurring && (
                            <View style={[styles.recurringBadge, { backgroundColor: Colors.dashboard.cyan + '20' }]}>
                                <Repeat size={10} color={Colors.dashboard.cyan} strokeWidth={3} />
                            </View>
                        )}
                    </View>
                    <Text style={[styles.tDate, { color: Colors[theme].gray }]}>{formatDate(new Date(t.date))}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.tAmount, { color: Colors[theme].text, fontSize: 16 }]}>
                        {formattedAmount}
                    </Text>
                    <IconSymbol name="chevron-right" size={16} color="#666" />
                </View>
            </TouchableOpacity>
            {!isLast && <View style={{ height: 1, backgroundColor: '#2C2C2E', width: '90%', alignSelf: 'center' }} />}
        </View>
    );
};

export default function HomeScreen() {
    const router = useRouter();
    const { transactions, getBalance, refreshData, selectedDate, categories } = useFinanceStore();
    const colorScheme = useColorScheme();
    const theme = 'dark'; // Force dark theme for black gradient background

    // Formatters
    const formatCurrency = useCurrencyFormatter();
    const formatDate = useDateFormatter();

    React.useEffect(() => {
        refreshData();
    }, []);

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
    const spentPercentage = monthlyBudget > 0 ? Math.max(0, Math.min(100, (monthlyOutflow / monthlyBudget) * 100)) : 0;

    const totalBalance = getBalance();
    const recent = transactions.slice(0, 3);

    const baseColor = availablePercentage < 25
        ? Colors.expense
        : availablePercentage < 50
            ? Colors.dashboard.orange
            : '#0D93FC';

    // --- Last Month Comparison ---
    const lastMonthDate = new Date(selectedDate);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthStr = format(lastMonthDate, 'yyyy-MM');
    const lastMonthTransactions = transactions.filter(t => format(new Date(t.date), 'yyyy-MM') === lastMonthStr);

    const lastMonthOutflow = lastMonthTransactions
        .filter(t => t.type === 'outflow')
        .reduce((acc, t) => acc + t.amount, 0);
    const lastMonthInflow = lastMonthTransactions
        .filter(t => t.type === 'inflow')
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    // We compare what was left at the end of last month vs what is left now
    const lastMonthAvailable = lastMonthInflow - lastMonthOutflow;

    // Logic: If current available > last month final available, it's a positive trend
    const trendDiff = leftToSpend - lastMonthAvailable;
    let trendPercentage = 0;
    if (lastMonthAvailable > 0) {
        trendPercentage = Math.round((trendDiff / lastMonthAvailable) * 100);
    } else if (leftToSpend > 0) {
        trendPercentage = 100;
    }

    console.log(`[Trend Debug] Current Month: ${currentMonth}, Inflow: ${monthlyInflow}, Outflow: ${monthlyOutflow}, Left: ${leftToSpend}`);
    console.log(`[Trend Debug] Last Month: ${lastMonthStr}, Inflow: ${lastMonthInflow}, Outflow: ${lastMonthOutflow}, Left: ${lastMonthAvailable}`);
    console.log(`[Trend Debug] Trend Diff: ${trendDiff}, Percentage: ${trendPercentage}%`);

    // --- Sparklines and Charts ---

    // 1. Trend Comparison Data
    // We compare this month's running net balance vs last month's running net balance for each day
    const trendSparklineData: number[] = [];
    let currentRunningBalance = 0;
    let lastMonthRunningBalance = 0;

    const currentDailyNet: Record<number, number> = {};
    const lastMonthDailyNet: Record<number, number> = {};

    const todayDay = new Date().getDate();

    monthlyTransactions.forEach(t => {
        const d = new Date(t.date).getDate();
        const amt = Number(t.amount) || 0;
        currentDailyNet[d] = (currentDailyNet[d] || 0) + (t.type === 'inflow' ? amt : -amt);
    });

    lastMonthTransactions.forEach(t => {
        const d = new Date(t.date).getDate();
        const amt = Number(t.amount) || 0;
        lastMonthDailyNet[d] = (lastMonthDailyNet[d] || 0) + (t.type === 'inflow' ? amt : -amt);
    });

    for (let i = 1; i <= todayDay; i++) {
        currentRunningBalance += (currentDailyNet[i] || 0);
        lastMonthRunningBalance += (lastMonthDailyNet[i] || 0);

        // This value represents: "How much better/worse am I today vs the same day last month?"
        trendSparklineData.push(currentRunningBalance - lastMonthRunningBalance);
    }

    // Fallback if no days yet
    if (trendSparklineData.length === 0) trendSparklineData.push(0);
    if (trendSparklineData.length === 1) trendSparklineData.unshift(0);

    // 2. Spending Bars for Spending Card
    // Shows individual transaction amounts for the most recent 10 expenses
    let spendingChartData = monthlyTransactions
        .filter(t => t.type === 'outflow')
        .slice(-10) // Get last 10
        .map(t => Number(t.amount));

    if (spendingChartData.length === 0) spendingChartData = [0];

    // 3. Category Pie/Donut
    const categoryTotals = monthlyTransactions
        .filter(t => t.type === 'outflow')
        .reduce((acc, t) => {
            const catId = t.categoryId || 'other';
            acc[catId] = (acc[catId] || 0) + Number(t.amount);
            return acc;
        }, {} as Record<string, number>);

    const sortedCategoriesData = Object.entries(categoryTotals)
        .map(([id, amount]) => ({
            id,
            amount,
            category: categories.find(c => c.id === id) || { name: 'Other', color: '#666' }
        }))
        .sort((a, b) => b.amount - a.amount);

    const topCategory = sortedCategoriesData[0];
    const donutData = sortedCategoriesData.slice(0, 5).map(c => ({
        amount: c.amount,
        color: c.category.color,
        name: c.category.name
    }));

    // 4. Savings Rate
    const savingsRate = monthlyInflow > 0 ? Math.max(0, Math.round(((monthlyInflow - monthlyOutflow) / monthlyInflow) * 100)) : 0;
    const savingStatus = savingsRate >= 68 ? { name: 'Excellent', color: '#0D93FC' } : savingsRate >= 32 ? { name: 'Good', color: Colors.dashboard.orange } : { name: 'Low', color: Colors.expense };

    return (
        <LinearGradient
            colors={[baseColor + '1A', '#000000']}
            locations={[0, 0.35]}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]} showsVerticalScrollIndicator={false}>

                <View style={styles.heroSection}>
                    <DashedCircularProgress
                        size={220}
                        percentage={availablePercentage}
                        labelValue={formatCurrency(leftToSpend)}
                        labelSubtitle={`${Math.round(availablePercentage)}% Available`}
                        color={baseColor}
                        theme={theme}
                        triggerKey={currentMonth}
                    />
                </View>

                <View style={styles.statsRow}>
                    <StatItem label="Budget" value={formatCurrency(monthlyBudget)} theme={theme} />
                    <StatItem label="Spent" value={formatCurrency(monthlyOutflow)} theme={theme} />
                    <StatItem label="Available" value={formatCurrency(leftToSpend)} theme={theme} />
                </View>

                <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>Insights</Text>
                <View style={styles.grid}>
                    <View style={styles.col}>
                        <InsightCard
                            title="Trend"
                            color="#131C33"
                            value={(trendPercentage > 0 ? "+" : "") + trendPercentage + "%"}
                            icon={trendPercentage >= 0 ? "trending-up" : "trending-down"}
                            subtitle="vs Last Month"
                            theme={theme}
                            onPress={() => router.push('/trend-info')}
                            content={
                                <TrendSparkline data={trendSparklineData} color={trendPercentage >= 0 ? Colors.dashboard.cyan : Colors.expense} width={130} />
                            }
                            legend={trendPercentage >= 0
                                ? { name: "Better", color: Colors.dashboard.cyan }
                                : { name: "Worse", color: Colors.expense }
                            }
                        />
                        <InsightCard
                            title="Spending"
                            color="#2B1A10"
                            value={formatCurrency(monthlyOutflow)}
                            icon="calendar-today"
                            subtitle={`${monthlyTransactions.filter(t => t.type === 'outflow').length} expenses`}
                            theme={theme}
                            onPress={() => router.push('/spending-info')}
                            content={
                                <SimpleBarChart data={spendingChartData} color={Colors.dashboard.orange} />
                            }
                        />
                    </View>
                    <View style={styles.col}>
                        <InsightCard
                            title="Top Spending"
                            color="#2A1B3D"
                            value={formatCurrency(topCategory?.amount || 0)}
                            icon="pie-chart"
                            theme={theme}
                            onPress={() => router.push('/top-spending-info')}
                            content={
                                <MiniDonutChart data={donutData.length > 0 ? donutData : [{ amount: 1, color: '#333' }]} size={65} strokeWidth={11} />
                            }
                            legend={topCategory ? { name: topCategory.category.name, color: topCategory.category.color } : undefined}
                        />
                        <InsightCard
                            title="Saving Rate"
                            color="#0A3D3C"
                            value={`+${savingsRate}%`}
                            icon="wallet"
                            theme={theme}
                            onPress={() => router.push('/saving-rate-info')}
                            content={
                                <SavingRateGauge percentage={savingsRate} />
                            }
                            legend={savingStatus}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.recentHeader} onPress={() => router.push('/(tabs)/transactions' as any)}>
                    <Text style={[styles.sectionTitle, { color: Colors[theme].text, marginBottom: 0 }]}>Recent Transactions</Text>
                    <IconSymbol name="chevron-right" size={20} color={Colors[theme].text} />
                </TouchableOpacity>

                {recent.length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol name="list" size={40} color={Colors[theme].tabIconDefault} />
                        <Text style={[styles.emptyText, { color: Colors[theme].text }]}>No transactions in {format(selectedDate, 'MMMM')} yet</Text>
                        <Text style={[styles.emptySubText, { color: Colors[theme].gray }]}>Add your first transaction to get started</Text>
                        <TouchableOpacity style={styles.ghostBtn} onPress={() => router.push('/add-transaction')}>
                            <Text style={styles.ghostBtnText}>Add Transaction</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ backgroundColor: '#1C1C1E', borderRadius: 22, overflow: 'hidden' }}>
                        {recent.map((t, index) => (
                            <TransactionItem
                                key={t.id}
                                t={t}
                                theme={theme}
                                categories={categories}
                                onPress={() => router.push({ pathname: '/transaction-detail', params: { transactionId: t.id } })}
                                isLast={index === recent.length - 1}
                            />
                        ))}
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    scrollContent: { paddingHorizontal: 20 },
    heroSection: { alignItems: 'center', marginTop: 0, marginBottom: 20 },
    circleLabelContainer: { position: 'absolute', alignItems: 'center' },
    circleValue: { fontSize: 36, fontWeight: '700' },
    circleSubtitle: { fontSize: 14 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingHorizontal: 10 },
    statItem: { alignItems: 'center' },
    statLabel: { fontSize: 12, marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: '600' },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    grid: { flexDirection: 'row', gap: 16, marginBottom: 30 },
    col: { flex: 1, gap: 16 },
    insightCard: { borderRadius: 24, padding: 16, height: 190, justifyContent: 'space-between' },
    insightHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    insightTitle: { fontSize: 14, fontWeight: '600' },
    insightValue: { fontSize: 28, fontWeight: '700', marginTop: 8 },
    insightSubtitle: { fontSize: 12 },
    progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 4 },
    emptyState: { alignItems: 'center', padding: 40, gap: 10 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    emptySubText: { fontSize: 14, textAlign: 'center' },
    ghostBtn: { marginTop: 10, borderWidth: 1, borderColor: Colors.dashboard.cyan, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    ghostBtnText: { color: Colors.dashboard.cyan, fontWeight: '600' },
    tItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
    tIconPlaceholder: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    tContent: { flex: 1 },
    tCategory: { fontSize: 16, fontWeight: '600' },
    tDate: { fontSize: 12 },
    tAmount: { fontSize: 16, fontWeight: '700' },
    recurringBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 2 },
    recurringBadgeText: { fontSize: 10, fontWeight: '800' },
});
