import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { HelpCircle, Repeat } from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import Svg, { Circle, Defs, Mask, Path } from 'react-native-svg';
// import { ICON_MAP } from '../../add-category';

// --- Components ---

const DashedCircularProgress = ({
    size = 220,
    strokeWidth = 14,
    percentage = 70,
    color = Colors.dashboard.cyan,
    labelValue,
    labelSubtitle,
    theme = 'dark'
}: {
    size?: number,
    strokeWidth?: number,
    percentage?: number,
    color?: string,
    labelValue: string,
    labelSubtitle: string,
    theme?: 'light' | 'dark'
}) => {
    const radius = (size - strokeWidth) / 2;
    const innerRadius = radius - strokeWidth - 10;
    const circumference = radius * 2 * Math.PI;
    const innerCircumference = innerRadius * 2 * Math.PI;

    const progressStrokeDasharray = [
        (circumference * Math.max(0, Math.min(100, percentage))) / 100,
        circumference
    ];

    const innerProgressStrokeDasharray = [
        (innerCircumference * Math.max(0, Math.min(100, percentage))) / 100,
        innerCircumference
    ];

    const dotCount = 40;
    const dotGap = innerCircumference / dotCount;
    // dots created via strokeLinecap on zero-width dash
    const dotDashArray = [0.1, dotGap];

    const trackColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    const textColor = Colors[theme].text;
    const subTextColor = Colors[theme].gray;

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
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={progressStrokeDasharray}
                    strokeLinecap="round"
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
                />

                {/* Inner Decorative Dot Progress (Colored Dots) */}
                <Defs>
                    <Mask id="innerDotMask">
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={innerRadius}
                            stroke="white"
                            strokeWidth={8}
                            fill="transparent"
                            strokeDasharray={innerProgressStrokeDasharray}
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
                    mask="url(#innerDotMask)"
                />
            </Svg>

            <View style={styles.circleLabelContainer}>
                <Text style={[styles.circleValue, { color: textColor, fontSize: 38, fontWeight: '800' }]}>{labelValue}</Text>
                <Text style={[styles.circleSubtitle, { color: subTextColor, fontSize: 13, marginTop: 4, fontWeight: '500' }]}>{labelSubtitle}</Text>
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

const MiniDonutChart = ({ data, size = 70, strokeWidth = 10 }: { data: { amount: number, color: string }[], size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const total = data.reduce((acc, d) => acc * 1 + d.amount * 1, 0);

    let currentOffset = 0;

    return (
        <View style={{ width: size, height: size, alignSelf: 'center' }}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                {data.map((d, i) => {
                    const percentage = (d.amount / total) * 100;
                    if (percentage === 0) return null;
                    // Significantly increase gap to compensate for rounded linecaps
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
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                        />
                    );
                })}
            </Svg>
        </View>
    );
};

const SimpleBarChart = ({ data, color }: { data: number[], color: string }) => {
    const width = 130;
    const height = 40;
    const barWidth = 8;
    const gap = 4;
    const max = Math.max(...data, 1);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap, height, marginTop: 15 }}>
            {data.map((val, i) => (
                <View
                    key={i}
                    style={{
                        width: barWidth,
                        height: (val / max) * height,
                        backgroundColor: color,
                        borderRadius: 2,
                        opacity: i === data.length - 1 ? 1 : 0.6
                    }}
                />
            ))}
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
    legend
}: {
    title: string,
    value: string,
    subtitle?: string,
    icon?: string,
    color: string,
    content?: React.ReactNode,
    theme?: 'light' | 'dark',
    legend?: { name: string, color: string }
}) => {
    const finalBg = theme === 'dark' ? color : 'rgba(0,0,0,0.05)';
    const titleColor = '#8E8E93';
    const valueColor = '#fff';

    return (
        <View style={[styles.insightCard, { backgroundColor: finalBg }]}>
            <View style={styles.insightHeader}>
                <IconSymbol name={icon as any || "bar-chart"} size={14} color={titleColor} />
                <Text style={[styles.insightTitle, { color: titleColor }]}>{title}</Text>
            </View>
            <Text style={[styles.insightValue, { color: valueColor, marginTop: 4 }]}>{value}</Text>
            <View style={{ flex: 1, justifyContent: 'center', marginVertical: 10 }}>
                {content}
            </View>
            {legend && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: legend.color }} />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{legend.name}</Text>
                </View>
            )}
            {!legend && subtitle && <Text style={[styles.insightSubtitle, { color: '#8E8E93' }]}>{subtitle}</Text>}
        </View>
    );
};

