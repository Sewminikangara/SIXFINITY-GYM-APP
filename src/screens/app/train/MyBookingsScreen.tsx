import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';

type BookingStatus = 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';
type TabType = 'upcoming' | 'past';

interface Booking {
    id: string;
    trainerId: string;
    trainerName: string;
    trainerPhoto: string;
    date: string;
    time: string;
    duration: string;
    gym: string;
    price: number;
    status: BookingStatus;
    canReschedule: boolean;
    canCancel: boolean;
}

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const MyBookingsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const [activeTab, setActiveTab] = useState<TabType>('upcoming');

    const upcomingBookings: Booking[] = [
        {
            id: '1',
            trainerId: '1',
            trainerName: 'Chaminda Perera',
            trainerPhoto: undefined,
            date: 'Dec 9, 2025',
            time: '9:00 AM - 10:00 AM',
            duration: '60 min',
            gym: 'SIXFINITY Colombo 07',
            price: 2500,
            status: 'upcoming',
            canReschedule: true,
            canCancel: true,
        },
        {
            id: '2',
            trainerId: '2',
            trainerName: 'Nimesha Silva',
            trainerPhoto: undefined,
            date: 'Dec 11, 2025',
            time: '2:00 PM - 3:00 PM',
            duration: '60 min',
            gym: 'SIXFINITY Kandy',
            price: 2000,
            status: 'upcoming',
            canReschedule: true,
            canCancel: true,
        },
    ];

    const pastBookings: Booking[] = [
        {
            id: '3',
            trainerId: '1',
            trainerName: 'Chaminda Perera',
            trainerPhoto: 'https://i.pravatar.cc/400?img=12',
            date: 'Dec 2, 2025',
            time: '9:00 AM - 10:00 AM',
            duration: '60 min',
            gym: 'SIXFINITY Colombo 07',
            price: 2500,
            status: 'completed',
            canReschedule: false,
            canCancel: false,
        },
        {
            id: '4',
            trainerId: '3',
            trainerName: 'Ruwan Fernando',
            trainerPhoto: 'https://i.pravatar.cc/400?img=33',
            date: 'Nov 28, 2025',
            time: '4:00 PM - 5:00 PM',
            duration: '60 min',
            gym: 'SIXFINITY Galle',
            price: 2200,
            status: 'cancelled',
            canReschedule: false,
            canCancel: false,
        },
    ];

    const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

    const handleReschedule = (booking: Booking) => {
        navigation.navigate('RescheduleSession', { bookingId: booking.id, booking });
    };

    const handleCancel = (booking: Booking) => {
        Alert.alert(
            'Cancel Session?',
            `Are you sure you want to cancel your session with ${booking.trainerName} on ${booking.date}?\n\nCancellation policy: Free cancellation up to 24 hours before session.`,
            [
                {
                    text: 'Keep Session',
                    style: 'cancel',
                },
                {
                    text: 'Cancel Session',
                    onPress: () => {
                        // Process cancellation
                        Alert.alert('Session Cancelled', 'Your session has been cancelled and refund has been processed to your wallet.');
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const handleViewTrainer = (trainerId: string) => {
        navigation.navigate('TrainerDetail', { trainerId });
    };

    const handleLeaveReview = (booking: Booking) => {
        navigation.navigate('SubmitReview', {
            trainerId: booking.trainerId,
            trainerName: booking.trainerName,
            bookingId: booking.id,
        });
    };

    const getStatusBadge = (status: BookingStatus) => {
        const statusConfig = {
            upcoming: { label: 'Upcoming', color: palette.neonGreen, icon: 'calendar-clock' },
            completed: { label: 'Completed', color: '#4ECDC4', icon: 'check-circle' },
            cancelled: { label: 'Cancelled', color: '#FF6B6B', icon: 'close-circle' },
            rescheduled: { label: 'Rescheduled', color: '#FFA500', icon: 'calendar-refresh' },
        };

        const config = statusConfig[status];

        return (
            <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                <Icon name={config.icon} size={14} color={config.color} />
                <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
        );
    };

    const renderBookingCard = (booking: Booking) => (
        <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
                <TouchableOpacity
                    style={styles.trainerSection}
                    onPress={() => handleViewTrainer(booking.trainerId)}
                >
                    <Image source={{ uri: booking.trainerPhoto }} style={styles.trainerPhoto} />
                    <View style={styles.trainerInfo}>
                        <Text style={styles.trainerName}>{booking.trainerName}</Text>
                        <View style={styles.gymRow}>
                            <Icon name="map-marker" size={12} color={palette.textSecondary} />
                            <Text style={styles.gymText}>{booking.gym}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                {getStatusBadge(booking.status)}
            </View>

            <View style={styles.bookingDetails}>
                <View style={styles.detailItem}>
                    <Icon name="calendar" size={16} color={palette.neonGreen} />
                    <Text style={styles.detailText}>{booking.date}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Icon name="clock-outline" size={16} color={palette.neonGreen} />
                    <Text style={styles.detailText}>{booking.time}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Icon name="timer" size={16} color={palette.neonGreen} />
                    <Text style={styles.detailText}>{booking.duration}</Text>
                </View>
            </View>

            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Session Fee</Text>
                <Text style={styles.priceValue}>Rs. {booking.price.toLocaleString()}</Text>
            </View>

            {booking.status === 'upcoming' && (
                <View style={styles.actionsRow}>
                    {booking.canReschedule && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleReschedule(booking)}
                        >
                            <Icon name="calendar-refresh" size={18} color={palette.neonGreen} />
                            <Text style={styles.actionButtonText}>Reschedule</Text>
                        </TouchableOpacity>
                    )}
                    {booking.canCancel && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => handleCancel(booking)}
                        >
                            <Icon name="close-circle" size={18} color="#FF6B6B" />
                            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleViewTrainer(booking.trainerId)}
                    >
                        <Icon name="message-text" size={18} color={palette.textPrimary} />
                        <Text style={styles.actionButtonText}>Message</Text>
                    </TouchableOpacity>
                </View>
            )}

            {booking.status === 'completed' && (
                <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => handleLeaveReview(booking)}
                >
                    <LinearGradient
                        colors={[palette.neonGreen, palette.neonGreenDim]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.reviewButtonGradient}
                    >
                        <Icon name="star" size={18} color={palette.background} />
                        <Text style={styles.reviewButtonText}>Leave Review</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );

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
                <Text style={styles.headerTitle}>My Bookings</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                        Upcoming ({upcomingBookings.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                        Past ({pastBookings.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {displayedBookings.length > 0 ? (
                    displayedBookings.map((booking) => renderBookingCard(booking))
                ) : (
                    <View style={styles.emptyState}>
                        <Icon name="calendar-blank" size={64} color={palette.textSecondary} />
                        <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
                        <Text style={styles.emptyDesc}>
                            {activeTab === 'upcoming'
                                ? 'Book a session with a trainer to get started'
                                : 'Your past sessions will appear here'}
                        </Text>
                        {activeTab === 'upcoming' && (
                            <TouchableOpacity
                                style={styles.browseButton}
                                onPress={() => navigation.navigate('Workout' as never)}
                            >
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.browseButtonGradient}
                                >
                                    <Text style={styles.browseButtonText}>Browse Trainers</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
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
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: 4,
        marginBottom: spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: palette.neonGreen,
    },
    tabText: {
        color: palette.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: palette.background,
    },
    scrollView: {
        flex: 1,
    },
    bookingCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    trainerSection: {
        flexDirection: 'row',
        flex: 1,
    },
    trainerPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: palette.border,
    },
    trainerInfo: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    trainerName: {
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    gymRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    gymText: {
        color: palette.textSecondary,
        fontSize: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    bookingDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        color: palette.textSecondary,
        fontSize: 13,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        marginBottom: spacing.md,
    },
    priceLabel: {
        color: palette.textSecondary,
        fontSize: 14,
    },
    priceValue: {
        color: palette.neonGreen,
        fontSize: 18,
        fontWeight: '700',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.background,
        borderRadius: 10,
        paddingVertical: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: palette.border,
    },
    actionButtonText: {
        color: palette.textPrimary,
        fontSize: 13,
        fontWeight: '600',
    },
    cancelButton: {
        borderColor: '#FF6B6B',
    },
    cancelButtonText: {
        color: '#FF6B6B',
    },
    reviewButton: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    reviewButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    reviewButtonText: {
        color: palette.background,
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xxxl * 2,
    },
    emptyTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    emptyDesc: {
        color: palette.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.xl,
    },
    browseButton: {
        borderRadius: 25,
        overflow: 'hidden',
        minWidth: 200,
    },
    browseButtonGradient: {
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
    },
    browseButtonText: {
        color: palette.background,
        fontSize: 15,
        fontWeight: '700',
    },
});
