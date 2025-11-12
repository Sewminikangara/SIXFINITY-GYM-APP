/**
 * Referral Service
 * Handles referral system, rewards, points wallet, and referral analytics
 */

import { supabase } from '@/config/supabaseClient';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Referral {
    referral_id: string;
    referrer_id: string;
    referee_id: string | null;
    referee_email: string | null;
    referee_phone: string | null;
    referral_code: string;
    status: 'pending' | 'signup_completed' | 'verified' | 'subscribed' | 'active' | 'inactive' | 'expired';
    signup_completed_at: string | null;
    verified_at: string | null;
    first_subscription_at: string | null;
    first_workout_at: string | null;
    retention_30_days: boolean;
    retention_60_days: boolean;
    retention_90_days: boolean;
    rewards_earned: number;
    rewards_paid_to_referrer: number;
    rewards_paid_to_referee: number;
    current_stage: 'signup' | 'verification' | 'subscription' | 'first_workout' | 'retention_30days' | 'retention_60days' | 'retention_90days' | 'completed';
    referral_channel: string | null;
    ip_address: string | null;
    device_info: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ReferralReward {
    reward_id: string;
    referral_id: string;
    user_id: string;
    user_type: 'referrer' | 'referee';
    stage: 'signup' | 'verification' | 'subscription' | 'first_workout' | 'retention_30days' | 'retention_60days' | 'retention_90days';
    reward_type: 'points' | 'cash' | 'discount' | 'credits' | 'combo';
    points_earned: number;
    cash_earned: number;
    discount_code: string | null;
    discount_percentage: number | null;
    credits_earned: number | null;
    status: 'pending' | 'approved' | 'paid' | 'expired' | 'canceled';
    approved_at: string | null;
    paid_at: string | null;
    payment_method: string | null;
    transaction_id: string | null;
    expiry_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface RewardPointsWallet {
    wallet_id: string;
    user_id: string;
    total_points_earned: number;
    total_points_redeemed: number;
    current_balance: number;
    lifetime_value: number;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
    tier_benefits: any;
    next_tier: string | null;
    points_to_next_tier: number | null;
    is_active: boolean;
    last_updated: string;
    created_at: string;
}

export interface RewardTransaction {
    transaction_id: string;
    wallet_id: string;
    user_id: string;
    transaction_type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'refunded';
    points_amount: number;
    balance_after: number;
    source: string | null;
    referral_id: string | null;
    redeemed_for: string | null;
    redeemed_value: number | null;
    description: string | null;
    metadata: any;
    expires_at: string | null;
    created_at: string;
}

export interface ReferralConfig {
    stage: string;
    referrer_points: number;
    referrer_cash: number;
    referee_points: number;
    referee_cash: number;
}

export interface ReferralStats {
    totalReferrals: number;
    activeReferrals: number;
    completedSignups: number;
    verifiedReferrals: number;
    subscribedReferrals: number;
    totalRewardsEarned: number;
    totalPointsEarned: number;
    totalCashEarned: number;
    currentTier: string;
    pointsBalance: number;
}

// ============================================================================
// REFERRAL CODE OPERATIONS
// ============================================================================

/**
 * Get user's referral code
 */
export const getReferralCode = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('referral_code')
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        return { data: data?.referral_code, error: null };
    } catch (error: any) {
        console.error('Error fetching referral code:', error);
        return { data: null, error: error };
    }
};

/**
 * Generate referral code (typically handled by database trigger)
 */
