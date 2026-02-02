import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

interface LiquidGlassButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    style?: ViewStyle;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    style,
    disabled = false,
    icon,
}) => {
    const getGradientColors = () => {
        switch (variant) {
            case 'primary':
                return ['#007AFF', '#5856D6'] as const;
            case 'danger':
                return ['#FF3B30', '#FF2D55'] as const;
            case 'ghost':
                return ['transparent', 'transparent'] as const;
            default:
                return ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as const;
        }
    };

    const colors = getGradientColors();
    const isSolid = variant === 'primary' || variant === 'danger';

    const Content = (
        <View style={styles.buttonContent}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
                style={[
                    styles.buttonText,
                    variant === 'secondary' || variant === 'ghost' ? styles.secondaryText : styles.primaryText,
                    disabled && styles.disabledText,
                ]}
            >
                {title}
            </Text>
        </View>
    );

    if (isSolid) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled}
                style={[styles.container, style, disabled && styles.disabled]}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                >
                    {Content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[styles.container, style]}
            activeOpacity={0.7}
        >
            <BlurView intensity={40} tint="light" style={styles.glassButton}>
                {Content}
            </BlurView>
        </TouchableOpacity>
    );
};

interface LiquidGlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    variant?: 'default' | 'highlight' | 'dark';
    intensity?: number;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
    children,
    style,
    onPress,
    variant = 'default',
    intensity = 70,
}) => {
    const CardWrapper = onPress ? TouchableOpacity : View;

    const getTint = () => {
        switch (variant) {
            case 'dark': return 'dark';
            case 'highlight': return 'default';
            default: return 'systemMaterial';
        }
    };

    return (
        <CardWrapper
            onPress={onPress}
            style={[styles.cardShadow, style]}
            activeOpacity={onPress ? 0.9 : 1}
        >
            <View style={styles.cardBorder}>
                {variant === 'highlight' ? (
                    <LinearGradient
                        colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
                        style={styles.cardGradient}
                    >
                        {children}
                    </LinearGradient>
                ) : (
                    <BlurView intensity={intensity} tint={getTint() as any} style={styles.glassCard}>
                        {children}
                    </BlurView>
                )}
            </View>
        </CardWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    gradientButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glassButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: 8,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    primaryText: {
        color: '#fff',
    },
    secondaryText: {
        color: '#000',
    },
    disabled: {
        opacity: 0.5,
    },
    disabledText: {
        color: 'rgba(255,255,255,0.6)',
    },
    cardShadow: {
        borderRadius: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
                backgroundColor: 'white',
            },
        }),
    },
    cardBorder: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: Platform.OS === 'android' ? '#fff' : 'transparent',
    },
    glassCard: {
        padding: 20,
        borderRadius: 24,
    },
    cardGradient: {
        padding: 20,
        borderRadius: 24,
    },
});
