import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette, spacing, typography } from '@/theme';

interface CheckboxCardProps {
    selected: boolean;
    onPress: () => void;
    label: string;
    emoji?: string;
    disabled?: boolean;
}

export const CheckboxCard = ({ selected, onPress, label, emoji, disabled }: CheckboxCardProps) => {
    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected, disabled && styles.cardDisabled]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            {emoji && <Text style={styles.emoji}>{emoji}</Text>}
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.sm,
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardSelected: {
        backgroundColor: palette.brandPrimary + '15',
        borderColor: palette.brandPrimary,
    },
    cardDisabled: {
        opacity: 0.5,
    },
    emoji: {
        fontSize: 28,
        marginRight: spacing.sm,
    },
    label: {
        flex: 1,
        ...typography.body,
        color: palette.textPrimary,
    },
    labelSelected: {
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: palette.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: palette.brandPrimary,
        borderColor: palette.brandPrimary,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
