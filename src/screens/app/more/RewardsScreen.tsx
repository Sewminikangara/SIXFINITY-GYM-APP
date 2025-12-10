import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';

type TierType = 'bronze' | 'silver' | 'gold' | 'platinum';

interface RewardsBalance {
    totalPoints: number;
    currentTier: TierType;
    expiringPoints: number;
    expiryDate: Date;
}

interface PointsTransaction {
    id: string;
    type: 'earned' | 'redeemed' | 'expired';
    description: string;
    points: number;
    date: Date;
}

interface RedemptionOption {
    id: string;
    title: string;
    description: string;
    pointsCost: number;
    icon: string;
    value: number;
}

export default function RewardsScreen() {
    const navigation = useNavigation();
    const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'redeem'>('overview');

    // Placeholder data
    const balance: RewardsBalance = {
        totalPoints: 1250,
        currentTier: 'silver',
        expiringPoints: 150,
        expiryDate: new Date(Date.now() + 30 * 86400000), // 30 days
    };

    const transactions: PointsTransaction[] = [
        {
            id: '1',
            type: 'earned',
            description: 'Gym check-in bonus',
            points: 50,
            date: new Date(Date.now() - 86400000),
        },
        {
            id: '2',
            type: 'earned',
            description: 'Weekly goal completed',
            points: 100,
            date: new Date(Date.now() - 86400000 * 3),
        },
        {
            id: '3',
            type: 'redeemed',
            description: 'Redeemed for Rs. 10 discount',
            points: -200,
            date: new Date(Date.now() - 86400000 * 7),
        },
        {
            id: '4',
            type: 'earned',
            description: 'Referral bonus',
            points: 200,
            date: new Date(Date.now() - 86400000 * 10),
        },
        {
            id: '5',
            type: 'expired',
            description: 'Points expired',
            points: -50,
            date: new Date(Date.now() - 86400000 * 15),
        },
    ];

    const redemptionOptions: RedemptionOption[] = [
        {
            id: '1',
            title: 'Rs. 250 Discount',
            description: 'Use on any booking',
            pointsCost: 100,
            icon: 'Rs. 250',
            value: 250,
        },
        {
            id: '2',
            title: 'Rs. 500 Discount',
            description: 'Use on any booking',
            pointsCost: 200,
            icon: 'Rs. 500',
            value: 500,
        },
        {
            id: '3',
            title: 'Rs. 1,000 Discount',
            description: 'Use on any booking',
            pointsCost: 500,
            icon: 'Rs. 1K',
            value: 1000,
        },
        {
            id: '4',
            title: 'Rs. 2,500 Discount',
            description: 'Use on any booking',
            pointsCost: 1000,
            icon: 'Rs. 2.5K',
            value: 2500,
        },
        {
            id: '5',
            title: 'Free Session',
            description: '1 free gym session',
            pointsCost: 1500,
            icon: 'FREE',
            value: 5000,
        },
        {
            id: '6',
            title: 'Premium Month',
            description: '1 month premium features',
            pointsCost: 2000,
            icon: 'PRO',
            value: 199,
        },
    ];

    const tierInfo = {
        bronze: { name: 'Bronze', minPoints: 0, color: '#CD7F32', icon: 'BR' },
        silver: { name: 'Silver', minPoints: 500, color: '#C0C0C0', icon: 'SI' },
        gold: { name: 'Gold', minPoints: 2000, color: '#FFD700', icon: 'GO' },
        platinum: { name: 'Platinum', minPoints: 5000, color: '#E5E4E2', icon: 'PL' },
    };

    const currentTierInfo = tierInfo[balance.currentTier];
    const nextTier = balance.currentTier === 'bronze' ? 'silver' :
        balance.currentTier === 'silver' ? 'gold' :
            balance.currentTier === 'gold' ? 'platinum' : null;
    const nextTierInfo = nextTier ? tierInfo[nextTier] : null;
    const pointsToNextTier = nextTierInfo ? nextTierInfo.minPoints - balance.totalPoints : 0;

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'earned':
                return '➕';
            case 'redeemed':
                return '➖';
            case 'expired':
                return '⏰';
            default:
                return '•';
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'earned':
                return palette.success;
            case 'redeemed':
                return palette.brandPrimary;
            case 'expired':
                return palette.textTertiary;
            default:
                return palette.textSecondary;
        }
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleRedeem = (option: RedemptionOption) => {
        if (balance.totalPoints < option.pointsCost) {
            Alert.alert(
                'Insufficient Points',
                `You need ${option.pointsCost - balance.totalPoints} more points to redeem this reward.`
            );
            return;
        }

        Alert.alert(
            'Redeem Reward',
            `Redeem ${option.title} for ${option.pointsCost} points?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Redeem',
                    onPress: () => Alert.alert('Success', 'Reward redeemed! Check your wallet for the discount code.'),
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rewards</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
                    onPress={() => setSelectedTab('overview')}
                >
                    <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
                        Overview
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
                    onPress={() => setSelectedTab('history')}
                >
                    <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
                        History
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'redeem' && styles.activeTab]}
                    onPress={() => setSelectedTab('redeem')}
                >
                    <Text style={[styles.tabText, selectedTab === 'redeem' && styles.activeTabText]}>
                        Redeem
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Overview Tab */}
                {selectedTab === 'overview' && (
                    <>
                        {/* Points Balance Card */}
                        <View style={[styles.balanceCard, { backgroundColor: currentTierInfo.color }]}>
                            <View style={styles.balanceHeader}>
                                <View>
                                    <Text style={styles.balanceLabel}>Your Points</Text>
                                    <Text style={styles.balanceAmount}>{balance.totalPoints}</Text>
                                </View>
                                <Text style={styles.tierIcon}>{currentTierInfo.icon}</Text>
                            </View>
                            <View style={styles.tierBadge}>
                                <Text style={styles.tierText}>{currentTierInfo.name} Member</Text>
                            </View>
                        </View>

                        {/* Next Tier Progress */}
                        {nextTierInfo && (
                            <View style={styles.progressCard}>
                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressTitle}>
                                        {pointsToNextTier} points to {nextTierInfo.name}
                                    </Text>
                                    <Text style={styles.progressIcon}>{nextTierInfo.icon}</Text>
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <View
                                        style={[
                                            styles.progressBar,
                                            {
                                                width: `${Math.min((balance.totalPoints / nextTierInfo.minPoints) * 100, 100)}%`,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressSubtext}>
                                    Keep earning to unlock {nextTierInfo.name} benefits!
                                </Text>
                            </View>
                        )}

                        {/* Expiring Points Warning */}
                        {balance.expiringPoints > 0 && (
                            <View style={styles.warningCard}>
                                <Text style={styles.warningIcon}>⚠️</Text>
                                <View style={styles.warningContent}>
                                    <Text style={styles.warningTitle}>Points Expiring Soon</Text>
                                    <Text style={styles.warningText}>
                                        {balance.expiringPoints} points expire on{' '}
                                        {balance.expiryDate.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* How to Earn */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>💡 How to Earn Points</Text>
                            <View style={styles.earnList}>
                                <View style={styles.earnItem}>
                                    <Text style={styles.earnIcon}></Text>
                                    <View style={styles.earnDetails}>
                                        <Text style={styles.earnText}>Gym Check-in</Text>
                                        <Text style={styles.earnSubtext}>50 points per visit</Text>
                                    </View>
                                    <Text style={styles.earnPoints}>+50</Text>
                                </View>
                                <View style={styles.earnItem}>
                                    <Text style={styles.earnIcon}></Text>
                                    <View style={styles.earnDetails}>
                                        <Text style={styles.earnText}>Complete Booking</Text>
                                        <Text style={styles.earnSubtext}>10 points per Rs. 500 spent</Text>
                                    </View>
                                    <Text style={styles.earnPoints}>+10</Text>
                                </View>
                                <View style={styles.earnItem}>
                                    <Text style={styles.earnIcon}></Text>
                                    <View style={styles.earnDetails}>
                                        <Text style={styles.earnText}>Weekly Goal</Text>
                                        <Text style={styles.earnSubtext}>Complete fitness goals</Text>
                                    </View>
                                    <Text style={styles.earnPoints}>+100</Text>
                                </View>
                                <View style={styles.earnItem}>
                                    <Text style={styles.earnIcon}></Text>
                                    <View style={styles.earnDetails}>
                                        <Text style={styles.earnText}>Refer a Friend</Text>
                                        <Text style={styles.earnSubtext}>Per successful signup</Text>
                                    </View>
                                    <Text style={styles.earnPoints}>+200</Text>
                                </View>
                            </View>
                        </View>

                        {/* Tier Benefits */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}> Tier Benefits</Text>
                            <View style={styles.tiersList}>
                                {Object.entries(tierInfo).map(([key, tier]) => (
                                    <View
                                        key={key}
                                        style={[
                                            styles.tierCard,
                                            balance.currentTier === key && styles.currentTierCard,
                                        ]}
                                    >
                                        <View style={styles.tierCardHeader}>
                                            <Text style={styles.tierCardIcon}>{tier.icon}</Text>
                                            <Text style={styles.tierCardName}>{tier.name}</Text>
                                            {balance.currentTier === key && (
                                                <View style={styles.currentBadge}>
                                                    <Text style={styles.currentBadgeText}>Current</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.tierMinPoints}>{tier.minPoints}+ points</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* History Tab */}
                {selectedTab === 'history' && (
                    <View style={styles.section}>
                        {transactions.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>📜</Text>
                                <Text style={styles.emptyText}>No transaction history</Text>
                            </View>
                        ) : (
                            <View style={styles.transactionsList}>
                                {transactions.map((transaction) => (
                                    <View key={transaction.id} style={styles.transactionCard}>
                                        <View style={styles.transactionLeft}>
                                            <View
                                                style={[
                                                    styles.transactionIconContainer,
                                                    { backgroundColor: `${getTransactionColor(transaction.type)}20` },
                                                ]}
                                            >
                                                <Text style={styles.transactionIcon}>
                                                    {getTransactionIcon(transaction.type)}
                                                </Text>
                                            </View>
                                            <View style={styles.transactionDetails}>
                                                <Text style={styles.transactionDescription}>
                                                    {transaction.description}
                                                </Text>
                                                <Text style={styles.transactionDate}>
                                                    {formatDate(transaction.date)}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text
                                            style={[
                                                styles.transactionPoints,
                                                { color: getTransactionColor(transaction.type) },
                                            ]}
                                        >
                                            {transaction.points > 0 ? '+' : ''}
                                            {transaction.points}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Redeem Tab */}
                {selectedTab === 'redeem' && (
                    <View style={styles.section}>
                        <View style={styles.redeemHeader}>
                            <Text style={styles.redeemBalance}>
                                Available: <Text style={styles.redeemBalanceAmount}>{balance.totalPoints}</Text> points
                            </Text>
                        </View>
                        <View style={styles.redemptionGrid}>
                            {redemptionOptions.map((option) => {
                                const canRedeem = balance.totalPoints >= option.pointsCost;
                                return (
                                    <View key={option.id} style={styles.redemptionCard}>
                                        <Text style={styles.redemptionIcon}>{option.icon}</Text>
                                        <Text style={styles.redemptionTitle}>{option.title}</Text>
                                        <Text style={styles.redemptionDescription}>{option.description}</Text>
                                        <Text style={styles.redemptionCost}>{option.pointsCost} points</Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.redeemButton,
                                                !canRedeem && styles.redeemButtonDisabled,
                                            ]}
                                            onPress={() => handleRedeem(option)}
                                            disabled={!canRedeem}
                                        >
                                            <Text
                                                style={[
                                                    styles.redeemButtonText,
                                                    !canRedeem && styles.redeemButtonTextDisabled,
                                                ]}
                                            >
                                                {canRedeem ? 'Redeem' : 'Not Enough Points'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
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
        fontSize: 16,
        color: palette.brandPrimary,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: palette.brandPrimary,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
        color: palette.textSecondary,
    },
    activeTabText: {
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    balanceCard: {
        margin: spacing.md,
        padding: spacing.lg,
        borderRadius: 20,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    balanceLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: spacing.xs,
    },
    balanceAmount: {
        fontSize: 40,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    tierIcon: {
        fontSize: 48,
    },
    tierBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    tierText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    progressCard: {
        backgroundColor: palette.surface,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.lg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    progressTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    progressIcon: {
        fontSize: 24,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: palette.border,
        borderRadius: 4,
        marginBottom: spacing.sm,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: palette.brandPrimary,
        borderRadius: 4,
    },
    progressSubtext: {
        fontSize: 12,
        color: palette.textSecondary,
    },
    warningCard: {
        backgroundColor: `${palette.warning}15`,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: `${palette.warning}40`,
    },
    warningIcon: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    warningContent: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    warningText: {
        fontSize: 12,
        color: palette.textSecondary,
    },
    section: {
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    earnList: {
        gap: spacing.sm,
    },
    earnItem: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    earnIcon: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    earnDetails: {
        flex: 1,
    },
    earnText: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    earnSubtext: {
        fontSize: 12,
        color: palette.textSecondary,
    },
    earnPoints: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.success,
    },
    tiersList: {
        gap: spacing.sm,
    },
    tierCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    currentTierCard: {
        borderColor: palette.brandPrimary,
        borderWidth: 2,
        backgroundColor: `${palette.brandPrimary}05`,
    },
    tierCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    tierCardIcon: {
        fontSize: 24,
        marginRight: spacing.sm,
    },
    tierCardName: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.textPrimary,
        flex: 1,
    },
    currentBadge: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
    },
    currentBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    tierMinPoints: {
        fontSize: 13,
        color: palette.textSecondary,
    },
    emptyContainer: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    transactionsList: {
        gap: spacing.sm,
    },
    transactionCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: palette.border,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    transactionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    transactionIcon: {
        fontSize: 18,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDescription: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    transactionDate: {
        fontSize: 12,
        color: palette.textSecondary,
    },
    transactionPoints: {
        fontSize: 16,
        fontWeight: '700',
    },
    redeemHeader: {
        backgroundColor: palette.surface,
        padding: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    redeemBalance: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    redeemBalanceAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.brandPrimary,
    },
    redemptionGrid: {
        gap: spacing.md,
    },
    redemptionCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    redemptionIcon: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    redemptionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    redemptionDescription: {
        fontSize: 13,
        color: palette.textSecondary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    redemptionCost: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.brandPrimary,
        marginBottom: spacing.md,
    },
    redeemButton: {
        backgroundColor: palette.brandPrimary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    redeemButtonDisabled: {
        backgroundColor: palette.border,
    },
    redeemButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    redeemButtonTextDisabled: {
        color: palette.textTertiary,
    },
});
