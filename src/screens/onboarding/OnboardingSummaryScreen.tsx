import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, ProgressIndicator, Screen } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography } from '@/theme';

type OnboardingSummaryNavigation = NativeStackNavigationProp<
    OnboardingStackParamList,
    'OnboardingSummary'
>;
type OnboardingSummaryRoute = RouteProp<OnboardingStackParamList, 'OnboardingSummary'>; export const OnboardingSummaryScreen = () => {
    const navigation = useNavigation<OnboardingSummaryNavigation>();
    const route = useRoute<OnboardingSummaryRoute>();
    const { completeOnboarding } = useAuth();

    const [loading, setLoading] = useState(false);
    const profile = route.params?.profile || {};

    const handleComplete = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!profile.fullName || !profile.dateOfBirth || !profile.gender) {
                Alert.alert('Error', 'Missing required personal information');
                return;
            }

            if (!profile.heightCm || !profile.weightKg) {
                Alert.alert('Error', 'Missing required body metrics');
                return;
            }

            if (!profile.primaryGoal || !profile.goalTimeline) {
                Alert.alert('Error', 'Missing required fitness goals');
                return;
            }

            // Save all data to database
            await completeOnboarding(profile);

            // Navigation handled by AuthContext (will redirect to app tabs)
        } catch (error) {
            console.error('Onboarding completion error:', error);
            Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>
            <View style={styles.cardContent}>{children}</View>
        </View>
    );

    const DataRow = ({ label, value }: { label: string; value?: string | number | boolean }) => {
        if (!value && value !== 0 && value !== false) return null;

        let displayValue = value;
        if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
        }

        return (
            <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{label}:</Text>
                <Text style={styles.dataValue}>{displayValue}</Text>
            </View>
        );
    };

    const formatGoal = (goal?: string) => {
        if (!goal) return '';
        return goal.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const formatList = (arr?: string[]) => {
        if (!arr || arr.length === 0) return 'None';
        return arr.map(item => formatGoal(item)).join(', ');
    };

    return (
        <Screen>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <ProgressIndicator currentStep={9} totalSteps={9} />

                    <View style={styles.header}>
                        <Text style={styles.emoji}></Text>
                        <Text style={styles.title}>Review your profile</Text>
                        <Text style={styles.subtitle}>Make sure everything looks good before we start</Text>
                    </View>

                    <SectionCard title=" Personal Information">
                        <DataRow label="Full Name" value={profile.fullName} />
                        <DataRow label="Birthday" value={profile.dateOfBirth} />
                        <DataRow label="Gender" value={formatGoal(profile.gender)} />
                    </SectionCard>

                    <SectionCard title=" Body Metrics">
                        <DataRow label="Height" value={`${profile.heightCm} cm`} />
                        <DataRow label="Weight" value={`${profile.weightKg} kg`} />
                        {profile.goalWeightKg && <DataRow label="Goal Weight" value={`${profile.goalWeightKg} kg`} />}
                        <DataRow label="Body Type" value={formatGoal(profile.bodyType)} />
                    </SectionCard>

                    <SectionCard title=" Work & Activity">
                        <DataRow label="Occupation" value={profile.occupation} />
                        {profile.occupationCustom && <DataRow label="Details" value={profile.occupationCustom} />}
                        <DataRow label="Job Activity" value={formatGoal(profile.jobActivityLevel)} />
                    </SectionCard>

                    <SectionCard title=" Fitness Goals">
                        <DataRow label="Primary Goal" value={formatGoal(profile.primaryGoal)} />
                        <DataRow label="Timeline" value={formatGoal(profile.goalTimeline)} />
                    </SectionCard>

                    <SectionCard title=" Workout Preferences">
                        <DataRow label="Environment" value={formatGoal(profile.workoutEnvironment)} />
                        <DataRow label="Workout Types" value={formatList(profile.workoutTypes)} />
                        <DataRow label="Equipment" value={formatGoal(profile.equipmentAccess)} />
                        <DataRow label="Session Duration" value={formatGoal(profile.sessionDuration)} />
                        <DataRow label="Weekly Days" value={formatGoal(profile.weeklyWorkoutDays)} />
                    </SectionCard>

                    <SectionCard title=" Health Assessment">
                        <DataRow label="Activity Level" value={formatGoal(profile.activityLevel)} />
                        <DataRow label="Medical Conditions" value={formatList(profile.medicalConditions)} />
                        {profile.medicalConditionsOther && (
                            <DataRow label="Other Conditions" value={profile.medicalConditionsOther} />
                        )}
                        <DataRow label="Current Symptoms" value={formatList(profile.currentSymptoms)} />
                        <DataRow label="Past Injuries" value={profile.pastInjuries} />
                        {profile.injuryDetails && <DataRow label="Injury Details" value={profile.injuryDetails} />}
                    </SectionCard>

                    <SectionCard title=" Nutrition Preferences">
                        <DataRow label="Dietary Restrictions" value={formatList(profile.dietaryRestrictions)} />
                        {profile.dietaryRestrictionsOther && (
                            <DataRow label="Other Restrictions" value={profile.dietaryRestrictionsOther} />
                        )}
                        <DataRow label="Food Allergies" value={profile.foodAllergies} />
                        {profile.foodAllergyList && <DataRow label="Allergy List" value={profile.foodAllergyList} />}
                        <DataRow label="Meals Per Day" value={formatGoal(profile.mealsPerDay)} />
                        <DataRow label="Meal Budget" value={formatGoal(profile.mealBudget)} />
                        <DataRow label="Cuisine Preference" value={formatGoal(profile.cuisinePreference)} />
                    </SectionCard>

                    <SectionCard title=" Lifestyle">
                        <DataRow label="Sleep Hours" value={formatGoal(profile.sleepHours)} />
                        <DataRow label="Stress Level" value={formatGoal(profile.stressLevel)} />
                        <DataRow label="Smokes/Drinks" value={profile.smokesOrDrinks} />
                    </SectionCard>

                    <View style={styles.disclaimer}>
                        <Text style={styles.disclaimerText}>
                            You are all set! We will use this information to create personalized workout plans, meal
                            suggestions, and track your progress. You can update any of these details later from your
                            profile.
                        </Text>
                    </View>
                </ScrollView>

                <Button
                    label={loading ? 'Saving...' : 'Complete & Start Journey'}
                    onPress={handleComplete}
                    disabled={loading}
                />
                {loading && <ActivityIndicator style={styles.loader} color={palette.brandPrimary} />}
            </KeyboardAvoidingView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.heading1,
        color: palette.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: palette.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
    },
    card: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        marginBottom: spacing.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: palette.brandPrimary + '10',
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    cardTitle: {
        ...typography.subtitle,
        color: palette.textPrimary,
        fontWeight: '600',
    },
    cardContent: {
        padding: spacing.md,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: palette.border + '30',
    },
    dataLabel: {
        ...typography.body,
        color: palette.textSecondary,
        flex: 1,
    },
    dataValue: {
        ...typography.body,
        color: palette.textPrimary,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    disclaimer: {
        marginTop: spacing.md,
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: palette.brandPrimary + '10',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.brandPrimary + '30',
    },
    disclaimerText: {
        ...typography.body,
        color: palette.textSecondary,
        lineHeight: 22,
        textAlign: 'center',
    },
    loader: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
    },
});
