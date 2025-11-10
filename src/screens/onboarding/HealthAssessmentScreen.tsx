import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, CheckboxCard, ProgressIndicator, RadioCard, Screen, TextField } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography, shadows } from '@/theme';

const schema = z.object({
    activityLevel: z.enum(['sedentary', 'lightly_active', 'very_active']),
    medicalConditions: z.array(z.string()).optional(),
    medicalConditionsOther: z.string().optional(),
    currentSymptoms: z.array(z.string()).optional(),
    pastInjuries: z.boolean(),
    injuryDetails: z.string().optional(),
});

type FormData = {
    activityLevel: 'sedentary' | 'lightly_active' | 'very_active';
    medicalConditions?: string[];
    medicalConditionsOther?: string;
    currentSymptoms?: string[];
    pastInjuries: boolean;
    injuryDetails?: string;
};

type HealthAssessmentNavigation = NativeStackNavigationProp<
    OnboardingStackParamList,
    'HealthAssessment'
>;
type HealthAssessmentRoute = RouteProp<OnboardingStackParamList, 'HealthAssessment'>;

export const HealthAssessmentScreen = () => {
    const navigation = useNavigation<HealthAssessmentNavigation>();
    const route = useRoute<HealthAssessmentRoute>();

    const previousData = route.params?.profile || {};

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        defaultValues: {
            activityLevel: previousData.activityLevel || undefined,
            medicalConditions: previousData.medicalConditions || [],
            medicalConditionsOther: previousData.medicalConditionsOther || '',
            currentSymptoms: previousData.currentSymptoms || [],
            pastInjuries: previousData.pastInjuries || false,
            injuryDetails: previousData.injuryDetails || '',
        },
        resolver: zodResolver(schema),
    });

    const activityLevels = [
        {
            value: 'sedentary' as const,
            label: 'Sedentary',
            description: 'Little to no regular exercise',
            emoji: '',
        },
        {
            value: 'lightly_active' as const,
            label: 'Lightly Active',
            description: 'Exercise 1-3 days/week',
            emoji: '',
        },
        {
            value: 'very_active' as const,
            label: 'Very Active',
            description: 'Exercise 4+ days/week',
            emoji: '',
        },
    ];

    const conditions = [
        { value: 'diabetes', label: 'Diabetes', emoji: '' },
        { value: 'hypertension', label: 'Hypertension', emoji: '' },
        { value: 'asthma', label: 'Asthma', emoji: '' },
        { value: 'arthritis', label: 'Arthritis', emoji: '' },
        { value: 'heart_disease', label: 'Heart Disease', emoji: '' },
        { value: 'other', label: 'Other', emoji: '' },
        { value: 'none', label: 'None', emoji: '' },
    ];

    const symptoms = [
        { value: 'joint_pain', label: 'Joint Pain', emoji: '' },
        { value: 'back_pain', label: 'Back Pain', emoji: '' },
        { value: 'fatigue', label: 'Chronic Fatigue', emoji: '' },
        { value: 'dizziness', label: 'Dizziness', emoji: '' },
        { value: 'shortness_breath', label: 'Shortness of Breath', emoji: '' },
        { value: 'none', label: 'None', emoji: '' },
    ];

    const injuryOptions = [
        { value: true, label: 'Yes', emoji: '' },
        { value: false, label: 'No', emoji: '' },
    ];

    const selectedConditions = watch('medicalConditions');
    const selectedSymptoms = watch('currentSymptoms');
    const hasPastInjuries = watch('pastInjuries');

    const toggleCondition = (onChange: (value: string[]) => void, value: string) => {
        const current = selectedConditions || [];

        // If selecting "None", clear all others
        if (value === 'none') {
            onChange(['none']);
            return;
        }

        // If selecting something else, remove "None"
        const filtered = current.filter((c) => c !== 'none');

        if (current.includes(value)) {
            onChange(filtered.filter((c) => c !== value));
        } else {
            onChange([...filtered, value]);
        }
    };

    const toggleSymptom = (onChange: (value: string[]) => void, value: string) => {
        const current = selectedSymptoms || [];

        // If selecting "None", clear all others
        if (value === 'none') {
            onChange(['none']);
            return;
        }

        // If selecting something else, remove "None"
        const filtered = current.filter((s) => s !== 'none');

        if (current.includes(value)) {
            onChange(filtered.filter((s) => s !== value));
        } else {
            onChange([...filtered, value]);
        }
    };

    const onSubmit = (data: FormData) => {
        navigation.navigate('NutritionPreferences', {
            profile: {
                ...previousData,
                activityLevel: data.activityLevel,
                medicalConditions: data.medicalConditions,
                medicalConditionsOther:
                    data.medicalConditions?.includes('other') ? data.medicalConditionsOther : undefined,
                currentSymptoms: data.currentSymptoms,
                pastInjuries: data.pastInjuries,
                injuryDetails: data.pastInjuries ? data.injuryDetails : undefined,
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
                                index <= 5 && styles.progressDotActive,
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
                        <Text style={styles.title}>Health Assessment</Text>
                        <Text style={styles.subtitle}>Help us design a safe workout plan</Text>
                    </View>

                    {/* Current Activity Level */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Current Activity Level</Text>
                        {errors.activityLevel && <Text style={styles.errorText}>{errors.activityLevel.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="activityLevel"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {activityLevels.map((option) => (
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

                    {/* Medical Conditions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Medical Conditions</Text>
                        <Text style={styles.sectionHint}>Select all that apply (optional)</Text>
                    </View>

                    <Controller
                        control={control}
                        name="medicalConditions"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxGroup}>
                                {conditions.map((option) => (
                                    <CheckboxCard
                                        key={option.value}
                                        selected={value?.includes(option.value) || false}
                                        onPress={() => toggleCondition(onChange, option.value)}
                                        label={option.label}
                                        emoji={option.emoji}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    {selectedConditions?.includes('other') && (
                        <Controller
                            control={control}
                            name="medicalConditionsOther"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    label="Specify Other Conditions"
                                    placeholder="Enter medical conditions"
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                />
                            )}
                        />
                    )}

                    {/* Current Symptoms */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Current Symptoms</Text>
                        <Text style={styles.sectionHint}>Any symptoms affecting your workouts? (optional)</Text>
                    </View>

                    <Controller
                        control={control}
                        name="currentSymptoms"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxGroup}>
                                {symptoms.map((option) => (
                                    <CheckboxCard
                                        key={option.value}
                                        selected={value?.includes(option.value) || false}
                                        onPress={() => toggleSymptom(onChange, option.value)}
                                        label={option.label}
                                        emoji={option.emoji}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    {/* Past Injuries */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Past Injuries</Text>
                        <Text style={styles.sectionHint}>Any previous injuries we should know about?</Text>
                        {errors.pastInjuries && <Text style={styles.errorText}>{errors.pastInjuries.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="pastInjuries"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {injuryOptions.map((option) => (
                                    <RadioCard
                                        key={option.value.toString()}
                                        selected={value === option.value}
                                        onPress={() => onChange(option.value)}
                                        label={option.label}
                                        emoji={option.emoji}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    {hasPastInjuries && (
                        <Controller
                            control={control}
                            name="injuryDetails"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    label="Injury Details"
                                    placeholder="Describe your past injuries"
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                    multiline
                                />
                            )}
                        />
                    )}
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
