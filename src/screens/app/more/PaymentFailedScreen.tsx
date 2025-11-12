import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';

type PaymentFailedRouteProp = RouteProp<{
    PaymentFailed: {
        error: string;
        amount: number;
        bookingDetails: any;
    };
}, 'PaymentFailed'>;

export default function PaymentFailedScreen() {
    const navigation = useNavigation();
    const route = useRoute<PaymentFailedRouteProp>();

    const { error, amount, bookingDetails } = route.params || {};

    const handleTryAgain = () => {
        navigation.goBack();
    };

    const handleChangeMethod = () => {
        navigation.navigate('PaymentMethods' as never);
    };

    const handleContactSupport = () => {
        navigation.navigate('HelpSupport' as never);
    };

    const getErrorMessage = () => {
        if (error?.toLowerCase().includes('insufficient')) {
            return {
                title: 'Insufficient Balance',
                description: 'Your payment method does not have enough balance to complete this transaction.',
                suggestion: 'Please try a different payment method or add funds to your wallet.',
            };
        } else if (error?.toLowerCase().includes('declined')) {
            return {
                title: 'Payment Declined',
                description: 'Your payment was declined by your bank or payment provider.',
                suggestion: 'Please check your payment details or try a different payment method.',
            };
        } else if (error?.toLowerCase().includes('network')) {
            return {
                title: 'Network Error',
                description: 'Unable to process payment due to network connectivity issues.',
                suggestion: 'Please check your internet connection and try again.',
            };
        } else if (error?.toLowerCase().includes('timeout')) {
            return {
                title: 'Payment Timeout',
                description: 'The payment request timed out before completion.',
                suggestion: 'Please try again. If the issue persists, check your internet connection.',
            };
        } else {
            return {
                title: 'Payment Failed',
                description: error || 'We were unable to process your payment at this time.',
                suggestion: 'Please try again or contact support if the problem continues.',
            };
        }
    };

    const errorInfo = getErrorMessage();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Failed Animation */}
                <View style={styles.failedAnimation}>
                    <View style={styles.failedCircle}>
                        <Text style={styles.failedIcon}>✕</Text>
                    </View>
                </View>

                {/* Error Message */}
                <View style={styles.messageContainer}>
                    <Text style={styles.failedTitle}>{errorInfo.title}</Text>
                    <Text style={styles.failedSubtitle}>{errorInfo.description}</Text>
                </View>

                {/* Amount Card */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Transaction Amount</Text>
                    <Text style={styles.amountValue}>₹{amount?.toFixed(2) || '0.00'}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>✕ Failed</Text>
                    </View>
                </View>

                {/* Booking Details */}
                {bookingDetails && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.detailsTitle}>Booking Details</Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Gym/Trainer</Text>
                            <Text style={styles.detailValue}>
                                {bookingDetails.gymName || 'N/A'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Session Date</Text>
                            <Text style={styles.detailValue}>
                                {bookingDetails.sessionDate || 'N/A'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Session Time</Text>
                            <Text style={styles.detailValue}>
                                {bookingDetails.sessionTime || 'N/A'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Suggestion Card */}
                <View style={styles.suggestionCard}>
                    <Text style={styles.suggestionIcon}>💡</Text>
                    <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionTitle}>What you can do:</Text>
                        <Text style={styles.suggestionText}>{errorInfo.suggestion}</Text>
                    </View>
                </View>

                {/* Common Issues */}
                <View style={styles.issuesCard}>
                    <Text style={styles.issuesTitle}>Common Issues:</Text>
                    <View style={styles.issueItem}>
                        <Text style={styles.issueBullet}>•</Text>
                        <Text style={styles.issueText}>Insufficient balance in payment method</Text>
                    </View>
                    <View style={styles.issueItem}>
                        <Text style={styles.issueBullet}>•</Text>
                        <Text style={styles.issueText}>Card expired or blocked</Text>
                    </View>
                    <View style={styles.issueItem}>
                        <Text style={styles.issueBullet}>•</Text>
                        <Text style={styles.issueText}>Incorrect CVV or PIN</Text>
                    </View>
                    <View style={styles.issueItem}>
                        <Text style={styles.issueBullet}>•</Text>
                        <Text style={styles.issueText}>Poor network connection</Text>
                    </View>
                    <View style={styles.issueItem}>
                        <Text style={styles.issueBullet}>•</Text>
                        <Text style={styles.issueText}>Bank server temporarily unavailable</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleTryAgain}>
                        <Text style={styles.primaryButtonText}>🔄 Try Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleChangeMethod}>
                        <Text style={styles.secondaryButtonText}>💳 Change Payment Method</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tertiaryButton} onPress={handleContactSupport}>
                        <Text style={styles.tertiaryButtonText}>💬 Contact Support</Text>
                    </TouchableOpacity>
                </View>

                {/* Support Note */}
                <View style={styles.noteCard}>
                    <Text style={styles.noteText}>
                        If you continue to face issues, please contact our support team.
                        We're here to help 24/7!
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.navigate('Tabs' as never)}
                >
                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
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
    failedAnimation: {
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
    },
    failedCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: palette.error,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: palette.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    failedIcon: {
        fontSize: 64,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    messageContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },
    failedTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    failedSubtitle: {
        fontSize: 16,
        color: palette.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    amountCard: {
        backgroundColor: `${palette.error}10`,
        borderWidth: 2,
        borderColor: palette.error,
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
        color: palette.error,
        marginBottom: spacing.sm,
    },
    statusBadge: {
        backgroundColor: palette.error,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
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
    suggestionCard: {
        flexDirection: 'row',
        backgroundColor: `${palette.warning}20`,
        borderRadius: 12,
        padding: spacing.md,
        width: '100%',
        marginBottom: spacing.lg,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: `${palette.warning}50`,
    },
    suggestionIcon: {
        fontSize: 24,
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    suggestionText: {
        fontSize: 13,
        color: palette.textSecondary,
        lineHeight: 18,
    },
    issuesCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        width: '100%',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: palette.border,
    },
    issuesTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    issueItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    issueBullet: {
        fontSize: 14,
        color: palette.textSecondary,
        marginRight: spacing.sm,
        marginTop: 2,
    },
    issueText: {
        flex: 1,
        fontSize: 13,
        color: palette.textSecondary,
        lineHeight: 20,
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
        backgroundColor: `${palette.accentBlue}10`,
        borderRadius: 12,
        padding: spacing.md,
        width: '100%',
        marginBottom: spacing.md,
    },
    noteText: {
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        backgroundColor: palette.surface,
    },
    cancelButton: {
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.error,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.error,
    },
});
