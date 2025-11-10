import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, ProgressIndicator, RadioCard, Screen, TextField } from '@/components';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography, shadows } from '@/theme';

const { height } = Dimensions.get('window');

const schema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    dateOfBirth: z.string().min(1, 'Birthday is required'),
    gender: z.enum(['male', 'female']),
});

type FormData = {
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
};

type PersonalInfoNavigation = NativeStackNavigationProp<OnboardingStackParamList, 'PersonalInfo'>;
type PersonalInfoRoute = RouteProp<OnboardingStackParamList, 'PersonalInfo'>;

export const PersonalInfoScreen = () => {
    const navigation = useNavigation<PersonalInfoNavigation>();
    const route = useRoute<PersonalInfoRoute>();

    const previousData = route.params?.profile || {};

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            fullName: previousData.fullName || '',
            dateOfBirth: previousData.dateOfBirth || '',
            gender: (previousData.gender === 'male' || previousData.gender === 'female')
                ? previousData.gender
                : undefined,
        },
        resolver: zodResolver(schema),
    });

    const onSubmit = (data: FormData) => {
        navigation.navigate('BodyMetrics', {
            profile: {
                ...previousData,
                fullName: data.fullName,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
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
                                index === 0 && styles.progressDotActive,
                            ]}
                        />
                    ))}
                </View>
            </View>

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
                        <Text style={styles.title}>Welcome!</Text>
                        <Text style={styles.subtitle}>First what can we call you</Text>
                    </View>

                    {/* Name Input */}
                    <Controller
                        control={control}
                        name="fullName"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Preferred first name</Text>
                                <View style={styles.textFieldWrapper}>
                                    <TextField
                                        label=""
                                        placeholder="Enter your name"
                                        autoCapitalize="words"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        error={errors.fullName?.message}
                                    />
                                </View>
                            </View>
                        )}
                    />

                    {/* Birthday Input */}
                    <Controller
                        control={control}
                        name="dateOfBirth"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Birthday</Text>
                                <View style={styles.textFieldWrapper}>
                                    <TextField
                                        label=""
                                        placeholder="MM/DD/YYYY"
                                        keyboardType="numeric"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        error={errors.dateOfBirth?.message}
                                    />
                                </View>
                            </View>
                        )}
                    />

                    {/* Gender Selection */}
                    <Controller
                        control={control}
                        name="gender"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Gender</Text>
                                <View style={styles.genderOptions}>
                                    {[
                                        { label: 'Male', value: 'male' },
                                        { label: 'Female', value: 'female' },
                                    ].map((option) => (
                                        <RadioCard
                                            key={option.value}
                                            label={option.label}
                                            selected={value === option.value}
                                            onPress={() => onChange(option.value)}
                                            emoji=""
                                        />
                                    ))}
                                </View>
                                {errors.gender && (
                                    <Text style={styles.errorText}>{errors.gender.message}</Text>
                                )}
                            </View>
                        )}
                    />

                    {/* Artistic Background Image */}
                    <View style={styles.imageContainer}>
                        <ImageBackground
                            source={{ uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop' }}
                            style={styles.backgroundImage}
                            resizeMode="cover"
                        >
                            <LinearGradient
                                colors={['rgba(18, 18, 18, 0)', 'rgba(18, 18, 18, 0.8)', '#121212']}
                                locations={[0, 0.7, 1]}
                                style={styles.imageGradient}
                            />
                        </ImageBackground>
                    </View>
                </ScrollView>

                {/* Bottom Buttons */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <View style={styles.backCircle}>
                            <Text style={styles.backIcon}>←</Text>
                        </View>
                    </TouchableOpacity>

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
        paddingBottom: spacing.lg,
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
    },
    header: {
        marginBottom: spacing.xxl,
    },
    title: {
        ...typography.heading1,
        fontSize: 40,
        color: palette.textPrimary,
        fontWeight: '800',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 18,
    },
    inputContainer: {
        marginBottom: spacing.xl,
    },
    inputLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 14,
        marginBottom: spacing.sm,
    },
    textFieldWrapper: {
        marginBottom: spacing.md,
    },
    imageContainer: {
        flex: 1,
        marginTop: spacing.xxl,
        borderRadius: 24,
        overflow: 'hidden',
        minHeight: height * 0.4,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
    },
    imageGradient: {
        flex: 1,
    },
    bottomActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        gap: spacing.md,
    },
    backButton: {
        width: 56,
        height: 56,
    },
    backCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: palette.surface,
        borderWidth: 1.5,
        borderColor: palette.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: palette.textPrimary,
    },
    nextButton: {
        flex: 1,
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
    genderOptions: {
        gap: spacing.sm,
    },
    errorText: {
        ...typography.caption,
        color: palette.error,
        marginTop: spacing.xs,
    },
});
