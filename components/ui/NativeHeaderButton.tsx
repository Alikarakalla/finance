import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

interface NativeHeaderButtonProps {
    name?: IconSymbolName;
    text?: string;
    onPress: () => void;
    size?: number;
    color?: string;
    weight?: 'light' | 'medium' | 'semibold' | 'bold';
    style?: ViewStyle;
}

export function NativeHeaderButton({
    name,
    text,
    onPress,
    size = 24,
    color,
    weight = 'medium',
    style
}: NativeHeaderButtonProps) {
    const isDark = useColorScheme() === 'dark';
    // Use proper color fallback: prop > dark/light logical default
    const iconColor = color || (isDark ? '#FFFFFF' : '#000000');
    const isText = !!text;

    return (
        <Pressable
            onPress={onPress}
            // HitSlop makes the button easier to tap without making it visually larger
            hitSlop={12}
            style={({ pressed }) => [
                isText ? styles.textBase : styles.iconBase,
                // Native-like feedback for Liquid Glass surfaces
                pressed && styles.pressed,
                style
            ]}
        >
            {isText ? (
                <Text style={[styles.textLabel, { color: iconColor }]}>{text}</Text>
            ) : (
                <IconSymbol
                    name={name!}
                    color={iconColor}
                    size={size}
                    weight={weight}
                />
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    iconBase: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: 'transparent',
                marginHorizontal: 4,
            },
            android: {
                backgroundColor: 'rgba(0,0,0,0.05)',
                marginHorizontal: 8,
            }
        })
    },
    textBase: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                marginHorizontal: 4,
            },
            android: {
                marginHorizontal: 8,
            }
        })
    },
    textLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    pressed: {
        opacity: 0.7,
        ...Platform.select({
            ios: {
                // Creates a "indent" look in the glass material
                transform: [{ scale: 0.96 }],
                backgroundColor: 'rgba(255,255,255,0.1)',
            },
            android: {
                backgroundColor: 'rgba(0,0,0,0.1)',
            }
        })
    }
});
