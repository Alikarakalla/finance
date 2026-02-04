import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SFSymbol, SymbolView, SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, Platform, StyleProp, TextStyle } from 'react-native';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * An icon component that uses native SF Symbols on iOS, and MaterialIcons on Android and web.
 * This ensures a consistent look on Android and a native look on iOS.
 */
export function IconSymbol({
    name,
    size = 24,
    color,
    style,
    weight = 'medium',
}: {
    name: IconSymbolName;
    size?: number;
    color?: string | OpaqueColorValue;
    style?: StyleProp<TextStyle>;
    weight?: SymbolViewProps['weight'];
}) {
    const isIos = Platform.OS === 'ios';

    if (isIos) {
        // Map to SF Symbols
        const iosIconMap: Record<string, SFSymbol> = {
            'plus': 'plus',
            'chevron-left': 'chevron.left',
            'chevron-right': 'chevron.right',
            'close': 'xmark',
            'check': 'checkmark',
            'settings': 'gearshape.fill', // Apple settings icon
            'search': 'magnifyingglass',
            'menu': 'line.3.horizontal',
            'home': 'house.fill',
            'list': 'list.bullet',
            'camera-alt': 'camera.fill',
            'calendar-today': 'calendar',
            'person': 'person.fill',
            'delete': 'trash.fill',
            'edit': 'pencil',
            'more-vert': 'ellipsis',
            'more-horiz': 'ellipsis',
            'pie-chart': 'chart.pie.fill',
            'bar-chart': 'chart.bar.fill',
            'wallet': 'wallet.pass.fill',
            'add-circle': 'plus.circle.fill',
            'eye': 'eye.fill',
            'notifications': 'bell.fill',
            'minus': 'minus',
            'trending-up': 'chart.line.uptrend.xyaxis',
            'trending-down': 'chart.line.downtrend.xyaxis',
        };
        const symbol = iosIconMap[name] || 'questionmark';
        return <SymbolView name={symbol} size={size} tintColor={color as any} style={style as any} weight={weight} />;
    }

    // Android/Web: Material Icons
    const materialIconMap: Record<string, MaterialIconName> = {
        'plus': 'add',
        'chevron-left': 'chevron-left',
        'chevron-right': 'chevron-right',
        'close': 'close',
        'check': 'check',
        'settings': 'settings',
        'search': 'search',
        'menu': 'menu',
        'home': 'home',
        'list': 'list',
        'camera-alt': 'camera-alt',
        'calendar-today': 'calendar-today',
        'person': 'person',
        'delete': 'delete',
        'edit': 'edit',
        'more-vert': 'more-vert',
        'more-horiz': 'more-horiz',
        'pie-chart': 'pie-chart',
        'bar-chart': 'bar-chart',
        'wallet': 'account-balance-wallet',
        'add-circle': 'add-circle',
        'eye': 'visibility',
        'notifications': 'notifications',
        'minus': 'remove',
        'trending-up': 'trending-up',
        'trending-down': 'trending-down',
    };

    const materialIconName = materialIconMap[name] || 'help-outline';

    return <MaterialIcons color={color} size={size} name={materialIconName} style={style} />;
}

// Common icon names - extend as needed
export type IconSymbolName =
    | 'plus'
    | 'chevron-left'
    | 'chevron-right'
    | 'close'
    | 'check'
    | 'settings'
    | 'search'
    | 'menu'
    | 'home'
    | 'list'
    | 'camera-alt'
    | 'calendar-today'
    | 'person'
    | 'delete'
    | 'edit'
    | 'more-vert'
    | 'more-horiz'
    | 'pie-chart'
    | 'bar-chart'
    | 'wallet'
    | 'add-circle'
    | 'eye'
    | 'notifications'
    | 'minus'
    | 'trending-up'
    | 'trending-down';
