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
    dietaryRestrictions: z.array(z.string()).optional(),
    dietaryRestrictionsOther: z.string().optional(),
    foodAllergies: z.boolean(),
    foodAllergyList: z.string().optional(),
    mealsPerDay: z.enum(['2_meals', '3_meals', '4_plus_meals']),
    mealBudget: z.enum(['budget_friendly', 'moderate', 'premium']),
    cuisinePreference: z.enum(['any', 'specific_regional', 'international']),
});

type FormData = {
    dietaryRestrictions?: string[];
    dietaryRestrictionsOther?: string;
    foodAllergies: boolean;
    foodAllergyList?: string;
    mealsPerDay: '2_meals' | '3_meals' | '4_plus_meals';
    mealBudget: 'budget_friendly' | 'moderate' | 'premium';
    cuisinePreference: 'any' | 'specific_regional' | 'international';
};

type NutritionPreferencesNavigation = NativeStackNavigationProp<
    OnboardingStackParamList,
    'NutritionPreferences'
>;
type NutritionPreferencesRoute = RouteProp<OnboardingStackParamList, 'NutritionPreferences'>;

export const NutritionPreferencesScreen = () => {
    const navigation = useNavigation<NutritionPreferencesNavigation>();
    const route = useRoute<NutritionPreferencesRoute>();

    const previousData = route.params?.profile || {};

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        defaultValues: {
            dietaryRestrictions: previousData.dietaryRestrictions || [],
            dietaryRestrictionsOther: previousData.dietaryRestrictionsOther || '',
            foodAllergies: previousData.foodAllergies || false,
            foodAllergyList: previousData.foodAllergyList || '',
            mealsPerDay: previousData.mealsPerDay || undefined,
            mealBudget: previousData.mealBudget || undefined,
            cuisinePreference: previousData.cuisinePreference || undefined,
        },
        resolver: zodResolver(schema),
    });

    const restrictions = [
        { value: 'vegetarian', label: 'Vegetarian', emoji: '' },
        { value: 'vegan', label: 'Vegan', emoji: '' },
        { value: 'halal', label: 'Halal', emoji: '' },
        { value: 'gluten_free', label: 'Gluten-Free', emoji: '' },
        { value: 'lactose_free', label: 'Lactose-Free', emoji: '' },
        { value: 'keto', label: 'Keto', emoji: '' },
        { value: 'paleo', label: 'Paleo', emoji: '' },
        { value: 'other', label: 'Other', emoji: '' },
        { value: 'none', label: 'None', emoji: '' },
    ];

    const allergyOptions = [
        { value: true, label: 'Yes', emoji: '' },
        { value: false, label: 'No', emoji: '' },
    ];

    const mealFrequencies = [
        { value: '2_meals' as const, label: '2 Meals', description: 'Breakfast & Dinner', emoji: '' },
        { value: '3_meals' as const, label: '3 Meals', description: 'Standard 3 meals', emoji: '' },
        {
            value: '4_plus_meals' as const,
            label: '4+ Meals',
            description: 'Multiple small meals',
            emoji: '',
        },
    ];

    const budgets = [
        {
            value: 'budget_friendly' as const,
            label: 'Budget-Friendly',
            description: 'Cost-effective options',
            emoji: '',
        },
        {
            value: 'moderate' as const,
            label: 'Moderate',
            description: 'Balanced quality & cost',
            emoji: '',
        },
        {
            value: 'premium' as const,
            label: 'Premium',
            description: 'High-quality ingredients',
            emoji: '',
        },
    ];

    const cuisines = [
        {
            value: 'any' as const,
            label: 'Any Cuisine',
            description: 'Open to all options',
            emoji: '',
        },
        {
            value: 'specific_regional' as const,
            label: 'Regional Favorites',
            description: 'Local/regional dishes',
            emoji: '',
        },
        {
            value: 'international' as const,
            label: 'International Variety',
            description: 'Global cuisine mix',
            emoji: '',
        },
    ];

    const selectedRestrictions = watch('dietaryRestrictions');
    const hasFoodAllergies = watch('foodAllergies');

    const toggleRestriction = (onChange: (value: string[]) => void, value: string) => {
        const current = selectedRestrictions || [];

        // If selecting "None", clear all others
        if (value === 'none') {
            onChange(['none']);
            return;
        }

        // If selecting something else, remove "None"
        const filtered = current.filter((r) => r !== 'none');

        if (current.includes(value)) {
            onChange(filtered.filter((r) => r !== value));
        } else {
            onChange([...filtered, value]);
        }
    };

    const onSubmit = (data: FormData) => {
        navigation.navigate('LifestyleTracking', {
            profile: {
                ...previousData,
                dietaryRestrictions: data.dietaryRestrictions,
                dietaryRestrictionsOther:
                    data.dietaryRestrictions?.includes('other') ? data.dietaryRestrictionsOther : undefined,
                foodAllergies: data.foodAllergies,
                foodAllergyList: data.foodAllergies ? data.foodAllergyList : undefined,
                mealsPerDay: data.mealsPerDay,
                mealBudget: data.mealBudget,
                cuisinePreference: data.cuisinePreference,
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
                                index <= 6 && styles.progressDotActive,
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
                        <Text style={styles.title}>Nutrition Preferences</Text>
                        <Text style={styles.subtitle}>Let's plan your meals</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Dietary Restrictions</Text>
                        <Text style={styles.sectionHint}>Select all that apply (optional)</Text>
                    </View>

                    <Controller
                        control={control}
                        name="dietaryRestrictions"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxGroup}>
                                {restrictions.map((option) => (
                                    <CheckboxCard
                                        key={option.value}
                                        selected={value?.includes(option.value) || false}
                                        onPress={() => toggleRestriction(onChange, option.value)}
                                        label={option.label}
                                        emoji={option.emoji}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    {selectedRestrictions?.includes('other') && (
                        <Controller
                            control={control}
                            name="dietaryRestrictionsOther"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    label="Specify Other Restrictions"
                                    placeholder="Enter dietary restrictions"
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                />
                            )}
                        />
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Food Allergies</Text>
                        <Text style={styles.sectionHint}>Do you have any food allergies?</Text>
                        {errors.foodAllergies && <Text style={styles.errorText}>{errors.foodAllergies.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="foodAllergies"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {allergyOptions.map((option) => (
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

                    {hasFoodAllergies && (
                        <Controller
                            control={control}
                            name="foodAllergyList"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    label="List Your Allergies"
                                    placeholder="e.g., Nuts, Shellfish, Soy"
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                />
                            )}
                        />
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Meals Per Day</Text>
                        {errors.mealsPerDay && <Text style={styles.errorText}>{errors.mealsPerDay.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="mealsPerDay"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {mealFrequencies.map((option) => (
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

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Meal Budget</Text>
                        {errors.mealBudget && <Text style={styles.errorText}>{errors.mealBudget.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="mealBudget"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {budgets.map((option) => (
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

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Cuisine Preference</Text>
                        {errors.cuisinePreference && (
                            <Text style={styles.errorText}>{errors.cuisinePreference.message}</Text>
                        )}
                    </View>

                    <Controller
                        control={control}
                        name="cuisinePreference"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {cuisines.map((option) => (
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

                {/* Bottom Actions */}
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