const TransactionItem = ({ t, theme = 'dark', categories, onPress, isLast }: { t: Transaction, theme?: 'light' | 'dark', categories: any[], onPress: () => void, isLast: boolean }) => {
    const category = categories.find(c => c.id === t.categoryId);
    // const IconComp = category ? (ICON_MAP[category.icon] || HelpCircle) : HelpCircle;
    const iconIsEmoji = category?.icon && category.icon.length <= 4 && !/^[a-zA-Z]+$/.test(category.icon);

    // "$ 1,100.00-" format (trailing negative sign for outflow)
    const formattedAmount = `$ ${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${t.type === 'outflow' ? '-' : ''}`;

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
                    <Text style={[styles.tDate, { color: Colors[theme].gray }]}>{format(new Date(t.date), 'MMM d')}</Text>
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

    const totalBalance = getBalance();
    const recent = transactions.slice(0, 3);

    const baseColor = availablePercentage < 25
        ? Colors.expense
        : availablePercentage < 50
            ? Colors.dashboard.orange
            : '#0D93FC';

    const spentPercentage = monthlyBudget > 0 ? Math.max(0, Math.min(100, (monthlyOutflow / monthlyBudget) * 100)) : 0;

    const lastMonthDate = new Date(selectedDate);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthStr = format(lastMonthDate, 'yyyy-MM');
    const lastMonthTransactions = transactions.filter(t => format(new Date(t.date), 'yyyy-MM') === lastMonthStr);
    const lastMonthOutflow = lastMonthTransactions
        .filter(t => t.type === 'outflow')
        .reduce((acc, t) => acc + t.amount, 0);

    const trendDiff = monthlyOutflow - lastMonthOutflow;
    const trendPercentage = lastMonthOutflow > 0
        ? Math.round((trendDiff / lastMonthOutflow) * 100)
        : 0;

    // Sparkline data (daily or weekly)
    const dailySpending: Record<string, number> = {};
    monthlyTransactions.filter(t => t.type === 'outflow').forEach(t => {
        const day = format(new Date(t.date), 'd');
        dailySpending[day] = (dailySpending[day] || 0) + Number(t.amount);
    });
    const sparklineData = Object.values(dailySpending).length > 1
        ? Object.values(dailySpending)
        : [lastMonthOutflow / 30, monthlyOutflow];

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
        color: c.category.color
    }));

    const savingsRate = monthlyInflow > 0 ? Math.max(0, Math.round(((monthlyInflow - monthlyOutflow) / monthlyInflow) * 100)) : 0;
    const savingStatus = savingsRate >= 20 ? { name: 'Excellent', color: '#0D93FC' } : savingsRate >= 10 ? { name: 'Good', color: Colors.dashboard.orange } : { name: 'Low', color: Colors.expense };

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
                        percentage={spentPercentage}
                        labelValue={`$${monthlyOutflow.toLocaleString()}`}
                        labelSubtitle={`${Math.round(spentPercentage)}% of budget spent`}
                        color={baseColor}
                        theme={theme}
                    />
                </View>

                <View style={styles.statsRow}>
                    <StatItem label="Budget" value={`$${monthlyBudget.toLocaleString()}`} theme={theme} />
                    <StatItem label="Spent" value={`$${monthlyOutflow.toLocaleString()}`} theme={theme} />
                    <StatItem label="Available" value={`$${leftToSpend.toLocaleString()}`} theme={theme} />
                </View>

                <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>Insights</Text>
                <View style={styles.grid}>
                    <View style={styles.col}>
                        <InsightCard
                            title="Trend"
                            color="#131C33"
                            value={(trendPercentage >= 0 ? "+" : "") + trendPercentage + "%"}
                            icon="bar-chart"
                            subtitle={trendPercentage >= 0 ? "Increasing" : "Decreasing"}
                            theme={theme}
                            content={
                                <TrendSparkline data={sparklineData} color={trendPercentage <= 0 ? Colors.dashboard.cyan : Colors.expense} width={130} />
                            }
                            legend={trendPercentage >= 0
                                ? { name: "Increasing", color: Colors.expense }
                                : { name: "Decreasing", color: Colors.dashboard.cyan }
                            }
                        />
                        <InsightCard
                            title="Spending"
                            color="#2B1A10"
                            value={`$${monthlyOutflow.toLocaleString()}`}
                            icon="calendar-today"
                            subtitle={`${monthlyTransactions.filter(t => t.type === 'outflow').length} expenses`}
                            theme={theme}
                            content={
                                <SimpleBarChart data={[20, 45, 10, 30, 15, 40]} color={Colors.dashboard.orange} />
                            }
                        />
                    </View>
                    <View style={styles.col}>
                        <InsightCard
                            title="Top Spending"
                            color="#2A1B3D"
                            value={`$${(topCategory?.amount || 0).toLocaleString()}`}
                            icon="pie-chart"
                            theme={theme}
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
