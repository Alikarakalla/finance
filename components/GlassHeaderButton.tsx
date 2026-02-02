import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, ViewStyle } from 'react-native';

interface IconSymbolProps {
    name: string;
    size?: number;
    color?: string;
    weight?: 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
}

function IconSymbol({ name, size = 24, color = '#000', weight = 'medium' }: IconSymbolProps) {
    const Text = require('react-native').Text;

    const iconMap: Record<string, string> = {
        'chevron.left': '‹',
        'chevron.right': '›',
        'xmark': '×',
        'checkmark': '✓',
        'plus': '+',
        'ellipsis': '⋯',
        'gearshape': '⚙',
        'magnifyingglass': '🔍',
    };

    return (
        <Text style={{ fontSize: size, color, fontWeight: weight === 'medium' ? '600' : '400' }}>
            {iconMap[name] || '?'}
        </Text>
    );
}

interface GlassHeaderButtonProps {
    sfSymbol?: string;
    onPress?: () => void;
    color?: string;
    size?: number;
    weight?: 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
    position?: 'left' | 'right' | 'center';
    style?: ViewStyle;
}

export function GlassHeaderButton({
    sfSymbol = 'chevron.left',
    onPress,
    color = '#000',
    size = 24,
    weight = 'medium',
    position = 'left',
    style,
}: GlassHeaderButtonProps) {
    const router = useRouter();

    const handlePress = onPress || (() => router.back());

    return (
        <Pressable
            onPress={handlePress}
            style={[styles.nativeGlassWrapper, style]}
        >
            <IconSymbol
                name={sfSymbol}
                size={size}
                color={color}
                weight={weight}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    nativeGlassWrapper: {
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
});
