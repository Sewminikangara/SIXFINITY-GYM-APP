/**
 * Payment History Screen
 * Displays transaction history with receipts and refund options
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    Linking,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import {
    getTransactionHistory,
    formatAmount,
    getPaymentStatusInfo,
    getGatewayDisplayName,
    isRefundAllowed,
    calculateRefundAmount,
    processRefund,
} from '@/services/paymentService';
import { Transaction, PaymentStatus, PaymentGateway } from '@/types/payment';

export const PaymentHistoryScreen = () => {
    const navigation = useNavigation();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'refunded'>('all');

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            // In production, get userId from auth context
            const data = await getTransactionHistory('user1');
            setTransactions(data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadTransactions();
        setRefreshing(false);
    };

    const handleViewReceipt = async (receiptUrl?: string) => {
        if (!receiptUrl) {
            Alert.alert('No Receipt', 'Receipt is not available for this transaction.');
            return;
        }

        const supported = await Linking.canOpenURL(receiptUrl);
        if (supported) {
            await Linking.openURL(receiptUrl);
        } else {
            Alert.alert('Error', 'Unable to open receipt URL');
        }
    };

    const handleRequestRefund = async (transaction: Transaction) => {
        // Check if refund is allowed
        const canRefund = isRefundAllowed(
            transaction.metadata?.sessionDate || '',
            transaction.metadata?.sessionTime || '',
            transaction.status
        );

        if (!canRefund) {
            Alert.alert(
                'Refund Not Available',
                'This transaction is not eligible for refund. Sessions must be cancelled at least 12 hours in advance.'
            );
            return;
        }

        // Calculate refund amount
        const refundInfo = calculateRefundAmount(
            transaction.amount,
            transaction.metadata?.sessionDate || ''
        );

        Alert.alert(
            'Request Refund',
            `You will receive ${refundInfo.refundPercentage}% refund (${formatAmount(refundInfo.refundAmount, transaction.currency)}).\n\nDeducted amount: ${formatAmount(refundInfo.deductedAmount, transaction.currency)}\n\nDo you want to proceed?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Refund',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await processRefund(
                                {
                                    transactionId: transaction.gatewayTransactionId || transaction.id,
                                    amount: refundInfo.refundAmount,
                                    reason: 'Customer requested refund',
                                    bookingId: transaction.bookingId,
                                },
                                transaction.gateway
                            );

                            if (result.success) {
                                Alert.alert('Refund Processed', `Your refund of ${formatAmount(refundInfo.refundAmount, transaction.currency)} has been initiated. It may take 5-10 business days to appear in your account.`);
                                await loadTransactions();
                            } else {
                                Alert.alert('Refund Failed', result.error || 'Unable to process refund. Please contact support.');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'An error occurred while processing the refund.');
                        }
                    },
                },
            ]
        );
    };

    const filteredTransactions = transactions.filter((txn) => {
        if (filter === 'all') return true;
        if (filter === 'completed') return txn.status === PaymentStatus.COMPLETED;
        if (filter === 'pending') return txn.status === PaymentStatus.PENDING || txn.status === PaymentStatus.PROCESSING;
        if (filter === 'refunded') return txn.status === PaymentStatus.REFUNDED || txn.status === PaymentStatus.PARTIALLY_REFUNDED;
        return true;
    });

    const renderTransaction = (transaction: Transaction) => {
        const statusInfo = getPaymentStatusInfo(transaction.status);
        const canRefund = isRefundAllowed(
            transaction.metadata?.sessionDate || '',
            transaction.metadata?.sessionTime || '',
            transaction.status
        );

        return (
            <View key={transaction.id} style={styles.transactionCard}>
                {/* Header */}
                <View style={styles.transactionHeader}>
                    <View style={styles.transactionHeaderLeft}>
                        <Icon name="dumbbell" size={20} color={palette.neonGreen} />
                        <Text style={styles.trainerName}>{transaction.trainerName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                        <Icon name={statusInfo.icon} size={14} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>

                {/* Details */}
                <View style={styles.transactionDetails}>
                    <View style={styles.detailRow}>
                        <Icon name="calendar" size={16} color={palette.textSecondary} />
                        <Text style={styles.detailText}>
                            {transaction.metadata?.sessionDate} at {transaction.metadata?.sessionTime}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="map-marker" size={16} color={palette.textSecondary} />
                        <Text style={styles.detailText}>{transaction.metadata?.gym}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Icon name="credit-card" size={16} color={palette.textSecondary} />
                        <Text style={styles.detailText}>{getGatewayDisplayName(transaction.gateway)}</Text>
                    </View>
                </View>

                {/* Amount */}
                <View style={styles.amountSection}>
                    <Text style={styles.amountLabel}>Total Paid</Text>
                    <Text style={styles.amountValue}>
                        {formatAmount(transaction.amount, transaction.currency)}
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.actionButtons}>
                    {transaction.receiptUrl && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleViewReceipt(transaction.receiptUrl)}
                        >
                            <Icon name="receipt" size={18} color={palette.neonGreen} />
                            <Text style={styles.actionButtonText}>View Receipt</Text>
                        </TouchableOpacity>
                    )}
                    {canRefund && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.refundButton]}
                            onPress={() => handleRequestRefund(transaction)}
                        >
                            <Icon name="cash-refund" size={18} color={palette.accentOrange} />
                            <Text style={[styles.actionButtonText, { color: palette.accentOrange }]}>
                                Request Refund
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Transaction ID */}
                <Text style={styles.transactionId}>ID: {transaction.id}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={palette.neonGreen} />
                    <Text style={styles.loadingText}>Loading transactions...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                <Text style={styles.headerTitle}>Payment History</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['all', 'completed', 'pending', 'refunded'].map((filterOption) => (
                        <TouchableOpacity
                            key={filterOption}
                            style={[
                                styles.filterTab,
                                filter === filterOption && styles.filterTabActive,
                            ]}
                            onPress={() => setFilter(filterOption as any)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    filter === filterOption && styles.filterTabTextActive,
                                ]}
                            >
                                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Transactions List */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.neonGreen} />
                }
            >
                {filteredTransactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="receipt-text-outline" size={64} color={palette.textSecondary} />
                        <Text style={styles.emptyStateTitle}>No Transactions</Text>
                        <Text style={styles.emptyStateText}>
                            {filter === 'all'
                                ? 'You haven\'t made any payments yet.'
                                : `No ${filter} transactions found.`}
                        </Text>
                    </View>
                ) : (
                    filteredTransactions.map(renderTransaction)
                )}

                <View style={{ height: spacing.xxl }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    loadingText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
    },
    filterContainer: {
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    filterTab: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        marginLeft: spacing.md,
        borderRadius: 20,
        backgroundColor: palette.surface,
    },
    filterTabActive: {
        backgroundColor: palette.neonGreen,
    },
    filterTabText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    filterTabTextActive: {
        color: palette.background,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    transactionCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    transactionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    trainerName: {
        ...typography.heading3,
        color: palette.textPrimary,
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        ...typography.caption,
        fontWeight: '700',
    },
    transactionDetails: {
        gap: spacing.sm,
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    detailText: {
        ...typography.caption,
        color: palette.textSecondary,
        flex: 1,
    },
    amountSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    amountLabel: {
        ...typography.body,
        color: palette.textSecondary,
    },
    amountValue: {
        ...typography.heading2,
        color: palette.neonGreen,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        backgroundColor: 'rgba(197, 255, 74, 0.1)',
        borderWidth: 1,
        borderColor: palette.neonGreen,
    },
    refundButton: {
        backgroundColor: 'rgba(255, 159, 10, 0.1)',
        borderColor: palette.accentOrange,
    },
    actionButtonText: {
        ...typography.bodyBold,
        color: palette.neonGreen,
    },
    transactionId: {
        ...typography.footnote,
        color: palette.textTertiary,
        textAlign: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxxl,
        gap: spacing.md,
    },
    emptyStateTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
    },
    emptyStateText: {
        ...typography.body,
        color: palette.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
});
