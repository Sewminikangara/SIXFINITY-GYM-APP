import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette, radii, spacing, typography, shadows } from '@/theme';

interface QuickActionButtonProps {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
    label,
    icon,
    onPress,
    variant = 'primary',
    style,
}) => {
    const isPrimary = variant === 'primary';
    const isOutline = variant === 'outline';

    if (isPrimary) {
        return (
            <TouchableOpacity
                style={[styles.container, style]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[palette.neonGreen, palette.neonGreenDim]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradient, styles.primaryGlow]}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name={icon} size={24} color={palette.background} />
                    </View>
                    <Text style={styles.primaryLabel}>{label}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    if (isOutline) {
        return (
            <TouchableOpacity
                style={[styles.container, styles.outlineContainer, style]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={24} color={palette.neonGreen} />
                </View>
                <Text style={styles.outlineLabel}>{label}</Text>
            </TouchableOpacity>
        );
    }

    // Secondary variant
    return (
        <TouchableOpacity
            style={[styles.container, styles.secondaryContainer, style]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.iconContainer, styles.secondaryIcon]}>
                <Ionicons name={icon} size={24} color={palette.textPrimary} />
            </View>
            <Text style={styles.secondaryLabel}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 100,
        borderRadius: radii.lg,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        padding: spacing.md,
        justifyContent: 'space-between',
    },
    primaryGlow: {
        ...shadows.neonGlow,
    },
    secondaryContainer: {
        backgroundColor: palette.cardBackground,
        padding: spacing.md,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: palette.border,
    },
    outlineContainer: {
        backgroundColor: 'transparent',
        padding: spacing.md,
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: palette.borderGlow,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: radii.md,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    secondaryIcon: {
        backgroundColor: palette.surface,
    },
    primaryLabel: {
        ...typography.bodyBold,
        color: palette.background,
        fontWeight: '700',
    },
    secondaryLabel: {
        ...typography.bodyBold,
        color: palette.textPrimary,
    },
    outlineLabel: {
        ...typography.bodyBold,
        color: palette.neonGreen,
    },
});
