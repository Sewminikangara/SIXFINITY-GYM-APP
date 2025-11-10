import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, CheckboxCard, ProgressIndicator, RadioCard, Screen } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography, shadows } from '@/theme';

const schema = z.object({
    workoutEnvironment: z.enum(['gym', 'home', 'outdoor']),
    workoutTypes: z.array(z.string()).max(2, 'Select up to 2 workout types'),
    equipmentAccess: z.enum(['full_gym', 'basic_equipment', 'bodyweight_only']),
    sessionDuration: z.enum(['15_30_min', '30_45_min', '45_60_min']),
    weeklyWorkoutDays: z.enum(['1_2_days', '3_4_days', '5_plus_days']),
});

type FormData = {
    workoutEnvironment: 'gym' | 'home' | 'outdoor';
    workoutTypes: string[];
    equipmentAccess: 'full_gym' | 'basic_equipment' | 'bodyweight_only';
    sessionDuration: '15_30_min' | '30_45_min' | '45_60_min';
    weeklyWorkoutDays: '1_2_days' | '3_4_days' | '5_plus_days';
};

type WorkoutPreferencesNavigation = NativeStackNavigationProp<
    OnboardingStackParamList,
    'WorkoutPreferences'
>;
type WorkoutPreferencesRoute = RouteProp<OnboardingStackParamList, 'WorkoutPreferences'>;

