import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStripe, StripeProvider, CardField } from '@stripe/stripe-react-native';
import {
    sendBookingConfirmation,
    scheduleAllSessionReminders
} from '@/services/notificationsService';
import {
    processPayment,
    selectPaymentGateway,
    formatAmount,
    calculateTotalAmount,
    saveTransaction,
} from '@/services/paymentService';
import { getStripePublishableKey } from '@/services/stripeService';
import { Currency, TransactionType, PaymentMethod as PaymentMethodType, PaymentStatus } from '@/types/payment';

type PaymentMethod = 'card' | 'wallet' | 'cash';
type SessionType = 'single' | 'package';

const BookSessionScreenComponent = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const stripe = useStripe();

    const [sessionType, setSessionType] = useState<SessionType>('single');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [currency, setCurrency] = useState<Currency>(Currency.LKR);

    // Mock data - replace with route params
    const booking = {
        trainer: {
            id: '1',
            name: 'Chaminda Perera',
            photo: undefined,
            specialization: 'Strength Training',
            rating: 4.9,
        },
        slot: {
            day: 'Monday',
            date: 'Dec 9, 2025',
            time: '9:00 AM - 10:00 AM',
        },
        gym: {
            name: 'SIXFINITY Colombo 07',
            address: 'No. 123, Galle Road, Colombo 07',
        },
        pricing: {
            singleSession: 2500,
            packagePrice: 18000,
            packageSessions: 8,
        },
    };

    const walletBalance = 15000;
    const savingsAmount = (booking.pricing.singleSession * booking.pricing.packageSessions) - booking.pricing.packagePrice;

    // Currency conversion (LKR to USD, approximate rate: 325 LKR = 1 USD)
    const LKR_TO_USD = 1 / 325;
    const getPrice = (lkrPrice: number) => {
        return currency === Currency.USD ? lkrPrice * LKR_TO_USD : lkrPrice;
    };

    const singleSessionPrice = getPrice(booking.pricing.singleSession);
    const packagePrice = getPrice(booking.pricing.packagePrice);
    const savings = getPrice(savingsAmount);
    const totalPrice = sessionType === 'single' ? singleSessionPrice : packagePrice;

    const handleBookSession = async () => {
        if (!agreedToPolicy) {
            Alert.alert('Policy Agreement Required', 'Please agree to the cancellation and reschedule policy to continue.');
            return;
        }

        if (paymentMethod === 'wallet' && walletBalance < totalPrice) {
            Alert.alert('Insufficient Balance', `Your wallet balance is Rs. ${walletBalance.toLocaleString()}. Please top up or choose a different payment method.`);
            return;
        }

        setProcessing(true);

        try {
            let paymentSuccess = false;
            let transactionId = '';

            // Process payment for card payments only
            if (paymentMethod === 'card') {
                // Prepare booking data for payment
                const bookingData = {
                    trainerId: booking.trainer.id,
                    trainerName: booking.trainer.name,
                    sessionDate: booking.slot.date,
                    sessionTime: booking.slot.time,
                    gym: booking.gym.name,
                    amount: totalPrice,
                    currency: currency,
                    numberOfSessions: sessionType === 'single' ? 1 : booking.pricing.packageSessions,
                    packageType: sessionType === 'package' ? `${booking.pricing.packageSessions}-Session Package` : undefined,
                };

                // User details (in production, get from auth context)
                const userDetails = {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    phone: '+94771234567',
                    address: 'Colombo',
                    city: 'Colombo',
                };

                // Process payment
                const paymentResult = await processPayment(bookingData, userDetails, stripe);

                if (!paymentResult.success) {
                    throw new Error(paymentResult.error || 'Payment failed');
                }

                // Save transaction
                transactionId = await saveTransaction({
                    userId: 'user1', // Get from auth context in production
                    trainerId: booking.trainer.id,
                    trainerName: booking.trainer.name,
                    amount: totalPrice,
                    currency: currency,
                    gateway: selectPaymentGateway(currency),
                    paymentMethod: PaymentMethodType.CREDIT_CARD,
                    status: paymentResult.status,
                    type: TransactionType.BOOKING,
                    description: `Training Session - ${booking.trainer.name}`,
                    gatewayTransactionId: paymentResult.gatewayTransactionId,
                    receiptUrl: paymentResult.receiptUrl,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    metadata: {
                        sessionDate: booking.slot.date,
                        sessionTime: booking.slot.time,
                        gym: booking.gym.name,
                        numberOfSessions: sessionType === 'single' ? 1 : booking.pricing.packageSessions,
                        packageType: bookingData.packageType,
                    },
                });

                paymentSuccess = true;
            } else {
                // For wallet or cash, mark as success (handle via your backend)
                paymentSuccess = true;
                transactionId = `txn_${Date.now()}`;
            }

            if (paymentSuccess) {
                // Send booking confirmation notification
                await sendBookingConfirmation({
                    trainerName: booking.trainer.name,
                    date: booking.slot.date,
                    time: booking.slot.time,
                    gym: booking.gym.name,
                });

                // Schedule session reminders (24h and 1h before)
                const bookingId = Date.now().toString();
                await scheduleAllSessionReminders(bookingId, {
                    trainerName: booking.trainer.name,
                    date: booking.slot.date,
                    time: booking.slot.time,
                    gym: booking.gym.name,
                });

                // Show success message
                Alert.alert(
                    'Booking Confirmed! 🎉',
                    `Your session with ${booking.trainer.name} has been booked for ${booking.slot.date} at ${booking.slot.time}.\n\nPayment: ${formatAmount(totalPrice, currency)}\nTransaction ID: ${transactionId}\n\nYou'll receive reminders 24 hours and 1 hour before your session.`,
                    [
                        {
                            text: 'View My Bookings',
                            onPress: () => {
                                navigation.navigate('MyBookings' as never);
                            },
                        },
                        {
                            text: 'Done',
                            onPress: () => navigation.navigate('Workout' as never),
                        },
                    ]
                );
            }
        } catch (error) {
            Alert.alert(
                'Booking Failed',
                error instanceof Error ? error.message : 'Unable to complete booking. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color={palette.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Session</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Trainer Info Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trainer</Text>
                    <View style={styles.trainerCard}>
                        <Image source={{ uri: booking.trainer.photo }} style={styles.trainerPhoto} />
                        <View style={styles.trainerInfo}>
                            <Text style={styles.trainerName}>{booking.trainer.name}</Text>
                            <Text style={styles.trainerSpec}>{booking.trainer.specialization}</Text>
                            <View style={styles.ratingRow}>
                                <Icon name="star" size={14} color="#FFD700" />
                                <Text style={styles.ratingText}>{booking.trainer.rating}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.messageIconButton}>
                            <Icon name="message-text" size={18} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Session Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Session Details</Text>
                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Icon name="calendar" size={20} color={palette.neonGreen} />
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Date</Text>
                                <Text style={styles.detailValue}>{booking.slot.date}</Text>
                            </View>
                        </View>
                        <View style={styles.detailRow}>
                            <Icon name="clock-outline" size={20} color={palette.neonGreen} />
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Time</Text>
                                <Text style={styles.detailValue}>{booking.slot.time}</Text>
                            </View>
                        </View>
                        <View style={styles.detailRow}>
                            <Icon name="map-marker" size={20} color={palette.neonGreen} />
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Location</Text>
                                <Text style={styles.detailValue}>{booking.gym.name}</Text>
                                <Text style={styles.detailSubtext}>{booking.gym.address}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Session Type */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Package</Text>

                    <TouchableOpacity
                        style={[styles.sessionTypeCard, sessionType === 'single' && styles.sessionTypeCardActive]}
                        onPress={() => setSessionType('single')}
                    >
                        <View style={styles.sessionTypeHeader}>
                            <View>
                                <Text style={styles.sessionTypeName}>Single Session</Text>
                                <Text style={styles.sessionTypeDesc}>Pay as you go</Text>
                            </View>
                            <View style={styles.sessionTypePrice}>
                                <Text style={styles.priceValue}>{formatAmount(singleSessionPrice, currency)}</Text>
                                <Text style={styles.priceLabel}>per session</Text>
                            </View>
                        </View>
                        {sessionType === 'single' && (
                            <View style={styles.selectedBadge}>
                                <Icon name="check-circle" size={20} color={palette.neonGreen} />
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sessionTypeCard, sessionType === 'package' && styles.sessionTypeCardActive]}
                        onPress={() => setSessionType('package')}
                    >
                        <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>BEST VALUE</Text>
                        </View>
                        <View style={styles.sessionTypeHeader}>
                            <View>
                                <Text style={styles.sessionTypeName}>Monthly Package</Text>
                                <Text style={styles.sessionTypeDesc}>{booking.pricing.packageSessions} sessions included</Text>
                            </View>
                            <View style={styles.sessionTypePrice}>
                                <Text style={styles.priceValue}>{formatAmount(packagePrice, currency)}</Text>
                                <Text style={styles.priceLabel}>per month</Text>
                            </View>
                        </View>
                        <View style={styles.savingsRow}>
                            <Icon name="tag" size={16} color="#4ECDC4" />
                            <Text style={styles.savingsText}>Save {formatAmount(savings, currency)} compared to single sessions</Text>
                        </View>
                        {sessionType === 'package' && (
                            <View style={styles.selectedBadge}>
                                <Icon name="check-circle" size={20} color={palette.neonGreen} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Currency Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Currency</Text>
                    <View style={styles.currencyToggleContainer}>
                        <TouchableOpacity
                            style={[styles.currencyButton, currency === Currency.LKR && styles.currencyButtonActive]}
                            onPress={() => setCurrency(Currency.LKR)}
                        >
                            <Text style={[styles.currencyButtonText, currency === Currency.LKR && styles.currencyButtonTextActive]}>
                                🇱🇰 LKR (PayHere)
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.currencyButton, currency === Currency.USD && styles.currencyButtonActive]}
                            onPress={() => setCurrency(Currency.USD)}
                        >
                            <Text style={[styles.currencyButtonText, currency === Currency.USD && styles.currencyButtonTextActive]}>
                                🇺🇸 USD (Stripe)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>

                    <TouchableOpacity
                        style={[styles.paymentCard, paymentMethod === 'card' && styles.paymentCardActive]}
                        onPress={() => setPaymentMethod('card')}
                    >
                        <Icon name="credit-card" size={24} color={paymentMethod === 'card' ? palette.neonGreen : palette.textSecondary} />
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentName}>Credit/Debit Card</Text>
                            <Text style={styles.paymentDesc}>Secure payment via Stripe</Text>
                        </View>
                        {paymentMethod === 'card' && (
                            <Icon name="check-circle" size={20} color={palette.neonGreen} />
                        )}
                    </TouchableOpacity>

                    {paymentMethod === 'card' && (
                        <View style={styles.cardFieldContainer}>
                            <Text style={styles.cardFieldLabel}>Card Details</Text>
                            <CardField
                                postalCodeEnabled={false}
                                placeholders={{
                                    number: '4242 4242 4242 4242',
                                }}
                                cardStyle={{
                                    backgroundColor: palette.surface,
                                    textColor: palette.textPrimary,
                                    borderColor: palette.border,
                                    borderWidth: 1,
                                    borderRadius: 12,
                                    fontSize: 16,
                                    placeholderColor: palette.textSecondary,
                                }}
                                style={styles.cardField}
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.paymentCard, paymentMethod === 'wallet' && styles.paymentCardActive]}
                        onPress={() => setPaymentMethod('wallet')}
                    >
                        <Icon name="wallet" size={24} color={paymentMethod === 'wallet' ? palette.neonGreen : palette.textSecondary} />
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentName}>Wallet Balance</Text>
                            <Text style={styles.paymentDesc}>Available: Rs. {walletBalance.toLocaleString()}</Text>
                        </View>
                        {paymentMethod === 'wallet' && (
                            <Icon name="check-circle" size={20} color={palette.neonGreen} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.paymentCard, paymentMethod === 'cash' && styles.paymentCardActive]}
                        onPress={() => setPaymentMethod('cash')}
                    >
                        <Icon name="cash" size={24} color={paymentMethod === 'cash' ? palette.neonGreen : palette.textSecondary} />
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentName}>Pay at Gym</Text>
                            <Text style={styles.paymentDesc}>Cash or card at facility</Text>
                        </View>
                        {paymentMethod === 'cash' && (
                            <Icon name="check-circle" size={20} color={palette.neonGreen} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Cancellation Policy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cancellation & Reschedule Policy</Text>
                    <View style={styles.policyCard}>
                        <View style={styles.policyRow}>
                            <Icon name="information" size={18} color="#4ECDC4" />
                            <Text style={styles.policyText}>
                                Free cancellation or reschedule up to 24 hours before session
                            </Text>
                        </View>
                        <View style={styles.policyRow}>
                            <Icon name="alert-circle" size={18} color="#FFA500" />
                            <Text style={styles.policyText}>
                                50% refund if cancelled within 24 hours
                            </Text>
                        </View>
                        <View style={styles.policyRow}>
                            <Icon name="close-circle" size={18} color="#FF6B6B" />
                            <Text style={styles.policyText}>
                                No refund for no-shows
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.agreementRow}
                        onPress={() => setAgreedToPolicy(!agreedToPolicy)}
                    >
                        <Icon
                            name={agreedToPolicy ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={24}
                            color={agreedToPolicy ? palette.neonGreen : palette.textSecondary}
                        />
                        <Text style={styles.agreementText}>
                            I agree to the cancellation and reschedule policy
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Summary Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.summaryLeft}>
                    <Text style={styles.summaryLabel}>Total</Text>
                    <Text style={styles.summaryPrice}>{formatAmount(totalPrice, currency)}</Text>
                    {sessionType === 'package' && (
                        <Text style={styles.summaryDesc}>{booking.pricing.packageSessions} sessions</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.bookButton, !agreedToPolicy && styles.bookButtonDisabled]}
                    onPress={handleBookSession}
                    disabled={!agreedToPolicy}
                >
                    <LinearGradient
                        colors={agreedToPolicy ? [palette.neonGreen, palette.neonGreenDim] : ['#444', '#333']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.bookButtonGradient}
                    >
                        <Icon
                            name="calendar-check"
                            size={20}
                            color={agreedToPolicy ? palette.background : palette.textSecondary}
                        />
                        <Text style={[styles.bookButtonText, !agreedToPolicy && styles.bookButtonTextDisabled]}>
                            Confirm Booking
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    sectionTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: spacing.md,
    },
    trainerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    trainerPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: palette.border,
    },
    trainerInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    trainerName: {
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    trainerSpec: {
        color: palette.textSecondary,
        fontSize: 13,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: palette.textPrimary,
        fontSize: 13,
        fontWeight: '600',
    },
    messageIconButton: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
        gap: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        color: palette.textSecondary,
        fontSize: 12,
        marginBottom: 2,
    },
    detailValue: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    detailSubtext: {
        color: palette.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    sessionTypeCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 2,
        borderColor: palette.border,
        position: 'relative',
    },
    sessionTypeCardActive: {
        borderColor: palette.neonGreen,
        backgroundColor: 'rgba(197, 255, 74, 0.05)',
    },
    sessionTypeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    sessionTypeName: {
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    sessionTypeDesc: {
        color: palette.textSecondary,
        fontSize: 13,
    },
    sessionTypePrice: {
        alignItems: 'flex-end',
    },
    priceValue: {
        color: palette.neonGreen,
        fontSize: 24,
        fontWeight: '700',
    },
    priceLabel: {
        color: palette.textSecondary,
        fontSize: 11,
    },
    recommendedBadge: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        backgroundColor: palette.neonGreen,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    recommendedText: {
        color: palette.background,
        fontSize: 10,
        fontWeight: '700',
    },
    savingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        gap: 6,
    },
    savingsText: {
        color: '#4ECDC4',
        fontSize: 13,
        fontWeight: '600',
    },
    selectedBadge: {
        position: 'absolute',
        bottom: spacing.md,
        right: spacing.md,
    },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 2,
        borderColor: palette.border,
    },
    paymentCardActive: {
        borderColor: palette.neonGreen,
        backgroundColor: 'rgba(197, 255, 74, 0.05)',
    },
    paymentInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    paymentName: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    paymentDesc: {
        color: palette.textSecondary,
        fontSize: 12,
    },
    policyCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    policyRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'flex-start',
    },
    policyText: {
        flex: 1,
        color: palette.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    agreementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    agreementText: {
        flex: 1,
        color: palette.textPrimary,
        fontSize: 14,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: palette.background,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    summaryLeft: {
        flex: 1,
    },
    summaryLabel: {
        color: palette.textSecondary,
        fontSize: 12,
        marginBottom: 2,
    },
    summaryPrice: {
        color: palette.textPrimary,
        fontSize: 24,
        fontWeight: '700',
    },
    summaryDesc: {
        color: palette.textSecondary,
        fontSize: 11,
    },
    bookButton: {
        flex: 1.2,
        borderRadius: 25,
        overflow: 'hidden',
    },
    bookButtonDisabled: {
        opacity: 0.5,
    },
    bookButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    bookButtonText: {
        color: palette.background,
        fontSize: 15,
        fontWeight: '700',
    },
    bookButtonTextDisabled: {
        color: palette.textSecondary,
    },
    currencyToggleContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    currencyButton: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: 12,
        backgroundColor: palette.surface,
        borderWidth: 2,
        borderColor: palette.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencyButtonActive: {
        borderColor: palette.neonGreen,
        backgroundColor: 'rgba(197, 255, 74, 0.1)',
    },
    currencyButtonText: {
        ...typography.bodyBold,
        color: palette.textSecondary,
        fontSize: 14,
    },
    currencyButtonTextActive: {
        color: palette.neonGreen,
    },
    cardFieldContainer: {
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
    },
    cardFieldLabel: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: spacing.sm,
        fontSize: 14,
    },
    cardField: {
        height: 50,
        marginVertical: spacing.xs,
    },
});

export const BookSessionScreen = () => {
    return (
        <StripeProvider publishableKey={getStripePublishableKey()}>
            <BookSessionScreenComponent />
        </StripeProvider>
    );
};
