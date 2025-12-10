import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Share,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import { palette, spacing, typography } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import * as profileService from '@/services/profileService';
import { getSupabaseUserId } from '@/utils/userHelpers';

interface Achievement {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    requirement: number;
    currentProgress: number;
    unlockedAt: string | null;
    isUnlocked: boolean;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    rewardPoints: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BADGE_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 2) / 3;

const CATEGORIES = [
    { id: 'all', label: 'All', icon: '🏆' },
    { id: 'fitness', label: 'Fitness', icon: '💪' },
    { id: 'consistency', label: 'Consistency', icon: '📅' },
    { id: 'social', label: 'Social', icon: '👥' },
    { id: 'milestones', label: 'Milestones', icon: '🎯' },
    { id: 'special', label: 'Special', icon: '⭐' },
];

const RARITY_COLORS = {
    common: palette.textTertiary,
    rare: palette.accentBlue,
    epic: palette.accentPurple,
    legendary: palette.warning,
};

const RARITY_LABELS = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
};

export const AchievementsScreen: React.FC = () => {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalUnlocked: 0,
        totalAchievements: 0,
        completionRate: 0,
        totalPoints: 0,
    });

    useEffect(() => {
        if (user?.id) {
            loadAchievements();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadAchievements = async () => {
        if (!user?.id) {
            console.log('No user ID available');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        const supabaseUserId = getSupabaseUserId(user);
        if (!supabaseUserId) {
            console.log('No Supabase user ID available');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const result = await profileService.getAchievements(supabaseUserId);
            if (result.error) {
                throw new Error(result.error.message || 'Failed to load achievements');
            }
            const data = result.data || [];
            setAchievements(data);
            filterAchievements(data, selectedCategory);
            calculateStats(data);
        } catch (error) {
            console.error('Error loading achievements:', error);
            Alert.alert('Error', 'Failed to load achievements');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (data: Achievement[]) => {
        const unlocked = data.filter(a => a.isUnlocked).length;
        const total = data.length;
        const points = data.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.rewardPoints, 0);

        setStats({
            totalUnlocked: unlocked,
            totalAchievements: total,
            completionRate: total > 0 ? Math.round((unlocked / total) * 100) : 0,
            totalPoints: points,
        });
    };

    const filterAchievements = (data: Achievement[], category: string) => {
        if (category === 'all') {
            setFilteredAchievements(data);
        } else {
            setFilteredAchievements(data.filter(a => a.category === category));
        }
    };

    useEffect(() => {
        loadAchievements();
    }, []);

    useEffect(() => {
        filterAchievements(achievements, selectedCategory);
    }, [selectedCategory, achievements]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAchievements();
    }, []);

    const handleShare = async (achievement: Achievement) => {
        try {
            await Share.share({
                message: `🏆 I just unlocked "${achievement.title}" on SIXFINITY! ${achievement.description}`,
            });
        } catch (error) {
            console.error('Error sharing achievement:', error);
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
    };

    const getProgressPercentage = (achievement: Achievement) => {
        return Math.min((achievement.currentProgress / achievement.requirement) * 100, 100);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderStatsHeader = () => (
        <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
                <Text style={styles.statsValue}>{stats.totalUnlocked}</Text>
                <Text style={styles.statsLabel}>Unlocked</Text>
            </View>
            <View style={styles.statsCard}>
                <Text style={styles.statsValue}>{stats.completionRate}%</Text>
                <Text style={styles.statsLabel}>Complete</Text>
            </View>
            <View style={styles.statsCard}>
                <Text style={styles.statsValue}>{stats.totalPoints}</Text>
                <Text style={styles.statsLabel}>Points Earned</Text>
            </View>
        </View>
    );

    const renderCategoryFilters = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            style={styles.categoriesScroll}
        >
            {CATEGORIES.map(category => {
                const isSelected = selectedCategory === category.id;
                const categoryAchievements = category.id === 'all'
                    ? achievements
                    : achievements.filter(a => a.category === category.id);
                const unlockedCount = categoryAchievements.filter(a => a.isUnlocked).length;

                return (
                    <TouchableOpacity
                        key={category.id}
                        style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                        onPress={() => handleCategorySelect(category.id)}
                    >
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                        <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}>
                            {category.label}
                        </Text>
                        <View style={[styles.categoryBadge, isSelected && styles.categoryBadgeActive]}>
                            <Text style={[styles.categoryBadgeText, isSelected && styles.categoryBadgeTextActive]}>
                                {unlockedCount}/{categoryAchievements.length}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    const renderAchievementBadge = (achievement: Achievement) => {
        const progressPercentage = getProgressPercentage(achievement);
        const rarityColor = RARITY_COLORS[achievement.rarity];

        return (
            <View key={achievement.id} style={styles.badgeContainer}>
                <TouchableOpacity
                    style={[
                        styles.badge,
                        !achievement.isUnlocked && styles.badgeLocked,
                    ]}
                    onPress={() => achievement.isUnlocked && handleShare(achievement)}
                    activeOpacity={achievement.isUnlocked ? 0.7 : 1}
                >
                    {/* Badge Icon */}
                    <View
                        style={[
                            styles.badgeIconContainer,
                            { borderColor: achievement.isUnlocked ? rarityColor : palette.border },
                        ]}
                    >
                        <Text style={[
                            styles.badgeIcon,
                            !achievement.isUnlocked && styles.badgeIconLocked,
                        ]}>
                            {achievement.icon}
                        </Text>

                        {/* Rarity indicator */}
                        {achievement.isUnlocked && (
                            <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />
                        )}
                    </View>

                    {/* Progress Ring for locked achievements */}
                    {!achievement.isUnlocked && progressPercentage > 0 && (
                        <View style={styles.progressRing}>
                            <View
                                style={[
                                    styles.progressRingFill,
                                    {
                                        borderColor: palette.brandPrimary,
                                        transform: [
                                            { rotate: `${(progressPercentage * 3.6) - 90}deg` }
                                        ],
                                    },
                                ]}
                            />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Achievement Title */}
                <Text
                    style={[
                        styles.badgeTitle,
                        !achievement.isUnlocked && styles.badgeTitleLocked,
                    ]}
                    numberOfLines={2}
                >
                    {achievement.title}
                </Text>

                {/* Progress or Date */}
                {achievement.isUnlocked ? (
                    <Text style={styles.badgeDate}>
                        {formatDate(achievement.unlockedAt)}
                    </Text>
                ) : (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBar,
                                    { width: `${progressPercentage}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {achievement.currentProgress}/{achievement.requirement}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderAchievementsList = () => {
        // Separate unlocked and locked achievements
        const unlockedAchievements = filteredAchievements.filter(a => a.isUnlocked);
        const lockedAchievements = filteredAchievements.filter(a => !a.isUnlocked);

        return (
            <View style={styles.achievementsContainer}>
                {unlockedAchievements.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Unlocked ({unlockedAchievements.length})</Text>
                            <Text style={styles.sectionSubtitle}>Tap to share</Text>
                        </View>
                        <View style={styles.badgeGrid}>
                            {unlockedAchievements.map(renderAchievementBadge)}
                        </View>
                    </>
                )}

                {lockedAchievements.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Locked ({lockedAchievements.length})</Text>
                            <Text style={styles.sectionSubtitle}>Keep going to unlock!</Text>
                        </View>
                        <View style={styles.badgeGrid}>
                            {lockedAchievements.map(renderAchievementBadge)}
                        </View>
                    </>
                )}

                {filteredAchievements.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateIcon}>🏆</Text>
                        <Text style={styles.emptyStateTitle}>No achievements yet</Text>
                        <Text style={styles.emptyStateText}>
                            Start your fitness journey to unlock achievements!
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading achievements...</Text>
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
                    <Text style={styles.title}>Achievements</Text>
                    <Text style={styles.subtitle}>
                        {stats.totalUnlocked} of {stats.totalAchievements} unlocked
                    </Text>
                </View>

                {/* Stats Cards */}
                {renderStatsHeader()}

                {/* Category Filters */}
                {renderCategoryFilters()}

                {/* Achievements Grid */}
                {renderAchievementsList()}
            </ScrollView>
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
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        fontSize: 18,
        color: palette.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    statsCard: {
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    statsValue: {
        ...typography.heading2,
        color: palette.brandPrimary,
        marginBottom: spacing.xs,
    },
    statsLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    categoriesScroll: {
        marginBottom: spacing.lg,
    },
    categoriesContainer: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 20,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: palette.border,
        gap: spacing.xs,
    },
    categoryChipActive: {
        backgroundColor: palette.brandPrimary + '20',
        borderColor: palette.brandPrimary,
    },
    categoryIcon: {
        fontSize: 18,
    },
    categoryLabel: {
        ...typography.body,
        color: palette.textSecondary,
        fontWeight: '500',
    },
    categoryLabelActive: {
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    categoryBadge: {
        backgroundColor: palette.border,
        borderRadius: 10,
        paddingVertical: 2,
        paddingHorizontal: spacing.xs,
        marginLeft: spacing.xs,
    },
    categoryBadgeActive: {
        backgroundColor: palette.brandPrimary + '40',
    },
    categoryBadgeText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    categoryBadgeTextActive: {
        color: palette.brandPrimary,
    },
    achievementsContainer: {
        paddingHorizontal: spacing.lg,
    },
    sectionHeader: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    sectionSubtitle: {
        ...typography.body,
        color: palette.textTertiary,
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    badgeContainer: {
        width: BADGE_SIZE,
        alignItems: 'center',
    },
    badge: {
        position: 'relative',
        marginBottom: spacing.sm,
    },
    badgeLocked: {
        opacity: 0.6,
    },
    badgeIconContainer: {
        width: BADGE_SIZE - 10,
        height: BADGE_SIZE - 10,
        borderRadius: (BADGE_SIZE - 10) / 2,
        backgroundColor: palette.surface,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badgeIcon: {
        fontSize: 40,
    },
    badgeIconLocked: {
        opacity: 0.3,
    },
    rarityIndicator: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: palette.surface,
    },
    progressRing: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    progressRingFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: (BADGE_SIZE - 10) / 2,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    badgeTitle: {
        ...typography.caption,
        color: palette.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
        fontWeight: '600',
        minHeight: 32,
    },
    badgeTitleLocked: {
        color: palette.textTertiary,
    },
    badgeDate: {
        ...typography.caption,
        color: palette.textTertiary,
        fontSize: 11,
        textAlign: 'center',
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
    },
    progressBarContainer: {
        width: '100%',
        height: 4,
        backgroundColor: palette.surface,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressBar: {
        height: '100%',
        backgroundColor: palette.brandPrimary,
        borderRadius: 2,
    },
    progressText: {
        ...typography.caption,
        color: palette.textTertiary,
        fontSize: 11,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyStateIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
        opacity: 0.3,
    },
    emptyStateTitle: {
        ...typography.heading3,
        color: palette.textSecondary,
        marginBottom: spacing.sm,
    },
    emptyStateText: {
        ...typography.body,
        color: palette.textTertiary,
        textAlign: 'center',
        maxWidth: 280,
    },
});
