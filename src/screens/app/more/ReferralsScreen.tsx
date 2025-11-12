import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    Alert,
    Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';

interface ReferralStats {
    totalReferrals: number;
    successfulSignups: number;
    totalEarnings: number;
    pendingEarnings: number;
}

interface Referral {
    id: string;
    name: string;
    status: 'pending' | 'completed' | 'expired';
    date: Date;
    reward: number;
}

export default function ReferralsScreen() {
    const navigation = useNavigation();

    const referralCode = 'SIXFIT2024';
    const referralLink = `https://sixfinity.app/ref/${referralCode}`;

    // Placeholder data
    const stats: ReferralStats = {
        totalReferrals: 12,
        successfulSignups: 8,
        totalEarnings: 400,
        pendingEarnings: 100,
    };

    const referrals: Referral[] = [
        {
            id: '1',
            name: 'John Doe',
            status: 'completed',
            date: new Date(Date.now() - 86400000 * 5),
            reward: 50,
        },
        {
            id: '2',
            name: 'Sarah Smith',
            status: 'completed',
            date: new Date(Date.now() - 86400000 * 10),
            reward: 50,
        },
        {
            id: '3',
            name: 'Mike Johnson',
            status: 'pending',
            date: new Date(Date.now() - 86400000 * 2),
            reward: 50,
        },
        {
            id: '4',
            name: 'Emily Davis',
            status: 'expired',
            date: new Date(Date.now() - 86400000 * 35),
            reward: 0,
        },
    ];

    const copyToClipboard = async (text: string, label: string) => {
        await Clipboard.setString(text);
        Alert.alert('Copied!', `${label} copied to clipboard`);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join SIXFINITY with my referral code ${referralCode} and get ₹50 off your first booking! ${referralLink}`,
                title: 'Join SIXFINITY',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return palette.success;
            case 'pending':
                return palette.warning;
            case 'expired':
                return palette.textTertiary;
            default:
                return palette.textSecondary;
        }
    };

    const formatDate = (date: Date) => {
        const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return `${Math.floor(days / 30)} months ago`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Referrals</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Referral Code Card */}
                <View style={styles.codeCard}>
                    <Text style={styles.codeCardTitle}>Your Referral Code</Text>
                    <Text style={styles.codeCardSubtitle}>
                        Share your code with friends and earn ₹50 for each successful signup!
                    </Text>

                    <View style={styles.codeContainer}>
                        <View style={styles.codeBox}>
                            <Text style={styles.codeText}>{referralCode}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={() => copyToClipboard(referralCode, 'Referral code')}
                        >
                            <Text style={styles.copyButtonText}>📋 Copy</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.linkContainer}>
                        <Text style={styles.linkLabel}>Referral Link:</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(referralLink, 'Referral link')}>
                            <Text style={styles.linkText} numberOfLines={1}>
                                {referralLink}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <Text style={styles.shareButtonText}>🔗 Share with Friends</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                        <Text style={styles.statLabel}>Total Referrals</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.successfulSignups}</Text>
                        <Text style={styles.statLabel}>Successful</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardWide]}>
                        <Text style={[styles.statValue, { color: palette.success }]}>
                            ₹{stats.totalEarnings}
                        </Text>
                        <Text style={styles.statLabel}>Total Earnings</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardWide]}>
                        <Text style={[styles.statValue, { color: palette.warning }]}>
                            ₹{stats.pendingEarnings}
                        </Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                </View>

                {/* How It Works */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>💡 How It Works</Text>
                    <View style={styles.stepsList}>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.stepText}>Share your unique referral code or link</Text>
                        </View>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepText}>
                                Friend signs up using your code and makes first booking
                            </Text>
                        </View>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.stepText}>
                                Both of you get ₹50 reward credited to wallet!
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Recent Referrals */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Referrals</Text>

                    {referrals.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>👥</Text>
                            <Text style={styles.emptyText}>No referrals yet</Text>
                            <Text style={styles.emptySubtext}>
                                Start sharing your code to earn rewards!
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.referralsList}>
                            {referrals.map((referral) => (
                                <View key={referral.id} style={styles.referralCard}>
                                    <View style={styles.referralInfo}>
                                        <View style={styles.referralAvatar}>
                                            <Text style={styles.referralAvatarText}>
                                                {referral.name.charAt(0)}
                                            </Text>
                                        </View>
                                        <View style={styles.referralDetails}>
                                            <Text style={styles.referralName}>{referral.name}</Text>
                                            <Text style={styles.referralDate}>{formatDate(referral.date)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.referralRight}>
                                        <View
                                            style={[
                                                styles.referralStatusBadge,
                                                { backgroundColor: `${getStatusColor(referral.status)}20` },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.referralStatusText,
                                                    { color: getStatusColor(referral.status) },
                                                ]}
                                            >
                                                {referral.status}
                                            </Text>
                                        </View>
                                        {referral.reward > 0 && (
                                            <Text style={styles.referralReward}>+₹{referral.reward}</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Terms */}
                <View style={styles.termsCard}>
                    <Text style={styles.termsTitle}>📋 Terms & Conditions</Text>
                    <Text style={styles.termsText}>
                        • Referral reward credited after friend completes first booking{'\n'}
                        • Maximum 50 referrals per month{'\n'}
                        • Rewards expire after 90 days if unused{'\n'}
                        • Cannot refer yourself or existing users{'\n'}
                        • SIXFINITY reserves the right to modify terms
                    </Text>
                </View>
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
    scrollView: {
        flex: 1,
    },
    codeCard: {
        backgroundColor: palette.brandPrimary,
        margin: spacing.md,
        padding: spacing.lg,
        borderRadius: 20,
    },
    codeCardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: spacing.xs,
    },
    codeCardSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    codeContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    codeBox: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    codeText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    copyButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    copyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    linkContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: spacing.md,
        borderRadius: 10,
        marginBottom: spacing.md,
    },
    linkLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.8,
        marginBottom: spacing.xs,
    },
    linkText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    shareButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.brandPrimary,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    statCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: palette.border,
        width: '48.5%',
        alignItems: 'center',
    },
    statCardWide: {
        width: '48.5%',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: palette.brandPrimary,
        marginBottom: spacing.xs,
    },
    statLabel: {
        fontSize: 12,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: `${palette.brandPrimary}10`,
        margin: spacing.md,
        padding: spacing.lg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${palette.brandPrimary}30`,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    stepsList: {
        gap: spacing.md,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: palette.brandPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: palette.textSecondary,
        lineHeight: 20,
        paddingTop: 4,
    },
    section: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.md,
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
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        fontSize: 13,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    referralsList: {
        gap: spacing.sm,
    },
    referralCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: palette.border,
    },
    referralInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    referralAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: palette.brandPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    referralAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    referralDetails: {
        flex: 1,
    },
    referralName: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    referralDate: {
        fontSize: 12,
        color: palette.textSecondary,
    },
    referralRight: {
        alignItems: 'flex-end',
    },
    referralStatusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: spacing.xs,
    },
    referralStatusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    referralReward: {
        fontSize: 14,
        fontWeight: '700',
        color: palette.success,
    },
    termsCard: {
        backgroundColor: palette.surface,
        margin: spacing.md,
        padding: spacing.lg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
    },
    termsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    termsText: {
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
    },
});
