import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';

type PaymentSuccessRouteProp = RouteProp<{
    PaymentSuccess: {
        transactionId: string;
        amount: number;
        bookingDetails: any;
        paymentMethod?: string;
    };
}, 'PaymentSuccess'>;

export default function PaymentSuccessScreen() {
    const navigation = useNavigation();
    const route = useRoute<PaymentSuccessRouteProp>();

    const { transactionId, amount, bookingDetails, paymentMethod } = route.params || {};

    useEffect(() => {
        // Auto-redirect after 5 seconds
        const timer = setTimeout(() => {
            navigation.navigate('Bookings' as never);
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigation]);

    const handleViewInvoice = () => {
        (navigation as any).navigate('InvoiceViewer', {
            transactionId,
            amount,
            bookingDetails,
        });
    }; const handleShare = async () => {
        try {
            await Share.share({
                message: `Payment Successful! 
        
Transaction ID: ${transactionId}
Amount Paid: $${amount?.toFixed(2)}
Booking: ${bookingDetails?.gymName}
Date: ${bookingDetails?.sessionDate}

Thank you for booking with SIXFINITY!`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const formatDate = () => {
        return new Date().toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Success Animation */}
                <View style={styles.successAnimation}>
                    <View style={styles.successCircle}>
                        <Text style={styles.successIcon}>✓</Text>
                    </View>
                </View>

                {/* Success Message */}
                <View style={styles.messageContainer}>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successSubtitle}>
                        Your booking has been confirmed
                    </Text>
                </View>

                {/* Amount Card */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Amount Paid</Text>
                    <Text style={styles.amountValue}>₹{amount?.toFixed(2) || '0.00'}</Text>
                    <Text style={styles.amountDate}>{formatDate()}</Text>
                </View>

                {/* Transaction Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Transaction Details</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Transaction ID</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                            {transactionId || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Booking</Text>
                        <Text style={styles.detailValue}>
                            {bookingDetails?.gymName || 'Gym Booking'}
                        </Text>
                    </View>

                    {bookingDetails?.trainerName && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Trainer</Text>
                                <Text style={styles.detailValue}>{bookingDetails.trainerName}</Text>
                            </View>
                        </>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Session Date</Text>
                        <Text style={styles.detailValue}>
                            {bookingDetails?.sessionDate || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Session Time</Text>
                        <Text style={styles.detailValue}>
                            {bookingDetails?.sessionTime || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Status</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>✓ Completed</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleViewInvoice}>
                        <Text style={styles.primaryButtonText}> View Invoice</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
                        <Text style={styles.secondaryButtonText}> Share Receipt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.tertiaryButton}
                        onPress={() => navigation.navigate('Bookings' as never)}
                    >
                        <Text style={styles.tertiaryButtonText}>View My Bookings</Text>
                    </TouchableOpacity>
                </View>

                {/* Success Note */}
                <View style={styles.noteCard}>
                    <Text style={styles.noteIcon}></Text>
                    <Text style={styles.noteText}>
                        A confirmation email has been sent to your registered email address.
                        You can view your booking details anytime from the Bookings section.
                    </Text>
                </View>

                {/* Auto-redirect Notice */}
                <Text style={styles.redirectText}>
                    Automatically redirecting to bookings in a few seconds...
                </Text>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => navigation.navigate('Tabs' as never)}
                >
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollContent: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    successAnimation: {
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
    },
    successCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: palette.success,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: palette.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    successIcon: {
        fontSize: 64,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    messageContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    successSubtitle: {
        fontSize: 16,
        color: palette.textSecondary,
    },
    amountCard: {
        backgroundColor: `${palette.success}20`,
        borderWidth: 2,
        borderColor: palette.success,
        borderRadius: 16,
        padding: spacing.xl,
        alignItems: 'center',
        width: '100%',
        marginBottom: spacing.lg,
    },
    amountLabel: {
        fontSize: 14,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    amountValue: {
        fontSize: 40,
        fontWeight: '700',
        color: palette.success,
        marginBottom: spacing.xs,
    },
    amountDate: {
        fontSize: 12,
        color: palette.textTertiary,
    },
    detailsCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.lg,
        width: '100%',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: palette.border,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    detailLabel: {
        fontSize: 14,
        color: palette.textSecondary,
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        flex: 1,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: palette.border,
        marginVertical: spacing.xs,
    },
    statusBadge: {
        backgroundColor: `${palette.success}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.success,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.success,
    },
    actionsContainer: {
        width: '100%',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    primaryButton: {
        backgroundColor: palette.brandPrimary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    secondaryButton: {
        backgroundColor: palette.surface,
        borderWidth: 2,
        borderColor: palette.brandPrimary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.brandPrimary,
    },
    tertiaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    tertiaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.brandPrimary,
        textDecorationLine: 'underline',
    },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: `${palette.accentBlue}10`,
        borderRadius: 12,
        padding: spacing.md,
        width: '100%',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    noteIcon: {
        fontSize: 20,
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
    },
    redirectText: {
        fontSize: 12,
        color: palette.textTertiary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        backgroundColor: palette.surface,
    },
    doneButton: {
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.textPrimary,
    },
});