export const WorkoutPreferencesScreen = () => {
    const navigation = useNavigation<WorkoutPreferencesNavigation>();
    const route = useRoute<WorkoutPreferencesRoute>();

    const previousData = route.params?.profile || {};

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        defaultValues: {
            workoutEnvironment: previousData.workoutEnvironment || undefined,
            workoutTypes: previousData.workoutTypes || [],
            equipmentAccess: previousData.equipmentAccess || undefined,
            sessionDuration: previousData.sessionDuration || undefined,
            weeklyWorkoutDays: previousData.weeklyWorkoutDays || undefined,
        },
        resolver: zodResolver(schema),
    });

    const selectedTypes = watch('workoutTypes');

    const environments = [
        { value: 'gym' as const, label: 'Gym', description: 'Access to gym facility', emoji: '' },
        { value: 'home' as const, label: 'Home', description: 'Home workouts', emoji: '' },
        { value: 'outdoor' as const, label: 'Outdoor', description: 'Parks, trails, streets', emoji: '' },
    ];

    const workoutTypeOptions = [
        { value: 'strength_training', label: 'Strength Training', emoji: '' },
        { value: 'cardio', label: 'Cardio', emoji: '' },
        { value: 'hiit', label: 'HIIT', emoji: '' },
        { value: 'yoga', label: 'Yoga', emoji: '' },
        { value: 'pilates', label: 'Pilates', emoji: '' },
        { value: 'sports', label: 'Sports', emoji: '' },
    ];

    const equipment = [
        {
            value: 'full_gym' as const,
            label: 'Full Gym',
            description: 'Machines, weights, cardio equipment',
            emoji: '',
        },
        {
            value: 'basic_equipment' as const,
            label: 'Basic Equipment',
            description: 'Dumbbells, resistance bands',
            emoji: '',
        },
        {
            value: 'bodyweight_only' as const,
            label: 'Bodyweight Only',
            description: 'No equipment needed',
            emoji: '',
        },
    ];

    const durations = [
        { value: '15_30_min' as const, label: '15-30 min', description: 'Quick sessions', emoji: '' },
        { value: '30_45_min' as const, label: '30-45 min', description: 'Standard sessions', emoji: '' },
        { value: '45_60_min' as const, label: '45-60 min', description: 'Extended sessions', emoji: '' },
    ];

    const frequencies = [
        { value: '1_2_days' as const, label: '1-2 Days', description: 'Getting started', emoji: '' },
        { value: '3_4_days' as const, label: '3-4 Days', description: 'Consistent routine', emoji: '' },
        { value: '5_plus_days' as const, label: '5+ Days', description: 'Very active', emoji: '' },
    ];

    const toggleWorkoutType = (onChange: (value: string[]) => void, value: string) => {
        const currentTypes = selectedTypes || [];
        if (currentTypes.includes(value)) {
            onChange(currentTypes.filter((t) => t !== value));
        } else if (currentTypes.length < 2) {
            onChange([...currentTypes, value]);
        }
    };

    const onSubmit = (data: FormData) => {
        navigation.navigate('HealthAssessment', {
            profile: {
                ...previousData,
                workoutEnvironment: data.workoutEnvironment,
                workoutTypes: data.workoutTypes,
                equipmentAccess: data.equipmentAccess,
                sessionDuration: data.sessionDuration,
                weeklyWorkoutDays: data.weeklyWorkoutDays,
            },
        });
    };

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                    {[...Array(9)].map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressDot,
                                index <= 4 && styles.progressDotActive,
                            ]}
                        />
                    ))}
                </View>
            </View>

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
                        <Text style={styles.title}>Workout Preferences </Text>
                        <Text style={styles.subtitle}>How do you like to train?</Text>
                    </View>

                    {/* Workout Environment */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Workout Environment</Text>
                        {errors.workoutEnvironment && (
                            <Text style={styles.errorText}>{errors.workoutEnvironment.message}</Text>
                        )}
                    </View>

                    <Controller
                        control={control}
                        name="workoutEnvironment"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {environments.map((option) => (
                                    <RadioCard
                                        key={option.value}
                                        selected={value === option.value}
                                        onPress={() => onChange(option.value)}
                                        label={option.label}
                                        description={option.description}
                                        emoji={option.emoji}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    {/* Workout Types */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Workout Types</Text>
                        <Text style={styles.sectionHint}>Select up to 2 types you enjoy most</Text>
                        {errors.workoutTypes && <Text style={styles.errorText}>{errors.workoutTypes.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="workoutTypes"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxGroup}>
                                {workoutTypeOptions.map((option) => (
                                    <CheckboxCard
                                        key={option.value}
                                        selected={value?.includes(option.value) || false}
                                        onPress={() => toggleWorkoutType(onChange, option.value)}
                                        label={option.label}
                                        emoji={option.emoji}
                                        disabled={!value?.includes(option.value) && value?.length >= 2}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    {/* Equipment Access */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Equipment Access</Text>
                        {errors.equipmentAccess && (
                            <Text style={styles.errorText}>{errors.equipmentAccess.message}</Text>
                        )}
                    </View>

                    <Controller
                        control={control}
                        name="equipmentAccess"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {equipment.map((option) => (
                                    <RadioCard
                                        key={option.value}
                                        selected={value === option.value}
                                        onPress={() => onChange(option.value)}
                                        label={option.label}
                                        description={option.description}
                                        emoji={option.emoji}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    {/* Session Duration */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Session Duration</Text>
                        <Text style={styles.sectionHint}>How long can you workout per session?</Text>
                        {errors.sessionDuration && (
                            <Text style={styles.errorText}>{errors.sessionDuration.message}</Text>
                        )}
                    </View>

                    <Controller
                        control={control}
                        name="sessionDuration"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {durations.map((option) => (
                                    <RadioCard
                                        key={option.value}
                                        selected={value === option.value}
                                        onPress={() => onChange(option.value)}
                                        label={option.label}
                                        description={option.description}
                                        emoji={option.emoji}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    {/* Weekly Frequency */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Weekly Frequency</Text>
                        <Text style={styles.sectionHint}>How many days per week can you commit?</Text>
                        {errors.weeklyWorkoutDays && (
                            <Text style={styles.errorText}>{errors.weeklyWorkoutDays.message}</Text>
                        )}
                    </View>

                    <Controller
                        control={control}
                        name="weeklyWorkoutDays"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {frequencies.map((option) => (
                                    <RadioCard
                                        key={option.value}
                                        selected={value === option.value}
                                        onPress={() => onChange(option.value)}
                                        label={option.label}
                                        description={option.description}
                                        emoji={option.emoji}
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
    progressBarContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? spacing.xxxl + 20 : spacing.xl,
        paddingBottom: spacing.md,
    },
    progressBar: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
    },
    progressDot: {
        flex: 1,
        height: 4,
        backgroundColor: palette.border,
        borderRadius: 2,
    },
    progressDotActive: {
        backgroundColor: palette.neonGreen,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
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
        fontSize: 32,
        color: palette.textPrimary,
        fontWeight: '800',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 16,
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
    checkboxGroup: {
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
