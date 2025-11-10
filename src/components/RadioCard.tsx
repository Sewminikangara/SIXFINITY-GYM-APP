import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette, spacing, typography } from '@/theme';

interface RadioCardProps {
    selected: boolean;
    onPress: () => void;
    label: string;
    emoji?: string;
    description?: string;
}

export const RadioCard = ({ selected, onPress, label, emoji, description }: RadioCardProps) => {
    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {emoji && <Text style={styles.emoji}>{emoji}</Text>}
            <View style={styles.content}>
                <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
                {description && <Text style={styles.description}>{description}</Text>}
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
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
    emoji: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    content: {
        flex: 1,
    },
    label: {
        ...typography.subtitle,
        color: palette.textPrimary,
    },
    labelSelected: {
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    description: {
        ...typography.caption,
        color: palette.textSecondary,
        marginTop: 4,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: palette.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: palette.brandPrimary,
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: palette.brandPrimary,
    },
});
