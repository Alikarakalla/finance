import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useFinanceStore } from '@/store/financeStore';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Welcome to\nFinance Manager',
        description: 'Master your money in minutes. Let’s learn how to track, budget, and organize your finances.',
        icon: 'wallet',
        color: '#4A90E2'
    },
    {
        id: '2',
        title: 'Add Transactions',
        description: 'Tap the "+" button on the Home screen. Enter the amount, pick a category, and save. It takes seconds!',
        icon: 'plus.circle.fill',
        color: '#9C27B0'
    },
    {
        id: '3',
        title: 'Set Budgets',
        description: 'Go to the Budget tab. Set monthly limits for Food, Transport, and more to never overspend again.',
        icon: 'chart.pie.fill',
        color: '#FF9800'
    },
    {
        id: '4',
        title: 'Smart Categories',
        description: 'Organize expenses by category. Customize them in Settings to fit your unique lifestyle.',
        icon: 'tag.fill',
        color: '#00BCD4'
    },
    {
        id: '5',
        title: 'Ready to Go!',
        description: 'You are all set. Start tracking your first expense now and take control of your future.',
        icon: 'checkmark.circle.fill',
        color: '#4CAF50'
    }
];

const RenderItem = ({ item, index, x }: { item: typeof SLIDES[0], index: number, x: SharedValue<number> }) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            x.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0, 1, 0],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            x.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0.5, 1, 0.5],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [{ scale }]
        };
    });

    return (
        <View style={[styles.slide, { width }]}>
            <Animated.View style={[styles.iconContainer, { backgroundColor: item.color }, animatedStyle]}>
                {/* @ts-ignore */}
                <IconSymbol name={item.icon} size={80} color="white" />
            </Animated.View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: Colors[theme].text }]}>{item.title}</Text>
                <Text style={[styles.description, { color: Colors[theme].gray }]}>{item.description}</Text>
            </View>
        </View>
    );
};

const Pagination = ({ data, x, theme }: { data: typeof SLIDES, x: SharedValue<number>, theme: 'light' | 'dark' }) => {
    return (
        <View style={styles.paginationContainer}>
            {data.map((_, index) => {
                const animatedDotStyle = useAnimatedStyle(() => {
                    const widthAnim = interpolate(
                        x.value,
                        [(index - 1) * width, index * width, (index + 1) * width],
                        [8, 20, 8],
                        Extrapolation.CLAMP
                    );
                    const opacity = interpolate(
                        x.value,
                        [(index - 1) * width, index * width, (index + 1) * width],
                        [0.5, 1, 0.5],
                        Extrapolation.CLAMP
                    );
                    return {
                        width: widthAnim,
                        opacity
                    };
                });
                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            { backgroundColor: Colors[theme].tint },
                            animatedDotStyle
                        ]}
                    />
                );
            })}
        </View>
    );
};

export default function OnboardingScreen() {
    const router = useRouter();
    const { completeOnboarding } = useFinanceStore();
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const x = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

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

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        completeOnboarding();
        router.replace('/(tabs)' as any);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleComplete}>
                    <Text style={[styles.skipText, { color: Colors[theme].gray }]}>Skip</Text>
                </TouchableOpacity>
            </View>

            <Animated.FlatList
                ref={flatListRef as any}
                data={SLIDES}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <RenderItem item={item} index={index} x={x} />}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            />

            <View style={styles.footer}>
                <Pagination data={SLIDES} x={x} theme={theme} />

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: Colors[theme].tint }]}
                    onPress={handleNext}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'flex-end',
        padding: 20,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        width: width,
        alignItems: 'center',
        paddingHorizontal: 40,
        justifyContent: 'center',
        paddingBottom: 100, // Lift content up a bit
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 40,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    paginationContainer: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    footer: {
        padding: 20,
        paddingBottom: 50,
        alignItems: 'center',
        gap: 30,
    },
    button: {
        paddingVertical: 16,
        paddingHorizontal: 60,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    }
});
