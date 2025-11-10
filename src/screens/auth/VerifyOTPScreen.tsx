import { useState, useRef, useEffect } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Screen } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { palette, spacing, typography } from '@/theme';
import { AuthStackParamList } from '@/navigation/types';

type VerifyOTPNavigation = NativeStackNavigationProp<AuthStackParamList, 'VerifyOTP'>;
type VerifyOTPRoute = RouteProp<AuthStackParamList, 'VerifyOTP'>;

export const VerifyOTPScreen = () => {
    const navigation = useNavigation<VerifyOTPNavigation>();
    const route = useRoute<VerifyOTPRoute>();
    const { verifyOTP, resendOTP } = useAuth();

    const { email, phone, type } = route.params || {};
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [submitting, setSubmitting] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [countdown, setCountdown] = useState(60);

    const inputRefs = useRef<(TextInput | null)[]>([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Auto-focus first input
        inputRefs.current[0]?.focus();

        // Countdown timer
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setResendDisabled(false);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [fadeAnim]);

    const handleOtpChange = (value: string, index: number) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (index === 5 && value) {
            const code = newOtp.join('');
            if (code.length === 6) {
                handleVerify(code);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (code?: string) => {
        const otpCode = code || otp.join('');

        if (otpCode.length !== 6) {
            Alert.alert('Invalid Code', 'Please enter the 6-digit code.');
            return;
        }

        setSubmitting(true);
        const result = await verifyOTP({
            token: otpCode,
            type: type || 'email',
            email,
            phone,
        });
        setSubmitting(false);

        if (!result.success) {
            Alert.alert('Verification Failed', result.error || 'Invalid code. Please try again.');
            // Clear OTP inputs
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            return;
        }

        // Success!
        if (type === 'signup') {
            // User verified, go to onboarding
            Alert.alert('Success!', 'Your account has been verified.');
        } else if (type === 'reset') {
            // Go to reset password screen
            navigation.navigate('ResetPassword', { token: otpCode, email, phone });
        }
    };

    const handleResend = async () => {
        if (resendDisabled) return;

        setResendDisabled(true);
        setCountdown(60);

        // Map the route type to OTP type for Supabase
        const otpType: 'email' | 'sms' = phone ? 'sms' : 'email';
        const result = await resendOTP({ email, phone, type: otpType });

        if (!result.success) {
            Alert.alert('Error', result.error || 'Failed to resend code.');
            setResendDisabled(false);
            return;
        }

        Alert.alert('Code Sent', `A new verification code has been sent to ${phone ? 'your phone' : 'your email'}.`);

        // Restart countdown
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setResendDisabled(false);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const maskedContact = phone
        ? phone.replace(/(\d{2})\d+(\d{4})/, '$1***$2')
        : email?.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Screen>
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backIcon}>←</Text>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.emoji}></Text>
                        <Text style={styles.title}>Enter Verification Code</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit code to{'\n'}
                            <Text style={styles.contact}>{maskedContact}</Text>
                        </Text>
                    </View>

                    {/* OTP Input */}
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.otpInputFilled : null,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                editable={!submitting}
                            />
                        ))}
                    </View>

                    {/* Verify Button */}
                    <Button
                        label="Verify Code"
                        onPress={() => handleVerify()}
                        loading={submitting}
                        disabled={otp.join('').length !== 6}
                    />

                    {/* Resend Code */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive the code?</Text>
                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={resendDisabled}
                        >
                            <Text style={[
                                styles.resendLink,
                                resendDisabled && styles.resendLinkDisabled
                            ]}>
                                {resendDisabled ? `Resend in ${countdown}s` : 'Resend Code'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Change Method */}
                    {phone && email && (
                        <TouchableOpacity
                            style={styles.changeMethod}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.changeMethodText}>
                                Use {phone ? 'email' : 'phone number'} instead
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </Screen>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    content: {
        flex: 1,
        gap: spacing.xl,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        alignSelf: 'flex-start',
        marginBottom: spacing.md,
    },
    backIcon: {
        fontSize: 24,
        color: palette.textPrimary,
    },
    backText: {
        ...typography.body,
        color: palette.textPrimary,
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
        fontSize: 28,
        color: palette.textPrimary,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 16,
        textAlign: 'center',
    },
    contact: {
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
    },
    otpInput: {
        flex: 1,
        height: 60,
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: palette.border,
        fontSize: 24,
        fontWeight: '700',
        color: palette.textPrimary,
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: palette.brandPrimary,
        backgroundColor: palette.brandPrimary + '10',
    },
    resendContainer: {
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.md,
    },
    resendText: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    resendLink: {
        ...typography.caption,
        color: palette.brandPrimary,
        fontWeight: '700',
    },
    resendLinkDisabled: {
        color: palette.textSecondary,
    },
    changeMethod: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    changeMethodText: {
        ...typography.body,
        color: palette.brandSecondary,
        textDecorationLine: 'underline',
    },
});
