import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';

interface Review {
    id: string;
    userName: string;
    userPhoto: string;
    rating: number;
    date: string;
    comment: string;
}

interface TimeSlot {
    id: string;
    day: string;
    date: string;
    time: string;
    available: boolean;
}

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const TrainerDetailScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute();
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // Mock data - replace with real data from route params or API
    const trainer = {
        id: '1',
        name: 'Chaminda Perera',
        photo: undefined,
        coverImage: undefined,
        rating: 4.9,
        totalReviews: 124,
        specializations: ['Strength Training', 'HIIT', 'Bodybuilding'],
        experience: '8 years',
        certifications: [
            'NASM Certified Personal Trainer',
            'CrossFit Level 2 Trainer',
            'Sports Nutrition Specialist',
        ],
        bio: 'Certified personal trainer with 8 years experience in Sri Lanka. Specialized in strength training and HIIT workouts. Former national bodybuilding champion helping clients achieve their fitness goals.',
        achievements: [
            'National Bodybuilding Champion 2019',
            '500+ Client Transformations',
            'Featured in Fitness Magazine LK',
        ],
        pricePerSession: 2500,
        monthlyPackage: 18000,
        gym: 'SIXFINITY Colombo 07',
    };

    const reviews: Review[] = [
        {
            id: '1',
            userName: 'Kasun Wickramasinghe',
            userPhoto: undefined,
            rating: 5,
            date: '2 days ago',
            comment: 'Chaminda is an excellent trainer! His knowledge of bodybuilding and nutrition is exceptional. Lost 8kg in 3 months!',
        },
        {
            id: '2',
            userName: 'Nimesha Fernando',
            userPhoto: undefined,
            rating: 5,
            date: '1 week ago',
            comment: 'Best trainer in Colombo! Very professional and knows exactly how to push you to reach your goals. Highly recommended.',
        },
        {
            id: '3',
            userName: 'Dilshan Silva',
            userPhoto: undefined,
            rating: 4,
            date: '2 weeks ago',
            comment: 'Great experience. Very friendly and supportive. Gym timings are also flexible which helps with my busy schedule.',
        },
    ];

    const availableSlots: TimeSlot[] = [
        { id: '1', day: 'Mon', date: 'Dec 9', time: '9:00 AM', available: true },
        { id: '2', day: 'Mon', date: 'Dec 9', time: '2:00 PM', available: false },
        { id: '3', day: 'Mon', date: 'Dec 9', time: '5:00 PM', available: true },
        { id: '4', day: 'Tue', date: 'Dec 10', time: '9:00 AM', available: true },
        { id: '5', day: 'Tue', date: 'Dec 10', time: '11:00 AM', available: true },
        { id: '6', day: 'Tue', date: 'Dec 10', time: '4:00 PM', available: false },
        { id: '7', day: 'Wed', date: 'Dec 11', time: '10:00 AM', available: true },
        { id: '8', day: 'Wed', date: 'Dec 11', time: '3:00 PM', available: true },
    ];

    const handleBookSession = () => {
        if (selectedSlot) {
            navigation.navigate('BookSession', {
                trainerId: trainer.id,
                slotId: selectedSlot,
                trainer: trainer,
            });
        }
    };

    const handleSendMessage = () => {
        navigation.navigate('TrainerMessage', {
            trainerId: trainer.id,
            trainerName: trainer.name,
        });
    };

    const renderStars = (rating: number) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                        key={star}
                        name={star <= rating ? 'star' : star - rating < 1 ? 'star-half-full' : 'star-outline'}
                        size={16}
                        color="#FFD700"
                    />
                ))}
            </View>
        );
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
                <Text style={styles.headerTitle}>Trainer Profile</Text>
                <TouchableOpacity style={styles.favoriteButton}>
                    <Icon name="heart-outline" size={24} color={palette.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Cover Image */}
                <View style={styles.coverImageContainer}>
                    <Image source={{ uri: trainer.coverImage }} style={styles.coverImage} />
                    <LinearGradient
                        colors={['transparent', palette.background]}
                        style={styles.coverGradient}
                    />
                </View>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <Image source={{ uri: trainer.photo }} style={styles.profilePhoto} />
                    <Text style={styles.trainerName}>{trainer.name}</Text>

                    <View style={styles.ratingRow}>
                        {renderStars(trainer.rating)}
                        <Text style={styles.ratingText}>{trainer.rating}</Text>
                        <Text style={styles.reviewsCount}>({trainer.totalReviews} reviews)</Text>
                    </View>

                    <View style={styles.gymRow}>
                        <Icon name="map-marker" size={16} color={palette.textSecondary} />
                        <Text style={styles.gymText}>{trainer.gym}</Text>
                    </View>

                    {/* Specializations */}
                    <View style={styles.specializationsRow}>
                        {trainer.specializations.map((spec, index) => (
                            <View key={index} style={styles.specTag}>
                                <Text style={styles.specText}>{spec}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.bioText}>{trainer.bio}</Text>
                </View>

                {/* Experience */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Experience & Certifications</Text>
                    <View style={styles.infoRow}>
                        <Icon name="briefcase" size={20} color={palette.neonGreen} />
                        <Text style={styles.infoText}>{trainer.experience} of professional training</Text>
                    </View>
                    {trainer.certifications.map((cert, index) => (
                        <View key={index} style={styles.certRow}>
                            <Icon name="certificate" size={18} color={palette.textSecondary} />
                            <Text style={styles.certText}>{cert}</Text>
                        </View>
                    ))}
                </View>

                {/* Achievements */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Achievements</Text>
                    {trainer.achievements.map((achievement, index) => (
                        <View key={index} style={styles.achievementRow}>
                            <Icon name="trophy" size={18} color="#FFD700" />
                            <Text style={styles.achievementText}>{achievement}</Text>
                        </View>
                    ))}
                </View>

                {/* Available Time Slots */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Time Slots</Text>
                    <Text style={styles.sectionSubtitle}>Select a time slot to book your session</Text>

                    <View style={styles.slotsGrid}>
                        {availableSlots.map((slot) => (
                            <TouchableOpacity
                                key={slot.id}
                                style={[
                                    styles.slotCard,
                                    !slot.available && styles.slotCardDisabled,
                                    selectedSlot === slot.id && styles.slotCardSelected,
                                ]}
                                onPress={() => slot.available && setSelectedSlot(slot.id)}
                                disabled={!slot.available}
                            >
                                <Text style={[
                                    styles.slotDay,
                                    !slot.available && styles.slotTextDisabled,
                                    selectedSlot === slot.id && styles.slotTextSelected,
                                ]}>
                                    {slot.day}
                                </Text>
                                <Text style={[
                                    styles.slotDate,
                                    !slot.available && styles.slotTextDisabled,
                                    selectedSlot === slot.id && styles.slotTextSelected,
                                ]}>
                                    {slot.date}
                                </Text>
                                <Text style={[
                                    styles.slotTime,
                                    !slot.available && styles.slotTextDisabled,
                                    selectedSlot === slot.id && styles.slotTextSelected,
                                ]}>
                                    {slot.time}
                                </Text>
                                {!slot.available && (
                                    <View style={styles.bookedBadge}>
                                        <Text style={styles.bookedText}>Booked</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Pricing */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pricing</Text>
                    <View style={styles.pricingRow}>
                        <View style={styles.priceCard}>
                            <Text style={styles.priceLabel}>Per Session</Text>
                            <Text style={styles.priceValue}>Rs. {trainer.pricePerSession.toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceCard}>
                            <Text style={styles.priceLabel}>Monthly (8 sessions)</Text>
                            <Text style={styles.priceValue}>Rs. {trainer.monthlyPackage.toLocaleString()}</Text>
                            <Text style={styles.priceSavings}>Save Rs. {((trainer.pricePerSession * 8) - trainer.monthlyPackage).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Reviews */}
                <View style={styles.section}>
                    <View style={styles.reviewsHeader}>
                        <Text style={styles.sectionTitle}>Reviews ({trainer.totalReviews})</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {reviews.map((review) => (
                        <View key={review.id} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Image source={{ uri: review.userPhoto }} style={styles.reviewUserPhoto} />
                                <View style={styles.reviewUserInfo}>
                                    <Text style={styles.reviewUserName}>{review.userName}</Text>
                                    <View style={styles.reviewMeta}>
                                        {renderStars(review.rating)}
                                        <Text style={styles.reviewDate}>{review.date}</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.reviewComment}>{review.comment}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.messageButton}
                    onPress={handleSendMessage}
                >
                    <Icon name="message-text" size={20} color={palette.neonGreen} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.bookButton, !selectedSlot && styles.bookButtonDisabled]}
                    onPress={handleBookSession}
                    disabled={!selectedSlot}
                >
                    <LinearGradient
                        colors={selectedSlot ? [palette.neonGreen, palette.neonGreenDim] : ['#444', '#333']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.bookButtonGradient}
                    >
                        <Icon name="calendar-check" size={20} color={selectedSlot ? palette.background : palette.textSecondary} />
                        <Text style={[styles.bookButtonText, !selectedSlot && styles.bookButtonTextDisabled]}>
                            {selectedSlot ? 'Book Session' : 'Select Time Slot'}
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
    favoriteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    coverImageContainer: {
        height: 220,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        backgroundColor: palette.border,
    },
    coverGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    profileSection: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginTop: -50,
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: palette.background,
        backgroundColor: palette.border,
    },
    trainerName: {
        ...typography.heading1,
        color: palette.textPrimary,
        fontSize: 28,
        fontWeight: '700',
        marginTop: spacing.md,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        gap: 6,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingText: {
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 4,
    },
    reviewsCount: {
        color: palette.textSecondary,
        fontSize: 14,
    },
    gymRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        gap: 4,
    },
    gymText: {
        color: palette.textSecondary,
        fontSize: 14,
    },
    specializationsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: spacing.md,
    },
    specTag: {
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
    },
    specText: {
        color: palette.neonGreen,
        fontSize: 13,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
    },
    sectionTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    sectionSubtitle: {
        color: palette.textSecondary,
        fontSize: 14,
        marginBottom: spacing.md,
    },
    bioText: {
        color: palette.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: spacing.md,
    },
    infoText: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    certRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: spacing.sm,
    },
    certText: {
        color: palette.textSecondary,
        fontSize: 14,
        flex: 1,
    },
    achievementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: spacing.sm,
    },
    achievementText: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    slotCard: {
        width: '31%',
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: palette.border,
    },
    slotCardDisabled: {
        opacity: 0.5,
    },
    slotCardSelected: {
        borderColor: palette.neonGreen,
        backgroundColor: 'rgba(197, 255, 74, 0.1)',
    },
    slotDay: {
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    slotDate: {
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    slotTime: {
        color: palette.textPrimary,
        fontSize: 13,
        fontWeight: '600',
    },
    slotTextDisabled: {
        color: palette.textSecondary,
    },
    slotTextSelected: {
        color: palette.neonGreen,
    },
    bookedBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    bookedText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
    },
    pricingRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    priceCard: {
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    priceLabel: {
        color: palette.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    priceValue: {
        color: palette.neonGreen,
        fontSize: 24,
        fontWeight: '700',
    },
    priceSavings: {
        color: '#4ECDC4',
        fontSize: 11,
        marginTop: 2,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    seeAllText: {
        color: palette.neonGreen,
        fontSize: 14,
        fontWeight: '600',
    },
    reviewCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    reviewHeader: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    reviewUserPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.border,
    },
    reviewUserInfo: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    reviewUserName: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    reviewMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reviewDate: {
        color: palette.textSecondary,
        fontSize: 12,
    },
    reviewComment: {
        color: palette.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    bottomBar: {
        flexDirection: 'row',
        padding: spacing.lg,
        backgroundColor: palette.background,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        gap: spacing.md,
    },
    messageButton: {
        width: 50,
        height: 50,
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookButton: {
        flex: 1,
        borderRadius: 25,
        overflow: 'hidden',
    },
    bookButtonDisabled: {
        opacity: 0.6,
    },
    bookButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        gap: 8,
    },
    bookButtonText: {
        color: palette.background,
        fontSize: 16,
        fontWeight: '700',
    },
    bookButtonTextDisabled: {
        color: palette.textSecondary,
    },
});
