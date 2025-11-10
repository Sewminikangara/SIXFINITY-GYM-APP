import { ActivityIndicator, Pressable, PressableProps, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { palette, radii, spacing, typography } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface Props extends PressableProps {
    label: string;
    variant?: ButtonVariant;
    loading?: boolean;
}

const variantStyles: Record<ButtonVariant, { backgroundColor: string; color: string }> = {
    primary: {
        backgroundColor: palette.brandPrimary,
        color: palette.background,
    },
    secondary: {
        backgroundColor: palette.surface,
        color: palette.textPrimary,
    },
    ghost: {
        backgroundColor: 'transparent',
        color: palette.textSecondary,
    },
};

export const Button = ({ label, variant = 'primary', loading = false, style, ...pressableProps }: Props) => {
    const { backgroundColor, color } = variantStyles[variant];

    return (
        <Pressable
            style={({ pressed }) => [
                styles.base,
                { backgroundColor, opacity: pressed ? 0.85 : 1 },
                style as StyleProp<ViewStyle>,
            ]}
            disabled={loading || pressableProps.disabled}
            {...pressableProps}
        >
            {loading ? <ActivityIndicator color={color} /> : <Text style={[styles.label, { color }]}>{label}</Text>}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        ...typography.subtitle,
    },
});
