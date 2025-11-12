import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { palette } from '../theme';

const { width } = Dimensions.get('window');

interface PaymentProcessingModalProps {
    visible: boolean;
    amount: number;
    currency?: string;
    paymentMethod?: string;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
    visible,
    amount,
    currency = '₹',
    paymentMethod,
}) => {
    // Animation values
    const spinValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(0)).current;
    const fadeValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;

    // Start animations when modal becomes visible
    useEffect(() => {
        if (visible) {
            // Reset animations
            spinValue.setValue(0);
            scaleValue.setValue(0);
            fadeValue.setValue(0);
            pulseValue.setValue(1);

            // Modal entrance animation
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeValue, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Continuous spinning animation
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

            // Continuous pulse animation for amount
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseValue, {
                        toValue: 1.05,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseValue, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [visible]);

    // Interpolate spin animation
    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [{ scale: scaleValue }],
                            opacity: fadeValue,
                        },
                    ]}
                >
                    {/* Animated Loading Ring */}
                    <View style={styles.loaderContainer}>
                        <Animated.View
                            style={[
                                styles.outerRing,
                                {
                                    transform: [{ rotate: spin }],
                                },
                            ]}
                        >
                            <View style={styles.outerRingSegment} />
                        </Animated.View>

                        <Animated.View
                            style={[
                                styles.middleRing,
                                {
                                    transform: [
                                        {
                                            rotate: spinValue.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['360deg', '0deg'],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <View style={styles.middleRingSegment} />
                        </Animated.View>

                        <View style={styles.innerCircle}>
                            <Text style={styles.currencySymbol}>{currency}</Text>
                        </View>
                    </View>

                    {/* Processing Text */}
                    <Text style={styles.title}>Processing Payment</Text>

                    {/* Amount with Pulse Animation */}
                    <Animated.View
                        style={[
                            styles.amountContainer,
                            {
                                transform: [{ scale: pulseValue }],
                            },
                        ]}
                    >
                        <Text style={styles.amount}>
                            {currency}{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </Animated.View>

                    {/* Payment Method Info */}
                    {paymentMethod && (
                        <View style={styles.methodContainer}>
                            <View style={styles.methodDot} />
                            <Text style={styles.methodText}>{paymentMethod}</Text>
                        </View>
                    )}

                    {/* Processing Message */}
                    <Text style={styles.message}>
                        Your payment is being processed...{'\n'}
                        Please do not close this screen
                    </Text>

                    {/* Security Badge */}
                    <View style={styles.securityBadge}>
                        <View style={styles.lockIcon}>
                            <Text style={styles.lockEmoji}>🔒</Text>
                        </View>
                        <Text style={styles.securityText}>
                            Secure Payment • Encrypted Connection
                        </Text>
                    </View>

                    {/* Animated Progress Dots */}
                    <View style={styles.dotsContainer}>
                        {[0, 1, 2].map((index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        opacity: spinValue.interpolate({
                                            inputRange: [0, 0.33, 0.66, 1],
                                            outputRange:
                                                index === 0
                                                    ? [0.3, 1, 0.3, 0.3]
                                                    : index === 1
                                                        ? [0.3, 0.3, 1, 0.3]
                                                        : [0.3, 0.3, 0.3, 1],
                                        }),
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: palette.brandPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
    },
    loaderContainer: {
        width: 140,
        height: 140,
        marginBottom: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerRing: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: 'transparent',
    },
    outerRingSegment: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: 'transparent',
        borderTopColor: palette.brandPrimary,
        borderRightColor: palette.brandPrimary,
    },
    middleRing: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    middleRingSegment: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: 'transparent',
        borderBottomColor: palette.brandSecondary,
        borderLeftColor: palette.brandSecondary,
    },
    innerCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: palette.brandPrimary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: palette.brandPrimary + '30',
    },
    currencySymbol: {
        fontSize: 36,
        fontWeight: '700',
        color: palette.brandPrimary,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    amountContainer: {
        backgroundColor: palette.brandPrimary + '10',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: palette.brandPrimary + '20',
    },
    amount: {
        fontSize: 32,
        fontWeight: '800',
        color: palette.brandPrimary,
        letterSpacing: 0.5,
    },
    methodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    methodDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: palette.success,
        marginRight: 8,
    },
    methodText: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textSecondary,
    },
    message: {
        fontSize: 15,
        color: palette.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.success + '10',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: palette.success + '20',
    },
    lockIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    lockEmoji: {
        fontSize: 16,
    },
    securityText: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.success,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: palette.brandPrimary,
    },
});

export default PaymentProcessingModal;
