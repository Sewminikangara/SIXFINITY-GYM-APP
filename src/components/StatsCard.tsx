import { StyleSheet, Text, View, Pressable } from 'react-native';
import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography, radii, shadows } from '@/theme';

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    color?: string;
    variant?: 'default' | 'gradient' | 'glass';
    onPress?: () => void;
}

export const StatsCard = ({
    title,
    value,
    subtitle,
    icon,
    color = palette.neonGreen,
    variant = 'glass',
    onPress,
}: StatsCardProps) => {
    const Component = onPress ? Pressable : View;

    if (variant === 'gradient') {
        return (
            <Component
                style={[styles.container, onPress && styles.pressable]}
                onPress={onPress}
            >
                <LinearGradient
                    colors={[palette.cardBackground, palette.surface]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientContent}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        {icon && (
                            <View style={styles.iconContainer}>
                                <Ionicons name={icon} size={20} color={color} />
                            </View>
                        )}
                    </View>

                    <Text style={[styles.value, { color }]}>{value}</Text>

                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </LinearGradient>
            </Component>
        );
    }

    // Glass variant (default premium style)
    return (
        <Component
            style={[styles.container, styles.glassContainer, onPress && styles.pressable]}
            onPress={onPress}
        >
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {icon && (
                    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                        <Ionicons name={icon} size={20} color={color} />
                    </View>
                )}
            </View>

            <Text style={[styles.value, { color }]}>{value}</Text>

            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </Component>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: radii.lg,
        overflow: 'hidden',
    },
    glassContainer: {
        backgroundColor: palette.surfaceGlass,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: palette.borderGlow,
        ...shadows.md,
    },
    gradientContent: {
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: palette.border,
    },
    pressable: {
        opacity: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        ...typography.captionBold,
        color: palette.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: radii.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    value: {
        ...typography.heading1,
        fontSize: 36,
        fontWeight: '800',
        marginBottom: spacing.xs,
        letterSpacing: -1,
    },
    subtitle: {
        ...typography.caption,
        color: palette.textTertiary,
    },
});
