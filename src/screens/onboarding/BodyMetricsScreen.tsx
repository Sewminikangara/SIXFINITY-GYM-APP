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

const { height: screenHeight } = Dimensions.get('window');

const schema = z.object({
    height: z.string().min(1, 'Height is required'),
    weight: z.string().min(1, 'Weight is required'),
    goalWeight: z.string().optional(),
    bodyType: z.enum(['lean', 'average', 'muscular', 'curvy', 'plus_size']),
});

type FormData = {
    height: string;
    weight: string;
    goalWeight?: string;
    bodyType: 'lean' | 'average' | 'muscular' | 'curvy' | 'plus_size';
};

type BodyMetricsNavigation = NativeStackNavigationProp<OnboardingStackParamList, 'BodyMetrics'>;
type BodyMetricsRoute = RouteProp<OnboardingStackParamList, 'BodyMetrics'>;

export const BodyMetricsScreen = () => {
    const navigation = useNavigation<BodyMetricsNavigation>();
    const route = useRoute<BodyMetricsRoute>();

    const previousData = route.params?.profile || {};

    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>(previousData.heightUnit || 'cm');
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(previousData.weightUnit || 'kg');

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        defaultValues: {
            height: previousData.heightCm?.toString() || '',
            weight: previousData.weightKg?.toString() || '',
            goalWeight: previousData.goalWeightKg?.toString() || '',
            bodyType: previousData.bodyType || undefined,
        },
        resolver: zodResolver(schema),
    });

    const selectedBodyType = watch('bodyType');

    const bodyTypeOptions = [
        { value: 'lean' as const, label: 'Lean', emoji: '' },
        { value: 'average' as const, label: 'Average', emoji: '' },
        { value: 'muscular' as const, label: 'Muscular', emoji: '' },
        { value: 'curvy' as const, label: 'Curvy', emoji: '' },
        { value: 'plus_size' as const, label: 'Plus-size', emoji: '' },
    ];

    const onSubmit = (data: FormData) => {
        const heightCm = heightUnit === 'cm' ? parseFloat(data.height) : parseFloat(data.height) * 30.48; // ft to cm
        const weightKg = weightUnit === 'kg' ? parseFloat(data.weight) : parseFloat(data.weight) * 0.453592; // lbs to kg
        const goalWeightKg = data.goalWeight
            ? weightUnit === 'kg'
                ? parseFloat(data.goalWeight)
                : parseFloat(data.goalWeight) * 0.453592
            : undefined;

        navigation.navigate('FitnessGoals', {
            profile: {
                ...previousData,
                heightCm,
                heightUnit,
                weightKg,
                weightUnit,
                goalWeightKg,
                bodyType: data.bodyType,
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
                                index <= 1 && styles.progressDotActive,
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
                        <Text style={styles.title}>Body Metrics</Text>
                        <Text style={styles.subtitle}>Help us personalize your plan</Text>
                    </View>

                    {/* Height Input with Toggle */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldHeader}>
                            <Text style={styles.fieldLabel}>Height</Text>
                            <View style={styles.unitToggle}>
                                <TouchableOpacity
                                    style={[styles.unitButton, heightUnit === 'cm' && styles.unitButtonActive]}
                                    onPress={() => setHeightUnit('cm')}
                                >
                                    <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>cm</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.unitButton, heightUnit === 'ft' && styles.unitButtonActive]}
                                    onPress={() => setHeightUnit('ft')}
                                >
                                    <Text style={[styles.unitText, heightUnit === 'ft' && styles.unitTextActive]}>ft</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Controller
                            control={control}
                            name="height"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    label=""
                                    placeholder={heightUnit === 'cm' ? '165' : '5.6'}
                                    keyboardType="decimal-pad"
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                    error={errors.height?.message}
                                />
                            )}
                        />
                    </View>

                    {/* Weight Input with Toggle */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldHeader}>
                            <Text style={styles.fieldLabel}>Current Weight</Text>
                            <View style={styles.unitToggle}>
                                <TouchableOpacity
                                    style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
                                    onPress={() => setWeightUnit('kg')}
                                >
                                    <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
                                    onPress={() => setWeightUnit('lbs')}
                                >
                                    <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Controller
                            control={control}
                            name="weight"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    label=""
                                    placeholder={weightUnit === 'kg' ? '70' : '154'}
                                    keyboardType="decimal-pad"
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                    error={errors.weight?.message}
                                />
                            )}
                        />
                    </View>

                    {/* Goal Weight Input */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Goal Weight (Optional)</Text>
                        <Controller
                            control={control}
                            name="goalWeight"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    label=""
                                    placeholder={weightUnit === 'kg' ? '65' : '143'}
                                    keyboardType="decimal-pad"
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                />
                            )}
                        />
                    </View>

                    {/* Body Type */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Body Type</Text>
                        {errors.bodyType && (
                            <Text style={styles.errorText}>{errors.bodyType.message}</Text>
                        )}
                    </View>

                    <Controller
                        control={control}
                        name="bodyType"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.radioGroup}>
                                {bodyTypeOptions.map((option) => (
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
    fieldContainer: {
        marginBottom: spacing.lg,
    },
    fieldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    fieldLabel: {
        ...typography.subtitle,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    unitToggle: {
        flexDirection: 'row',
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: 3,
        borderWidth: 1,
        borderColor: palette.border,
    },
    unitButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 10,
        minWidth: 48,
        alignItems: 'center',
    },
    unitButtonActive: {
        backgroundColor: palette.neonGreen,
    },
    unitText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    unitTextActive: {
        color: palette.background,
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
