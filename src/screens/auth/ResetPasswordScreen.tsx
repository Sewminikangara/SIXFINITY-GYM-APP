import { useState, useRef, useEffect } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { palette, spacing, typography } from '@/theme';
import { AuthStackParamList } from '@/navigation/types';

const resetPasswordSchema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
type ResetPasswordNavigation = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordRoute = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = () => {
    const navigation = useNavigation<ResetPasswordNavigation>();
    const route = useRoute<ResetPasswordRoute>();
    const { resetPasswordWithOTP } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    const { token, email, phone } = route.params || {};
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async ({ password }: ResetPasswordForm) => {
        if (!token) {
            Alert.alert('Error', 'Verification token is missing.');
            navigation.navigate('ForgotPassword');
            return;
        }

        setSubmitting(true);
        const result = await resetPasswordWithOTP({
            token,
            password,
            email,
            phone,
        });
        setSubmitting(false);

        if (!result.success) {
            Alert.alert('Reset Failed', result.error || 'Unable to reset password. Please try again.');
            return;
        }

        Alert.alert(
            'Password Changed!',
            'Your password has been successfully reset. Please sign in with your new password.',
            [
                {
                    text: 'Sign In',
                    onPress: () => navigation.navigate('SignIn'),
                },
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.decorativeCircle} />

                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.emoji}>🔐</Text>
                        <Text style={styles.title}>Set New Password</Text>
                        <Text style={styles.subtitle}>
                            Choose a strong password to secure your account
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Controller
                            control={control}
                            name="password"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    label="New Password"
                                    placeholder="••••••••"
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    error={errors.password?.message}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="confirmPassword"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    label="Confirm New Password"
                                    placeholder="••••••••"
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    error={errors.confirmPassword?.message}
                                />
                            )}
                        />

                        {/* Password Requirements */}
                        <View style={styles.requirements}>
                            <Text style={styles.requirementsTitle}>Password must contain:</Text>
                            <Text style={styles.requirementItem}>• At least 8 characters</Text>
                            <Text style={styles.requirementItem}>• Mix of letters and numbers recommended</Text>
                        </View>

                        <Button
                            label="Reset Password"
                            onPress={handleSubmit(onSubmit)}
                            loading={submitting}
                        />
                    </View>

                    {/* Footer */}
                    <TouchableOpacity
                        style={styles.backToSignIn}
                        onPress={() => navigation.navigate('SignIn')}
                    >
                        <Text style={styles.backToSignInText}>← Back to Sign In</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxl,
        paddingBottom: spacing.xl,
    },
    decorativeCircle: {
        position: 'absolute',
        top: -100,
        right: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: palette.success,
        opacity: 0.05,
    },
    content: {
        flex: 1,
        gap: spacing.xl,
    },
    header: {
        gap: spacing.sm,
        alignItems: 'center',
    },
    emoji: {
        fontSize: 64,
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.heading1,
        fontSize: 32,
        color: palette.textPrimary,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
    },
    form: {
        gap: spacing.lg,
        marginTop: spacing.md,
    },
    requirements: {
        backgroundColor: palette.surface,
        padding: spacing.md,
        borderRadius: 12,
        gap: spacing.xs,
        marginTop: -spacing.sm,
    },
    requirementsTitle: {
        ...typography.caption,
        color: palette.textPrimary,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    requirementItem: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    backToSignIn: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    backToSignInText: {
        ...typography.body,
        color: palette.brandPrimary,
        fontWeight: '600',
    },
});
