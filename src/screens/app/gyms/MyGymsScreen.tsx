import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    Alert,
} from 'react-native';
import { Screen } from '@/components';
import { palette, spacing, typography, radii } from '@/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { GYM_DATABASE, Gym } from '@/services/gymService';

type Props = NativeStackScreenProps<AppStackParamList, 'MyGyms'>;

interface MyGym extends Gym {
    lastVisited: string;
    memberSince: string;
    totalVisits: number;
}

export const MyGymsScreen: React.FC<Props> = ({ navigation }) => {
    const [myGyms, setMyGyms] = useState<MyGym[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadMyGyms();
    }, []);

    const loadMyGyms = () => {
        // Mock data - will be replaced with real data from backend (gym_memberships table)
        // For now, using first 3 gyms from database as sample
        const mockMyGyms: MyGym[] = GYM_DATABASE.slice(0, 3).map((gym, index) => ({
            ...gym,
            lastVisited: getLastVisitedDate(index),
            memberSince: getMemberSinceDate(index),
            totalVisits: Math.floor(Math.random() * 50) + 10,
        }));
        setMyGyms(mockMyGyms);
    };

    const getLastVisitedDate = (index: number): string => {
        const daysAgo = [2, 5, 7][index] || 3;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return formatDate(date);
    };

    const getMemberSinceDate = (index: number): string => {
        const monthsAgo = [3, 6, 12][index] || 6;
        const date = new Date();
        date.setMonth(date.getMonth() - monthsAgo);
        return formatDate(date);
    };

    const formatDate = (date: Date): string => {
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const getDaysAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const isRecentVisit = (dateString: string): boolean => {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3; // Recent if within 3 days
    };

    const getVisitFrequency = (totalVisits: number, memberSinceDate: string): string => {
        const memberDate = new Date(memberSinceDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - memberDate.getTime());
        const months = diffTime / (1000 * 60 * 60 * 24 * 30);

        if (months < 1) return `${totalVisits} visits this month`;

        const visitsPerMonth = totalVisits / months;
        if (visitsPerMonth >= 12) return 'Very active';
        if (visitsPerMonth >= 8) return 'Active member';
        if (visitsPerMonth >= 4) return 'Regular visitor';
        return 'Occasional visitor';
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadMyGyms();
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleCheckIn = (gym: MyGym) => {
        navigation.navigate('CheckIn', {
            gymId: gym.id,
            gymName: gym.name,
        });
    };

    const handleLiveStatus = (gym: MyGym) => {
        navigation.navigate('LiveStatus', {
            gymId: gym.id,
        });
    };

    const handleGymPress = (gym: MyGym) => {
        navigation.navigate('GymDetail', {
            gymId: gym.id,
        });
    };

    const renderStars = (rating: number) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
                        size={14}
                        color="#FFD700"
                    />
                ))}
            </View>
        );
    };

    const renderGymCard = ({ item }: { item: MyGym }) => (
        <TouchableOpacity
            style={styles.gymCard}
            onPress={() => handleGymPress(item)}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.image }} style={styles.gymImage} />

            <View style={styles.gymInfo}>
                <View style={styles.headerRow}>
                    <Text style={styles.gymName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {isRecentVisit(item.lastVisited) && (
                        <View style={styles.recentBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#000" />
                            <Text style={styles.recentBadgeText}>Recent</Text>
                        </View>
                    )}
                </View>

                <View style={styles.ratingRow}>
                    {renderStars(item.rating)}
                    <Text style={styles.ratingText}>
                        {item.rating} ({item.reviewCount})
                    </Text>
                </View>

                {/* Enhanced Last Visit Card */}
                <View style={[
                    styles.lastVisitCard,
                    isRecentVisit(item.lastVisited) && styles.lastVisitCardRecent
                ]}>
                    <View style={styles.lastVisitLeft}>
                        <Ionicons
                            name="calendar"
                            size={20}
                            color={isRecentVisit(item.lastVisited) ? "#00FF7F" : palette.textSecondary}
                        />
                        <View style={styles.lastVisitTextContainer}>
                            <Text style={styles.lastVisitLabel}>Last Visit</Text>
                            <Text style={[
                                styles.lastVisitValue,
                                isRecentVisit(item.lastVisited) && styles.lastVisitValueRecent
                            ]}>
                                {getDaysAgo(item.lastVisited)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.frequencyBadge}>
                        <Text style={styles.frequencyText}>
                            {getVisitFrequency(item.totalVisits, item.memberSince)}
                        </Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Ionicons name="time-outline" size={16} color={palette.textSecondary} />
                        <Text style={styles.statBoxLabel}>Member Since</Text>
                        <Text style={styles.statBoxValue}>{item.memberSince.split(' ')[1]} {item.memberSince.split(' ')[2]}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons name="fitness-outline" size={16} color={palette.textSecondary} />
                        <Text style={styles.statBoxLabel}>Total Visits</Text>
                        <Text style={styles.statBoxValue}>{item.totalVisits}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons name="location-outline" size={16} color={palette.textSecondary} />
                        <Text style={styles.statBoxLabel}>Distance</Text>
                        <Text style={styles.statBoxValue}>{item.distance || '2.5 km'}</Text>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.checkInButton}
                        onPress={() => handleCheckIn(item)}
                    >
                        <Ionicons name="qr-code" size={18} color="#000" />
                        <Text style={styles.checkInButtonText}>Check In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.liveStatusButton}
                        onPress={() => handleLiveStatus(item)}
                    >
                        <Ionicons name="pulse" size={18} color="#00FF7F" />
                        <Text style={styles.liveStatusButtonText}>Live Status</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={80} color={palette.textSecondary} />
            <Text style={styles.emptyTitle}>No Joined Gyms</Text>
            <Text style={styles.emptyText}>
                Join a gym to track your workouts and access exclusive features
            </Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.browseButtonText}>Browse Gyms</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Screen>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Gyms</Text>
                    <Text style={styles.headerSubtitle}>
                        {myGyms.length} {myGyms.length === 1 ? 'Membership' : 'Memberships'}
                    </Text>
                </View>

                <FlatList
                    data={myGyms}
                    renderItem={renderGymCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        myGyms.length === 0 && styles.emptyListContent,
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#00FF7F"
                            colors={['#00FF7F']}
                        />
                    }
                    ListEmptyComponent={renderEmptyState}
                />
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    headerTitle: {
        ...typography.heading1,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        ...typography.body,
        color: palette.textSecondary,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    emptyListContent: {
        flex: 1,
    },
    gymCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: radii.lg,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    gymImage: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    gymInfo: {
        padding: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    gymName: {
        ...typography.heading3,
        color: palette.textPrimary,
        flex: 1,
        marginRight: spacing.sm,
    },
    recentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.neonGreen,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.round,
        gap: 4,
    },
    recentBadgeText: {
        ...typography.caption,
        color: '#000',
        fontSize: 11,
        fontWeight: '700',
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    distanceText: {
        ...typography.caption,
        color: '#00FF7F',
        marginLeft: 4,
        fontWeight: '600',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: spacing.xs,
    },
    ratingText: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    lastVisitCard: {
        backgroundColor: '#2A2A2A',
        borderRadius: radii.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    lastVisitCardRecent: {
        backgroundColor: 'rgba(0, 255, 127, 0.1)',
        borderColor: 'rgba(0, 255, 127, 0.3)',
    },
    lastVisitLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    lastVisitTextContainer: {
        flex: 1,
    },
    lastVisitLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    lastVisitValue: {
        ...typography.subtitle,
        color: palette.textPrimary,
        fontWeight: '600',
    },
    lastVisitValueRecent: {
        color: palette.neonGreen,
    },
    frequencyBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    frequencyText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 10,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#2A2A2A',
        borderRadius: radii.sm,
        padding: spacing.sm,
        alignItems: 'center',
        gap: 4,
    },
    statBoxLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 10,
        textAlign: 'center',
    },
    statBoxValue: {
        ...typography.body,
        color: palette.textPrimary,
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
    },
    statsRow: {
        marginBottom: spacing.sm,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        ...typography.body,
        color: palette.textSecondary,
        marginLeft: spacing.xs,
        fontSize: 14,
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    checkInButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00FF7F',
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        gap: spacing.xs,
    },
    checkInButtonText: {
        ...typography.bodyBold,
        color: '#000',
        fontSize: 14,
    },
    liveStatusButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2A2A2A',
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: '#00FF7F',
    },
    liveStatusButtonText: {
        ...typography.bodyBold,
        color: '#00FF7F',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    emptyText: {
        ...typography.body,
        color: palette.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    browseButton: {
        backgroundColor: '#00FF7F',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
    },
    browseButtonText: {
        ...typography.bodyBold,
        color: '#000',
        fontSize: 16,
    },
});
