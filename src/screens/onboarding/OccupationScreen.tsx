import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, ProgressIndicator, RadioCard, Screen, TextField } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography, shadows } from '@/theme';

const schema = z.object({
    occupation: z.string().min(1, 'Occupation is required'),
    occupationCustom: z.string().optional(),
    jobActivityLevel: z.enum(['mostly_sitting', 'some_movement', 'on_foot', 'physically_demanding']),
});

type FormData = {
    occupation: string;
    occupationCustom?: string;
    jobActivityLevel: 'mostly_sitting' | 'some_movement' | 'on_foot' | 'physically_demanding';
};

type OccupationNavigation = NativeStackNavigationProp<OnboardingStackParamList, 'Occupation'>;
type OccupationRoute = RouteProp<OnboardingStackParamList, 'Occupation'>;

export const OccupationScreen = () => {
    const navigation = useNavigation<OccupationNavigation>();
    const route = useRoute<OccupationRoute>();

    const previousData = route.params?.profile || {};

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        defaultValues: {
            occupation: previousData.occupation || '',
            occupationCustom: previousData.occupationCustom || '',
            jobActivityLevel: previousData.jobActivityLevel || undefined,
        },
        resolver: zodResolver(schema),
    });

    const selectedJob = watch('jobActivityLevel');
    const occupation = watch('occupation');

    const occupations = [
        'Student',
        'Office/Desk Job',
        'Teacher',
        'Medical/Health Professional',
        'Service/Field Worker',
        'Fitness Trainer / Athlete',
        'Self-employed / Business Owner',
        'Other',
    ];

    const activityLevels = [
        {
            value: 'mostly_sitting' as const,
            label: 'Mostly Sitting',
            description: 'Desk/computer work',
            emoji: '',
        },
        {
            value: 'some_movement' as const,
            label: 'Some Movement',
            description: 'Occasional walking/standing',
            emoji: '',
        },
        {
            value: 'on_foot' as const,
            label: 'On Foot Most Day',
            description: 'Walking/standing most of the time',
            emoji: '',
        },
        {
            value: 'physically_demanding' as const,
            label: 'Physically Demanding',
            description: 'Lifting, manual labor',
            emoji: '',
        },
    ];

    const onSubmit = (data: FormData) => {
        navigation.navigate('WorkoutPreferences', {
            profile: {
                ...previousData,
                occupation: data.occupation,
                occupationCustom: data.occupation === 'Other' ? data.occupationCustom : undefined,
                jobActivityLevel: data.jobActivityLevel,
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
                                index <= 3 && styles.progressDotActive,
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
                        <Text style={styles.title}>Your Work Life </Text>
                        <Text style={styles.subtitle}>Understanding your routine helps personalize your plan</Text>
                    </View>

                    {/* Occupation Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Occupation</Text>
                    </View>

                    <Controller
                        control={control}
                        name="occupation"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.pickerContainer}>
                                <View style={styles.picker}>
                                    {occupations.map((occ, index) => (
                                        <TouchableOpacity
                                            key={occ}
                                            style={[
                                                styles.occupationOption,
                                                value === occ && styles.occupationSelected,
                                                index === occupations.length - 1 && styles.lastOption,
                                            ]}
                                            onPress={() => onChange(occ)}
                                        >
                                            <Text style={[styles.occupationText, value === occ && styles.occupationTextSelected]}>
                                                {occ}
                                            </Text>
                                            {value === occ && (
                                                <View style={styles.checkMark}>
                                                    <Text style={styles.checkMarkText}>✓</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {errors.occupation && <Text style={styles.errorText}>{errors.occupation.message}</Text>}
                            </View>
                        )}
                    />

                    {occupation === 'Other' && (
                        <Controller
                            control={control}
                            name="occupationCustom"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.customFieldContainer}>
                                    <TextField
                                        label="Specify Occupation"
                                        placeholder="Enter your occupation"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                    />
                                </View>
                            )}
                        />
                    )}

                    {/* Workday Activity Level */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Workday Activity Level</Text>
                        <Text style={styles.sectionHint}>How physically active is your typical workday?</Text>
                        {errors.jobActivityLevel && (
                            <Text style={styles.errorText}>{errors.jobActivityLevel.message}</Text>
                        )}
                    </View>

                    <Controller
                        control={control}
                        name="jobActivityLevel"
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
        marginTop: spacing.md,
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
    pickerContainer: {
        marginBottom: spacing.lg,
    },
    picker: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 16,
        backgroundColor: palette.surface,
        overflow: 'hidden',
    },
    occupationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    lastOption: {
        borderBottomWidth: 0,
    },
    occupationSelected: {
        backgroundColor: palette.neonGreen + '15',
    },
    occupationText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
    },
    occupationTextSelected: {
        color: palette.neonGreen,
        fontWeight: '600',
    },
    checkMark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: palette.neonGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMarkText: {
        color: palette.background,
        fontSize: 14,
        fontWeight: '700',
    },
    customFieldContainer: {
        marginBottom: spacing.lg,
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
