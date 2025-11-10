import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components';
import { palette, spacing, typography, radii } from '@/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import QRCode from 'react-native-qrcode-svg';

type Props = NativeStackScreenProps<AppStackParamList, 'CheckIn'>;

export const CheckInScreen: React.FC<Props> = ({ route, navigation }) => {
    const { gymId, gymName } = route.params;
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHardware && isEnrolled);
    };

    const getCurrentDate = () => {
        const now = new Date();
        return now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getCurrentTime = () => {
        const now = checkInTime || new Date();
        return now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const generateQRData = () => {
        const data = {
            userId: 'user-123', // Replace with actual user ID
            gymId: gymId,
            timestamp: Date.now(),
            action: isCheckedIn ? 'checkout' : 'checkin',
        };
        return JSON.stringify(data);
    };

    const handleBiometricAuth = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to check in',
                fallbackLabel: 'Use passcode',
                disableDeviceFallback: false,
            });

            if (result.success) {
                return true;
            } else {
                Alert.alert('Authentication Failed', 'Please try again');
                return false;
            }
        } catch (error) {
            console.error('Biometric auth error:', error);
            return false;
        }
    };

    const handleCheckIn = async () => {
        setLoading(true);

        try {
            // Optional biometric authentication
            if (biometricAvailable) {
                const authResult = await handleBiometricAuth();
                if (!authResult) {
                    setLoading(false);
                    return;
                }
            }

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setIsCheckedIn(true);
            setCheckInTime(new Date());
            Alert.alert(
                'Check-in Successful',
                `You've checked in to ${gymName}. Have a great workout!`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to check in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        Alert.alert(
            'Check Out',
            'Are you sure you want to check out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Check Out',
                    onPress: async () => {
                        setLoading(true);

                        try {
                            // Simulate API call
                            await new Promise((resolve) => setTimeout(resolve, 1000));

                            const duration = checkInTime
                                ? Math.floor((Date.now() - checkInTime.getTime()) / 1000 / 60)
                                : 0;

                            Alert.alert(
                                'Check-out Successful',
                                `You worked out for ${duration} minutes. Great job!`,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => navigation.goBack(),
                                    },
                                ]
                            );

                            setIsCheckedIn(false);
                            setCheckInTime(null);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to check out. Please try again.');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const getWorkoutDuration = () => {
        if (!checkInTime) return '0 min';
        const duration = Math.floor((Date.now() - checkInTime.getTime()) / 1000 / 60);
        if (duration < 60) return `${duration} min`;
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}h ${minutes}min`;
    };

    return (
        <Screen>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="fitness" size={60} color="#00FF7F" />
                    <Text style={styles.gymName}>{gymName}</Text>
                    {isCheckedIn && (
                        <View style={styles.checkedInBadge}>
                            <Ionicons name="checkmark-circle" size={20} color="#32D74B" />
                            <Text style={styles.checkedInText}>Checked In</Text>
                        </View>
                    )}
                </View>

                {/* Date and Time */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={24} color="#00FF7F" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Date</Text>
                            <Text style={styles.infoValue}>{getCurrentDate()}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time" size={24} color="#00FF7F" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Time</Text>
                            <Text style={styles.infoValue}>{getCurrentTime()}</Text>
                        </View>
                    </View>

                    {isCheckedIn && (
                        <View style={styles.infoRow}>
                            <Ionicons name="timer" size={24} color="#00FF7F" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Workout Duration</Text>
                                <Text style={styles.infoValue}>{getWorkoutDuration()}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                    <Text style={styles.qrLabel}>
                        {isCheckedIn ? 'Check-out QR Code' : 'Check-in QR Code'}
                    </Text>
                    <View style={styles.qrCodeWrapper}>
                        <QRCode
                            value={generateQRData()}
                            size={200}
                            backgroundColor="white"
                            color="black"
                        />
                    </View>
                    <Text style={styles.qrInstruction}>
                        {isCheckedIn
                            ? 'Scan this code at the exit to check out'
                            : 'Scan this code at the entrance to check in'}
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    {!isCheckedIn ? (
                        <>
                            <TouchableOpacity
                                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                                onPress={handleCheckIn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Ionicons name="log-in" size={24} color="#000" />
                                        <Text style={styles.primaryButtonText}>Confirm Check-in</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {biometricAvailable && (
                                <View style={styles.biometricInfo}>
                                    <Ionicons name="finger-print" size={20} color="#00FF7F" />
                                    <Text style={styles.biometricText}>
                                        Biometric authentication enabled
                                    </Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <TouchableOpacity
                            style={[styles.checkoutButton, loading && styles.buttonDisabled]}
                            onPress={handleCheckOut}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="log-out" size={24} color="#fff" />
                                    <Text style={styles.checkoutButtonText}>Check Out</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tips Card */}
                {isCheckedIn && (
                    <View style={styles.tipsCard}>
                        <Ionicons name="bulb" size={20} color="#FFB347" />
                        <Text style={styles.tipsText}>
                            Don't forget to track your workout and stay hydrated!
                        </Text>
                    </View>
                )}
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    gymName: {
        ...typography.heading1,
        color: palette.textPrimary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    checkedInBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 215, 75, 0.2)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.round,
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    checkedInText: {
        ...typography.bodyBold,
        color: '#32D74B',
    },
    infoCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    infoTextContainer: {
        marginLeft: spacing.md,
        flex: 1,
    },
    infoLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: 4,
    },
    infoValue: {
        ...typography.subtitle,
        color: palette.textPrimary,
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    qrLabel: {
        ...typography.heading3,
        color: palette.textPrimary,
        marginBottom: spacing.lg,
    },
    qrCodeWrapper: {
        backgroundColor: '#fff',
        padding: spacing.lg,
        borderRadius: radii.lg,
        marginBottom: spacing.md,
    },
    qrInstruction: {
        ...typography.body,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    buttonContainer: {
        gap: spacing.md,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00FF7F',
        padding: spacing.lg,
        borderRadius: radii.lg,
        gap: spacing.sm,
    },
    primaryButtonText: {
        ...typography.bodyBold,
        color: '#000',
        fontSize: 18,
    },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF453A',
        padding: spacing.lg,
        borderRadius: radii.lg,
        gap: spacing.sm,
    },
    checkoutButtonText: {
        ...typography.bodyBold,
        color: '#fff',
        fontSize: 18,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    biometricInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    biometricText: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 14,
    },
    tipsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 179, 71, 0.1)',
        padding: spacing.md,
        borderRadius: radii.md,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    tipsText: {
        ...typography.body,
        color: palette.textPrimary,
        flex: 1,
    },
});
