import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, typography, shadows } from '@/theme';

interface GoalCardProps {
    label: string;
    description: string;
    icon: string;
    selected: boolean;
    onPress: () => void;
    stackIndex?: number;
}

export const GoalCard = ({ label, description, icon, selected, onPress, stackIndex = 0 }: GoalCardProps) => {
    const getGradientColors = () => {
        if (selected) {
            return ['#4A90E2', '#357ABD'];
        }
        return ['#2C5F8D', '#1E4A6F'];
    };

    const getStackStyle = () => {
        if (stackIndex === 0) return {};

        return {
            position: 'absolute' as const,
            top: stackIndex * 8,
            left: stackIndex * 12,
            right: -(stackIndex * 12),
            zIndex: -stackIndex,
            opacity: 1 - (stackIndex * 0.3),
        };
    };

    return (
        <TouchableOpacity
            style={[styles.container, selected && styles.containerSelected, getStackStyle()]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={getGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{icon}</Text>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>

                {/* Choose Button */}
                {selected && (
                    <View style={styles.chooseButton}>
                        <View style={styles.chooseButtonInner}>
                            <Text style={styles.chooseButtonText}>Choose</Text>
                        </View>
                    </View>
                )}

                {/* Edit Icon (bottom left) */}
                {selected && (
                    <View style={styles.editIcon}>
                        <Text style={styles.editIconText}>✏️</Text>
                    </View>
                )}

                {/* Background Pattern */}
                <View style={styles.pattern}>
                    <View style={styles.patternCircle1} />
                    <View style={styles.patternCircle2} />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 280,
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: spacing.xl,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    containerSelected: {
        borderColor: palette.neonGreen,
        ...shadows.neonGlow,
    },
    gradient: {
        flex: 1,
        padding: spacing.xl,
        justifyContent: 'space-between',
    },
    iconContainer: {
        alignSelf: 'center',
        marginTop: spacing.md,
    },
    icon: {
        fontSize: 64,
    },
    content: {
        alignItems: 'center',
        zIndex: 1,
    },
    label: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 28,
        fontWeight: '700',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    description: {
        ...typography.body,
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 14,
        textAlign: 'center',
    },
    chooseButton: {
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    chooseButtonInner: {
        backgroundColor: '#FFD700',
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.xxl + spacing.lg,
        borderRadius: 20,
    },
    chooseButtonText: {
        ...typography.subtitle,
        color: '#1E4A6F',
        fontWeight: '700',
        fontSize: 16,
    },
    editIcon: {
        position: 'absolute',
        bottom: spacing.lg,
        left: spacing.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconText: {
        fontSize: 20,
    },
    pattern: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    patternCircle1: {
        position: 'absolute',
        top: -50,
        right: -30,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    patternCircle2: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
});
