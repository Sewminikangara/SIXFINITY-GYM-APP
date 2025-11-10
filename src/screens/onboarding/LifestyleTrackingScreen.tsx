import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, ProgressIndicator, RadioCard, Screen } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography, shadows } from '@/theme';

const schema = z.object({
    sleepHours: z.enum(['less_5', '5_7', '7_9', '9_plus']),
    stressLevel: z.enum(['low', 'moderate', 'high']),
    smokesOrDrinks: z.boolean(),
});

type FormData = {
    sleepHours: 'less_5' | '5_7' | '7_9' | '9_plus';
    stressLevel: 'low' | 'moderate' | 'high';
    smokesOrDrinks: boolean;
};

type LifestyleTrackingNavigation = NativeStackNavigationProp<
    OnboardingStackParamList,
    'LifestyleTracking'
>;
type LifestyleTrackingRoute = RouteProp<OnboardingStackParamList, 'LifestyleTracking'>;

export const LifestyleTrackingScreen = () => {
    const navigation = useNavigation<LifestyleTrackingNavigation>();
    const route = useRoute<LifestyleTrackingRoute>();

    const previousData = route.params?.profile || {};

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            sleepHours: previousData.sleepHours || undefined,
            stressLevel: previousData.stressLevel || undefined,
            smokesOrDrinks: previousData.smokesOrDrinks || false,
        },
        resolver: zodResolver(schema),
    });

    const sleepOptions = [
        { value: 'less_5' as const, label: 'Less than 5 hours', emoji: '' },
        { value: '5_7' as const, label: '5-7 hours', emoji: '' },
        { value: '7_9' as const, label: '7-9 hours', emoji: '' },
        { value: '9_plus' as const, label: '9+ hours', emoji: '' },
    ];

    const stressOptions = [
        {
            value: 'low' as const,
            label: 'Low Stress',
            description: 'Generally relaxed and calm',
            emoji: '',
        },
        {
            value: 'moderate' as const,
            label: 'Moderate Stress',
            description: 'Some stress but manageable',
            emoji: '',
        },
        {
            value: 'high' as const,
            label: 'High Stress',
            description: 'Frequently stressed or anxious',
            emoji: '',
        },
    ];

    const smokeDrinkOptions = [
        { value: true, label: 'Yes', emoji: '' },
        { value: false, label: 'No', emoji: '' },
    ];

    const onSubmit = (data: FormData) => {
        navigation.navigate('OnboardingSummary', {
            profile: {
                ...previousData,
                sleepHours: data.sleepHours,
                stressLevel: data.stressLevel,
                smokesOrDrinks: data.smokesOrDrinks,
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
                                index <= 7 && styles.progressDotActive,
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
                        <Text style={styles.title}>Lifestyle & Tracking</Text>
                        <Text style={styles.subtitle}>Almost done! A few more questions</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Sleep Hours per Night</Text>
                        <Text style={styles.sectionHint}>On average, how much do you sleep?</Text>
                        {errors.sleepHours && <Text style={styles.errorText}>{errors.sleepHours.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="sleepHours"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {sleepOptions.map((option) => (
                                    <RadioCard
                                        key={option.value}
                                        selected={value === option.value}
                                        onPress={() => onChange(option.value)}
                                        label={option.label}
                                        emoji={option.emoji}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Stress Level</Text>
                        <Text style={styles.sectionHint}>How would you describe your typical stress level?</Text>
                        {errors.stressLevel && <Text style={styles.errorText}>{errors.stressLevel.message}</Text>}
                    </View>

                    <Controller
                        control={control}
                        name="stressLevel"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {stressOptions.map((option) => (
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
                        <Text style={styles.sectionLabel}>Smoking or Drinking</Text>
                        <Text style={styles.sectionHint}>Do you smoke or consume alcohol regularly?</Text>
                        {errors.smokesOrDrinks && (
                            <Text style={styles.errorText}>{errors.smokesOrDrinks.message}</Text>
                        )}
                    </View>

                    <Controller
                        control={control}
                        name="smokesOrDrinks"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {smokeDrinkOptions.map((option) => (
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

                    <View style={styles.disclaimer}>
                        <Text style={styles.disclaimerText}>
                            <Text style={styles.disclaimerBold}>Note: </Text>You can later add body photos,
                            measurements, and connect wearables from your profile settings.
                        </Text>
                    </View>
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
                            <Text style={styles.nextButtonText}>Continue to Summary</Text>
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
    disclaimer: {
        marginTop: spacing.lg,
        padding: spacing.md,
        backgroundColor: palette.brandPrimary + '10',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.brandPrimary + '30',
    },
    disclaimerText: {
        ...typography.caption,
        color: palette.textSecondary,
        lineHeight: 20,
    },
    disclaimerBold: {
        fontWeight: '600',
        color: palette.brandPrimary,
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
