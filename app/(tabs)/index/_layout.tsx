import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFinanceStore } from '@/store/financeStore';
import { addMonths, differenceInDays, format, isSameMonth, lastDayOfMonth } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';

export default function HomeLayout() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = 'dark'; // Force dark theme for the header to match the black background
    const { selectedDate, setSelectedDate } = useFinanceStore();

    const nextMonth = () => {
        const next = addMonths(selectedDate, 1);
        setSelectedDate(next);
    };

    const prevMonth = () => {
        const prev = addMonths(selectedDate, -1);
        setSelectedDate(prev);
    };

    // Use runOnJS(true) to avoid native crashes during state updates
    const flingLeft = Gesture.Fling()
        .direction(Directions.LEFT)
        .runOnJS(true)
        .onEnd(() => {
            nextMonth();
        });

    const flingRight = Gesture.Fling()
        .direction(Directions.RIGHT)
        .runOnJS(true)
        .onEnd(() => {
            prevMonth();
        });

    // Race ensures only one gesture wins (avoiding conflicting updates)
    const combinedGesture = Gesture.Race(flingLeft, flingRight);

    const getDaysRemainingText = () => {
        const now = new Date();
        if (isSameMonth(selectedDate, now)) {
            const end = lastDayOfMonth(now);
            const diff = differenceInDays(end, now);
            return `${diff} days remaining`;
        } else {
            return format(selectedDate, 'MMM yyyy'); // Slightly shorter for header
        }
    };

    return (
        <GestureDetector gesture={combinedGesture}>
            <View style={{ flex: 1 }}>
                <Stack
                    screenOptions={{
                        headerShown: true,
                        headerTransparent: true,
                        headerTitle: "",
                        headerLeft: () => (
                            <View style={styles.headerLeftContainer}>
                                <Text style={[styles.monthText, { color: Colors[theme].text }]}>
                                    {format(selectedDate, 'MMMM yyyy')}
                                </Text>
                                <Text style={[styles.daysRemaining, { color: Colors[theme].text }]}>
                                    {getDaysRemainingText()}
                                </Text>
                            </View>
                        ),
                        headerRight: () => (
                            <View style={styles.headerRightContainer}>
                                <Pressable
                                    onPress={() => router.push('/add-transaction')}
                                    style={({ pressed }) => [
                                        styles.addButton,
                                        { opacity: pressed ? 0.7 : 1 }
                                    ]}
                                >
                                    <IconSymbol name="plus" size={24} color={Colors[theme].text} />
                                </Pressable>
                            </View>
                        ),
                        presentation: 'card'
                    }}
                />
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    headerLeftContainer: {
        marginLeft: 16,
        marginRight: 16,
        marginTop: 0,
        marginBottom: 0,
        paddingBottom: 4,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    monthText: {
        fontSize: 17,
        fontWeight: '800',
    },
    daysRemaining: {
        fontSize: 12,
        marginTop: 2,
        fontWeight: '600',
        opacity: 0.6,
    },
    headerRightContainer: {
        width: 20,
        height: 20,
        borderRadius: 50,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: 'transparent',
                marginHorizontal: 8,
            },
            android: {
                backgroundColor: 'rgba(0,0,0,0.05)',
                marginHorizontal: 8,
            }
        })
    },
    headerIconButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        padding: 8,
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0D93FC',
        borderWidth: 1.5,
        borderColor: '#000',
    }
});