export const generateReferralCode = async (userId: string) => {
    try {
        // Call database function
        const { data, error } = await supabase.rpc('generate_referral_code');

        if (error) throw error;

        // Update user profile
        await supabase
            .from('user_profiles')
            .update({ referral_code: data })
            .eq('user_id', userId);

        return { data, error: null };
    } catch (error: any) {
        console.error('Error generating referral code:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// REFERRAL OPERATIONS
// ============================================================================

/**
 * Get all referrals for a user
 */
export const getReferrals = async (
    userId: string,
    filters?: {
        status?: Referral['status'];
        stage?: Referral['current_stage'];
        limit?: number;
    }
) => {
    try {
        let query = supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.stage) {
            query = query.eq('current_stage', filters.stage);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching referrals:', error);
        return { data: null, error: error };
    }
};

/**
 * Get a single referral
 */
export const getReferral = async (referralId: string) => {
    try {
        const { data, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('referral_id', referralId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching referral:', error);
        return { data: null, error: error };
    }
};

/**
 * Get referral by code
 */
export const getReferralByCode = async (referralCode: string) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, referral_code')
            .eq('referral_code', referralCode)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching referral by code:', error);
        return { data: null, error: error };
    }
};

/**
 * Create a referral
 */
export const createReferral = async (
    referrerCode: string,
    refereeEmail?: string,
    refereePhone?: string,
    metadata?: {
        ip_address?: string;
        device_info?: string;
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
    }
) => {
    try {
        // Get referrer ID from code
        const { data: referrer } = await getReferralByCode(referrerCode);
        if (!referrer) {
            throw new Error('Invalid referral code');
        }

        const { data, error } = await supabase
            .from('referrals')
            .insert({
                referrer_id: referrer.user_id,
                referee_email: refereeEmail || null,
                referee_phone: refereePhone || null,
                referral_code: referrerCode,
                status: 'pending',
                current_stage: 'signup',
                ...metadata,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating referral:', error);
        return { data: null, error: error };
    }
};

/**
 * Process referral stage (triggers reward calculation)
 */
export const processReferralStage = async (
    referralId: string,
    stage: ReferralReward['stage']
) => {
    try {
        // Call database function to process rewards
        const { data, error } = await supabase.rpc('process_referral_reward', {
            p_referral_id: referralId,
            p_stage: stage,
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error processing referral stage:', error);
        return { data: null, error: error };
    }
};

/**
 * Update referral status
 */
export const updateReferralStatus = async (
    referralId: string,
    status: Referral['status'],
    stage?: Referral['current_stage']
) => {
    try {
        const updates: any = { status };
        if (stage) {
            updates.current_stage = stage;
        }

        const { data, error } = await supabase
            .from('referrals')
            .update(updates)
            .eq('referral_id', referralId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating referral status:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// REFERRAL REWARDS OPERATIONS
// ============================================================================

/**
 * Get rewards for a user
 */
export const getRewards = async (
    userId: string,
    filters?: {
        user_type?: ReferralReward['user_type'];
        stage?: ReferralReward['stage'];
        status?: ReferralReward['status'];
        limit?: number;
    }
) => {
    try {
        let query = supabase
            .from('referral_rewards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (filters?.user_type) {
            query = query.eq('user_type', filters.user_type);
        }
        if (filters?.stage) {
            query = query.eq('stage', filters.stage);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching rewards:', error);
        return { data: null, error: error };
    }
};

/**
 * Get total rewards earned
 */
export const getTotalRewardsEarned = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('referral_rewards')
            .select('points_earned, cash_earned')
            .eq('user_id', userId)
            .eq('status', 'paid');

        if (error) throw error;

        const totalPoints = data?.reduce((sum, r) => sum + (r.points_earned || 0), 0) || 0;
        const totalCash = data?.reduce((sum, r) => sum + (r.cash_earned || 0), 0) || 0;

        return {
            data: {
                totalPoints,
                totalCash,
                totalRewards: data?.length || 0,
            },
            error: null,
        };
    } catch (error: any) {
        console.error('Error calculating total rewards:', error);
        return {
            data: { totalPoints: 0, totalCash: 0, totalRewards: 0 },
            error: error,
        };
    }
};

// ============================================================================
// REWARD POINTS WALLET OPERATIONS
// ============================================================================

/**
 * Get reward points wallet
 */
export const getRewardWallet = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('reward_points_wallet')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching reward wallet:', error);
        return { data: null, error: error };
    }
};

/**
 * Get reward points balance
 */
export const getRewardPoints = async (userId: string) => {
    try {
        const { data } = await getRewardWallet(userId);
        return { data: data?.current_balance || 0, error: null };
    } catch (error: any) {
        console.error('Error fetching reward points:', error);
        return { data: 0, error: error };
    }
};

/**
 * Create reward points wallet (typically called automatically)
 */
export const createRewardWallet = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('reward_points_wallet')
            .insert({
                user_id: userId,
                tier: 'Bronze',
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating reward wallet:', error);
        return { data: null, error: error };
    }
};

/**
 * Redeem reward points
 */
export const redeemPoints = async (
    userId: string,
    points: number,
    redeemedFor: string,
    redeemedValue: number
) => {
    try {
        // Get wallet
        const { data: wallet } = await getRewardWallet(userId);
        if (!wallet) {
            throw new Error('Reward wallet not found');
        }

        if (wallet.current_balance < points) {
            throw new Error('Insufficient points balance');
        }

        // Call database function to redeem
        const { data, error } = await supabase.rpc('redeem_reward_points', {
            p_user_id: userId,
            p_points: points,
            p_redeemed_for: redeemedFor,
            p_value: redeemedValue,
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error redeeming points:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// REWARD TRANSACTIONS OPERATIONS
// ============================================================================

/**
 * Get reward transaction history
 */
export const getRewardHistory = async (userId: string, limit: number = 20) => {
    try {
        const { data, error } = await supabase
            .from('reward_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching reward history:', error);
        return { data: null, error: error };
    }
};

/**
 * Get transaction by ID
 */
export const getRewardTransaction = async (transactionId: string) => {
    try {
        const { data, error } = await supabase
            .from('reward_transactions')
            .select('*')
            .eq('transaction_id', transactionId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching reward transaction:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// REFERRAL STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get comprehensive referral statistics
 */
export const getReferralStats = async (userId: string): Promise<{ data: ReferralStats | null; error: any }> => {
    try {
        // Get all referrals
        const { data: referrals } = await getReferrals(userId);

        // Get reward wallet
        const { data: wallet } = await getRewardWallet(userId);

        // Get total rewards
        const { data: rewards } = await getTotalRewardsEarned(userId);

        // Calculate statistics
        const stats: ReferralStats = {
            totalReferrals: referrals?.length || 0,
            activeReferrals: referrals?.filter(r => r.status === 'active').length || 0,
            completedSignups: referrals?.filter(r => r.signup_completed_at !== null).length || 0,
            verifiedReferrals: referrals?.filter(r => r.verified_at !== null).length || 0,
            subscribedReferrals: referrals?.filter(r => r.first_subscription_at !== null).length || 0,
            totalRewardsEarned: rewards?.totalRewards || 0,
            totalPointsEarned: rewards?.totalPoints || 0,
            totalCashEarned: rewards?.totalCash || 0,
            currentTier: wallet?.tier || 'Bronze',
            pointsBalance: wallet?.current_balance || 0,
        };

        return { data: stats, error: null };
    } catch (error: any) {
        console.error('Error fetching referral stats:', error);
        return { data: null, error: error };
    }
};

/**
 * Get tier progress
 */
export const getTierProgress = async (userId: string) => {
    try {
        const { data: wallet } = await getRewardWallet(userId);
        if (!wallet) {
            throw new Error('Reward wallet not found');
        }

        // Tier thresholds (points needed)
        const tierThresholds = {
            Bronze: 0,
            Silver: 1000,
            Gold: 5000,
            Platinum: 15000,
            Diamond: 50000,
        };

        const currentTierPoints = tierThresholds[wallet.tier as keyof typeof tierThresholds];
        const nextTier = wallet.next_tier;
        const nextTierPoints = nextTier ? tierThresholds[nextTier as keyof typeof tierThresholds] : null;
        const pointsToNextTier = nextTierPoints ? nextTierPoints - wallet.total_points_earned : 0;
        const progressPercentage = nextTierPoints
            ? ((wallet.total_points_earned - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100
            : 100;

        return {
            data: {
                currentTier: wallet.tier,
                totalPoints: wallet.total_points_earned,
                currentBalance: wallet.current_balance,
                nextTier: nextTier,
                pointsToNextTier: Math.max(0, pointsToNextTier),
                progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
                tierBenefits: wallet.tier_benefits,
            },
            error: null,
        };
    } catch (error: any) {
        console.error('Error fetching tier progress:', error);
        return { data: null, error: error };
    }
};

/**
 * Get referral leaderboard
 */
export const getReferralLeaderboard = async (limit: number = 10) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, total_referrals, tier')
            .order('total_referrals', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching referral leaderboard:', error);
        return { data: null, error: error };
    }
};

/**
 * Get user's leaderboard rank
 */
export const getUserLeaderboardRank = async (userId: string) => {
    try {
        // Get user's total referrals
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('total_referrals')
            .eq('user_id', userId)
            .single();

        if (!userProfile) {
            throw new Error('User profile not found');
        }

        // Count users with more referrals
        const { count } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .gt('total_referrals', userProfile.total_referrals);

        const rank = (count || 0) + 1;

        return { data: rank, error: null };
    } catch (error: any) {
        console.error('Error fetching user leaderboard rank:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// REFERRAL SHARING
// ============================================================================

/**
 * Generate referral share message
 */
export const generateShareMessage = (referralCode: string, userName?: string) => {
    const appName = 'SIXFINITY';
    const message = userName
        ? `Hey! Join me on ${appName}! Use my code "${referralCode}" to get exclusive rewards when you sign up! 💪🏋️‍♂️`
        : `Join ${appName}! Use code "${referralCode}" to get exclusive rewards! 💪🏋️‍♂️`;

    return message;
};

/**
 * Generate referral link
 */
export const generateReferralLink = (referralCode: string) => {
    const baseUrl = 'https://app.sixfinity.com'; // Replace with actual URL
    return `${baseUrl}/signup?ref=${referralCode}`;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format points with commas
 */
export const formatPoints = (points: number): string => {
    return points.toLocaleString('en-US');
};

/**
 * Calculate points value in currency
 */
export const pointsToCurrency = (points: number, conversionRate: number = 0.01): string => {
    const value = points * conversionRate;
    return `$${value.toFixed(2)}`;
};

/**
 * Get tier color
 */
export const getTierColor = (tier: RewardPointsWallet['tier']): string => {
    const colors = {
        Bronze: '#CD7F32',
        Silver: '#C0C0C0',
        Gold: '#FFD700',
        Platinum: '#E5E4E2',
        Diamond: '#B9F2FF',
    };
    return colors[tier] || colors.Bronze;
};

/**
 * Get tier emoji
 */
export const getTierEmoji = (tier: RewardPointsWallet['tier']): string => {
    const emojis = {
        Bronze: '🥉',
        Silver: '🥈',
        Gold: '🥇',
        Platinum: '💎',
        Diamond: '💠',
    };
    return emojis[tier] || emojis.Bronze;
};

/**
 * Validate referral code format
 */
export const isValidReferralCode = (code: string): boolean => {
    // Must be 8 characters, alphanumeric
    const regex = /^[A-Z0-9]{8}$/;
    return regex.test(code);
};
