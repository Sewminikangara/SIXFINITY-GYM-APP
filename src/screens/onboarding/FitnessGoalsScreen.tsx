import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, ProgressIndicator, RadioCard, Screen } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography, shadows } from '@/theme';

const { height } = Dimensions.get('window');

const schema = z.object({
    primaryGoal: z.enum([
        'lose_weight',
        'build_muscle',
        'improve_endurance',
        'improve_flexibility',
        'general_fitness',
        'sports_performance',
    ]),
    goalTimeline: z.enum(['1_3_months', '3_6_months', '6_plus_months']),
});

type FormData = {
    primaryGoal: 'lose_weight' | 'build_muscle' | 'improve_endurance' | 'improve_flexibility' | 'general_fitness' | 'sports_performance';
    goalTimeline: '1_3_months' | '3_6_months' | '6_plus_months';
};

type FitnessGoalsNavigation = NativeStackNavigationProp<OnboardingStackParamList, 'FitnessGoals'>;
type FitnessGoalsRoute = RouteProp<OnboardingStackParamList, 'FitnessGoals'>;

export const FitnessGoalsScreen = () => {
    const navigation = useNavigation<FitnessGoalsNavigation>();
    const route = useRoute<FitnessGoalsRoute>();

    const previousData = route.params?.profile || {};

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        defaultValues: {
            primaryGoal: previousData.primaryGoal || undefined,
            goalTimeline: previousData.goalTimeline || undefined,
        },
        resolver: zodResolver(schema),
    });

    const selectedGoal = watch('primaryGoal');

    const goals = [
        {
            value: 'lose_weight' as const,
            label: 'Lose Weight',
            description: 'Reduce body fat and get leaner',
        },
        {
            value: 'build_muscle' as const,
            label: 'Build Muscle',
            description: 'Get stronger and increase muscle mass',
        },
        {
            value: 'improve_endurance' as const,
            label: 'Improve Endurance',
            description: 'Boost stamina and cardio fitness',
        },
        {
            value: 'improve_flexibility' as const,
            label: 'Improve Flexibility',
            description: 'Enhance mobility and range of motion',
        },
        {
            value: 'general_fitness' as const,
            label: 'General Fitness',
            description: 'Overall health and wellness',
        },
        {
            value: 'sports_performance' as const,
            label: 'Sports Performance',
            description: 'Train for athletic excellence',
        },
    ];

    const timelines = [
        { value: '1_3_months' as const, label: '1-3 months', description: 'Short-term goal' },
        { value: '3_6_months' as const, label: '3-6 months', description: 'Medium-term goal' },
        { value: '6_plus_months' as const, label: '6+ months', description: 'Long-term goal' },
    ];

    const onSubmit = (data: FormData) => {
        navigation.navigate('Occupation', {
            profile: {
                ...previousData,
                primaryGoal: data.primaryGoal,
                goalTimeline: data.goalTimeline,
            },
        });
    };

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <View style={styles.backCircle}>
                    <Text style={styles.backIcon}>←</Text>
                </View>
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            Hey, {previousData.fullName || 'there'}
                        </Text>
                        <Text style={styles.subtitle}>What's your main fitness goal?</Text>
                    </View>

                    {/* Primary Goal Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Primary Goal</Text>
                        {errors.primaryGoal && <Text style={styles.errorText}>{errors.primaryGoal.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="primaryGoal"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {goals.map((goal) => (
                                    <RadioCard
                                        key={goal.value}
                                        selected={value === goal.value}
                                        onPress={() => onChange(goal.value)}
                                        label={goal.label}
                                        description={goal.description}
                                        emoji=""
                                    />
                                ))}
                            </View>
                        )}
                    />

                    {/* Timeline Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Timeline</Text>
                        <Text style={styles.sectionHint}>When do you want to achieve your goal?</Text>
                        {errors.goalTimeline && <Text style={styles.errorText}>{errors.goalTimeline.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="goalTimeline"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {timelines.map((timeline) => (
                                    <RadioCard
                                        key={timeline.value}
                                        selected={value === timeline.value}
                                        onPress={() => onChange(timeline.value)}
                                        label={timeline.label}
                                        description={timeline.description}
                                        emoji=""
                                    />
                                ))}
                            </View>
                        )}
                    />
                </ScrollView>

                {/* Next Button */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleSubmit(onSubmit)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[palette.neonGreen, palette.neonGreenDim]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.nextGradient}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingTop: Platform.OS === 'ios' ? spacing.xxxl + 20 : spacing.xl,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    backCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 20,
        color: palette.textPrimary,
    },
    backText: {
        ...typography.body,
        color: palette.textPrimary,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.heading1,
        fontSize: 36,
        color: palette.textPrimary,
        fontWeight: '800',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.heading3,
        fontSize: 18,
        color: palette.textSecondary,
        marginBottom: spacing.sm,
    },
    section: {
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    sectionLabel: {
        ...typography.subtitle,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    sectionHint: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    radioGroup: {
        marginBottom: spacing.md,
    },
    errorText: {
        ...typography.caption,
        color: palette.danger,
        marginTop: 4,
    },
    bottomActions: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    nextButton: {
        borderRadius: 16,
        overflow: 'hidden',
        ...shadows.neonGlow,
    },
    nextGradient: {
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonText: {
        ...typography.subtitle,
        fontSize: 18,
        color: palette.background,
        fontWeight: '700',
    },
});
