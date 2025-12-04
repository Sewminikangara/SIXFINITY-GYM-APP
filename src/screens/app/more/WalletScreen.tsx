import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    SafeAreaView,
} from 'react-native';
import { palette, spacing, typography } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import * as walletService from '@/services/walletService';
import * as referralService from '@/services/referralService';
import { AddMoneyModal } from './AddMoneyModal';

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    category: 'topup' | 'booking' | 'refund' | 'reward' | 'referral' | 'cashback';
    amount: number;
    description: string;
    timestamp: string;
    status: 'completed' | 'pending' | 'failed';
    icon: string;
}

interface PaymentMethod {
    id: string;
    type: 'card' | 'upi' | 'bank' | 'wallet';
    name: string;
    details: string;
    isDefault: boolean;
    icon: string;
}

const TRANSACTION_ICONS = {
    topup: '',
    booking: '',
    refund: '',
    reward: '',
    referral: '',
    cashback: '',
};

const PAYMENT_METHOD_ICONS = {
    card: '',
    upi: '',
    bank: '',
    wallet: '',
};

export const WalletScreen: React.FC = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [totalSpentThisMonth, setTotalSpentThisMonth] = useState(0);
    const [availableCredits, setAvailableCredits] = useState(0);
    const [pendingRefunds, setPendingRefunds] = useState(0);
    const [walletId, setWalletId] = useState<string>('');
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadWalletData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadWalletData = async () => {
        if (!user?.id) {
            console.log('No user ID available');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            // Load wallet balance
            const balanceResult = await walletService.getWalletBalance(user.id);
            if (balanceResult.data) {
                setBalance(balanceResult.data.balance);
                setWalletId(balanceResult.data.wallet_id || user.id);
                setLastUpdated(balanceResult.data.updated_at || new Date().toISOString());
            } else {
                // Wallet doesn't exist yet - show 0 balance
                setBalance(0);
                setWalletId(user.id);
                setLastUpdated(new Date().toISOString());
            }

            // Load reward points
            const pointsResult = await referralService.getRewardPoints(user.id);
            if (pointsResult.data) {
                setRewardPoints(pointsResult.data.totalPoints);
                setAvailableCredits(pointsResult.data.totalPoints); // Credits from rewards
            } else {
                setRewardPoints(0);
                setAvailableCredits(0);
            }

            // Load transactions
            const transactionsResult = await walletService.getTransactions(user.id, {
                limit: 20,
            });
            if (transactionsResult.data) {
                const formattedTransactions: Transaction[] = transactionsResult.data.map((t: any) => ({
                    id: t.id,
                    type: t.amount >= 0 ? 'credit' : 'debit',
                    category: t.transactionType || 'booking',
                    amount: Math.abs(t.amount),
                    description: t.description || 'Transaction',
                    timestamp: t.createdAt,
                    status: t.status,
                    icon: TRANSACTION_ICONS[t.transactionType as keyof typeof TRANSACTION_ICONS] || '💵',
                }));
                setTransactions(formattedTransactions);

                // Calculate total spent this month
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthlySpent = formattedTransactions
                    .filter(t =>
                        t.type === 'debit' &&
                        t.status === 'completed' &&
                        new Date(t.timestamp) >= firstDayOfMonth
                    )
                    .reduce((sum, t) => sum + t.amount, 0);
                setTotalSpentThisMonth(monthlySpent);

                // Calculate pending refunds
                const refundsAmount = formattedTransactions
                    .filter(t =>
                        t.category === 'refund' &&
                        t.status === 'pending'
                    )
                    .reduce((sum, t) => sum + t.amount, 0);
                setPendingRefunds(refundsAmount);
            } else {
                setTransactions([]);
                setTotalSpentThisMonth(0);
                setPendingRefunds(0);
            }

            // Load payment methods
            const methodsResult = await walletService.getPaymentMethods(user.id);
            if (methodsResult.data) {
                const formattedMethods: PaymentMethod[] = methodsResult.data.map((m: any) => ({
                    id: m.id,
                    type: m.type,
                    name: m.displayName || m.type,
                    details: m.last4 || m.details || '',
                    isDefault: m.isDefault || false,
                    icon: PAYMENT_METHOD_ICONS[m.type as keyof typeof PAYMENT_METHOD_ICONS] || '💳',
                }));
                setPaymentMethods(formattedMethods);
            } else {
                setPaymentMethods([]);
            }
        } catch (error) {
            console.error('Error loading wallet data:', error);
            // Don't show error alert if it's just no data found
            if (error && typeof error === 'object' && 'code' in error) {
                const errorCode = (error as any).code;
                if (errorCode !== 'PGRST116') { // PGRST116 = no rows returned
                    Alert.alert('Error', 'Failed to load wallet data');
                }
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadWalletData();
    }, []);

    const handleTopUp = () => {
        setShowAddMoneyModal(true);
    };

    const handleAddMoneySuccess = () => {
        loadWalletData(); // Refresh wallet data after successful top-up
    };

    const handleRedeemPoints = () => {
        if (rewardPoints < 100) {
            Alert.alert('Insufficient Points', 'You need at least 100 points to redeem (10)');
            return;
        }

        const redeemableAmount = Math.floor(rewardPoints / 10); // 10 points = 1LKR

        Alert.alert(
            'Redeem Points',
            `Convert ${rewardPoints} points to ₹${redeemableAmount}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Redeem',
                    onPress: async () => {
                        try {
                            // TODO: Implement actual redemption API
                            Alert.alert('Success', `₹${redeemableAmount} added to your wallet!`);
                            setBalance(prev => prev + redeemableAmount);
                            setRewardPoints(0);
                            loadWalletData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to redeem points');
                        }
                    },
                },
            ]
        );
    };

    const handleViewAllTransactions = () => {
        // TODO: Navigate to TransactionHistoryScreen
        Alert.alert('Transaction History', 'View full transaction history');
    };

    const handleManagePaymentMethods = () => {
        // TODO: Navigate to PaymentMethodsScreen
        Alert.alert('Payment Methods', 'Manage your payment methods');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const renderBalanceCard = () => (
        <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
                <View>
                    <Text style={styles.balanceLabel}>My Wallet & Payments</Text>
                    <Text style={styles.walletIdText}>ID: {walletId.substring(0, 8)}...</Text>
                </View>
                <TouchableOpacity onPress={handleTopUp} style={styles.topUpButton}>
                    <Text style={styles.topUpButtonText}>+ Add Money</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
            <Text style={styles.balanceSubtext}>Current Wallet Balance</Text>

            {/* Summary Stats Grid */}
            <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Spent This Month</Text>
                    <Text style={styles.summaryValue}>₹{totalSpentThisMonth.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Available Credits</Text>
                    <Text style={styles.summaryValueGreen}>₹{availableCredits.toFixed(0)}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Pending Refunds</Text>
                    <Text style={styles.summaryValueOrange}>₹{pendingRefunds.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.rewardPointsContainer}>
                <View style={styles.rewardPointsInfo}>
                    <Text style={styles.rewardPointsLabel}>Referral Rewards</Text>
                    <Text style={styles.rewardPointsValue}>{rewardPoints} pts</Text>
                </View>
                {rewardPoints >= 100 && (
                    <TouchableOpacity onPress={handleRedeemPoints} style={styles.redeemButton}>
                        <Text style={styles.redeemButtonText}>Redeem</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.lastUpdatedText}>
                Last Updated: {new Date(lastUpdated).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </Text>
        </View>
    );

    const renderQuickActions = () => (
        <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionCard} onPress={handleTopUp}>
                <Text style={styles.quickActionIcon}></Text>
                <Text style={styles.quickActionLabel}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={handleViewAllTransactions}>
                <Text style={styles.quickActionIcon}></Text>
                <Text style={styles.quickActionLabel}>Transaction History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={handleManagePaymentMethods}>
                <Text style={styles.quickActionIcon}></Text>
                <Text style={styles.quickActionLabel}>View Payment Methods</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={handleRedeemPoints}>
                <Text style={styles.quickActionIcon}></Text>
                <Text style={styles.quickActionLabel}>Redeem Rewards</Text>
            </TouchableOpacity>
        </View>
    );

    const renderTransactionItem = (transaction: Transaction) => {
        const isCredit = transaction.type === 'credit';
        const statusColor =
            transaction.status === 'completed' ? palette.success :
                transaction.status === 'pending' ? palette.warning :
                    palette.danger;

        return (
            <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIconContainer}>
                    <Text style={styles.transactionIcon}>{transaction.icon}</Text>
                </View>

                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <View style={styles.transactionMeta}>
                        <Text style={styles.transactionDate}>
                            {formatDate(transaction.timestamp)} · {formatTime(transaction.timestamp)}
                        </Text>
                        {transaction.status !== 'completed' && (
                            <>
                                <Text style={styles.transactionMetaDot}>•</Text>
                                <Text style={[styles.transactionStatus, { color: statusColor }]}>
                                    {transaction.status}
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                <Text style={[
                    styles.transactionAmount,
                    isCredit ? styles.transactionAmountCredit : styles.transactionAmountDebit
                ]}>
                    {isCredit ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderPaymentMethodItem = (method: PaymentMethod) => (
        <View key={method.id} style={styles.paymentMethodItem}>
            <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
            <View style={styles.paymentMethodDetails}>
                <Text style={styles.paymentMethodName}>{method.name}</Text>
                <Text style={styles.paymentMethodInfo}>{method.details}</Text>
            </View>
            {method.isDefault && (
                <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading wallet...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={palette.brandPrimary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>My Wallet</Text>
                </View>

                {/* Balance Card */}
                {renderBalanceCard()}

                {/* Quick Actions */}
                {renderQuickActions()}

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <TouchableOpacity onPress={handleViewAllTransactions}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {transactions.length > 0 ? (
                        <View style={styles.transactionsList}>
                            {transactions.slice(0, 5).map((transaction) => renderTransactionItem(transaction))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateIcon}></Text>
                            <Text style={styles.emptyStateTitle}>No transactions yet</Text>
                            <Text style={styles.emptyStateText}>
                                Your transaction history will appear here
                            </Text>
                        </View>
                    )}
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Payment Methods</Text>
                        <TouchableOpacity onPress={handleManagePaymentMethods}>
                            <Text style={styles.seeAllText}>Manage</Text>
                        </TouchableOpacity>
                    </View>

                    {paymentMethods.length > 0 ? (
                        <View style={styles.paymentMethodsList}>
                            {paymentMethods.map((method) => renderPaymentMethodItem(method))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateIcon}>💳</Text>
                            <Text style={styles.emptyStateTitle}>No payment methods</Text>
                            <Text style={styles.emptyStateText}>
                                Add a payment method to start using your wallet
                            </Text>
                            <TouchableOpacity style={styles.addPaymentButton} onPress={handleManagePaymentMethods}>
                                <Text style={styles.addPaymentButtonText}>+ Add Payment Method</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>💡</Text>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>How to earn rewards?</Text>
                        <Text style={styles.infoText}>
                            • Book gym sessions regularly{'\n'}
                            • Refer friends to SIXFINITY{'\n'}
                            • Complete fitness challenges{'\n'}
                            • Maintain workout streaks
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Add Money Modal */}
            <AddMoneyModal
                visible={showAddMoneyModal}
                onClose={() => setShowAddMoneyModal(false)}
                onSuccess={handleAddMoneySuccess}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: spacing.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        fontSize: 18,
        color: palette.textSecondary,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    title: {
        ...typography.heading1,
        color: palette.textPrimary,
    },
    balanceCard: {
        backgroundColor: palette.brandPrimary,
        borderRadius: 16,
        padding: spacing.lg,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    balanceLabel: {
        ...typography.body,
        fontSize: 16,
        fontWeight: '600',
        color: palette.background,
        opacity: 0.9,
    },
    walletIdText: {
        ...typography.caption,
        fontSize: 11,
        color: palette.background,
        opacity: 0.7,
        marginTop: 2,
    },
    topUpButton: {
        backgroundColor: palette.background,
        borderRadius: 8,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    topUpButtonText: {
        ...typography.bodyBold,
        fontSize: 14,
        color: palette.brandPrimary,
    },
    balanceAmount: {
        ...typography.display,
        color: palette.background,
        marginBottom: spacing.xs,
    },
    balanceSubtext: {
        ...typography.caption,
        fontSize: 12,
        color: palette.background,
        opacity: 0.8,
        marginBottom: spacing.md,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    summaryItem: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 8,
        padding: spacing.sm,
        alignItems: 'center',
    },
    summaryLabel: {
        ...typography.caption,
        fontSize: 10,
        color: palette.background,
        opacity: 0.8,
        marginBottom: 4,
        textAlign: 'center',
    },
    summaryValue: {
        ...typography.bodyBold,
        fontSize: 14,
        color: palette.background,
    },
    summaryValueGreen: {
        ...typography.bodyBold,
        fontSize: 14,
        color: '#4CAF50',
    },
    summaryValueOrange: {
        ...typography.bodyBold,
        fontSize: 14,
        color: '#FF9800',
    },
    rewardPointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 8,
        padding: spacing.sm,
    },
    rewardPointsInfo: {
        flex: 1,
    },
    rewardPointsLabel: {
        ...typography.caption,
        color: palette.background,
        opacity: 0.9,
        marginBottom: 2,
    },
    rewardPointsValue: {
        ...typography.bodyBold,
        fontSize: 18,
        color: palette.background,
    },
    redeemButton: {
        backgroundColor: palette.background,
        borderRadius: 6,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    redeemButtonText: {
        ...typography.bodyBold,
        fontSize: 14,
        color: palette.brandPrimary,
    },
    lastUpdatedText: {
        ...typography.caption,
        fontSize: 10,
        color: palette.background,
        opacity: 0.7,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    quickActionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    quickActionIcon: {
        fontSize: 28,
        marginBottom: spacing.xs,
    },
    quickActionLabel: {
        ...typography.caption,
        color: palette.textPrimary,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
    },
    seeAllText: {
        ...typography.bodyBold,
        fontSize: 14,
        color: palette.brandPrimary,
    },
    transactionsList: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: 'hidden',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    transactionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    transactionIcon: {
        fontSize: 20,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDescription: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: 2,
    },
    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionDate: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    transactionMetaDot: {
        ...typography.caption,
        color: palette.textSecondary,
        marginHorizontal: spacing.xs,
    },
    transactionStatus: {
        ...typography.caption,
        textTransform: 'capitalize',
    },
    transactionAmount: {
        ...typography.bodyBold,
        fontSize: 16,
    },
    transactionAmountCredit: {
        color: palette.success,
    },
    transactionAmountDebit: {
        color: palette.textPrimary,
    },
    paymentMethodsList: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: 'hidden',
    },
    paymentMethodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    paymentMethodIcon: {
        fontSize: 24,
        marginRight: spacing.sm,
    },
    paymentMethodDetails: {
        flex: 1,
    },
    paymentMethodName: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: 2,
    },
    paymentMethodInfo: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    defaultBadge: {
        backgroundColor: palette.brandPrimary + '20',
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: spacing.xs,
    },
    defaultBadgeText: {
        ...typography.caption,
        fontSize: 11,
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
    },
    emptyStateIcon: {
        fontSize: 48,
        marginBottom: spacing.sm,
        opacity: 0.3,
    },
    emptyStateTitle: {
        ...typography.heading3,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    emptyStateText: {
        ...typography.caption,
        color: palette.textTertiary,
        textAlign: 'center',
        maxWidth: 250,
    },
    addPaymentButton: {
        backgroundColor: palette.brandPrimary,
        borderRadius: 8,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    addPaymentButtonText: {
        ...typography.bodyBold,
        color: palette.background,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: palette.brandPrimary + '15',
        borderRadius: 12,
        padding: spacing.md,
        marginHorizontal: spacing.lg,
        borderWidth: 1,
        borderColor: palette.brandPrimary + '30',
    },
    infoIcon: {
        fontSize: 24,
        marginRight: spacing.sm,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    infoText: {
        ...typography.caption,
        color: palette.textSecondary,
        lineHeight: 20,
    },
});
