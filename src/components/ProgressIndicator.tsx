import { StyleSheet, Text, View } from 'react-native';
import { palette, spacing, typography } from '@/theme';

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.stepText}>
                    Step {currentStep} of {totalSteps}
                </Text>
                <Text style={styles.percentText}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${progress}%` }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    stepText: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    percentText: {
        ...typography.caption,
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    barBackground: {
        height: 4,
        backgroundColor: palette.surface,
        borderRadius: 2,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: palette.brandPrimary,
        borderRadius: 2,
    },
});
