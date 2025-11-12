import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';

type TabType = 'upcoming' | 'past' | 'canceled';

// Placeholder booking interface
interface DisplayBooking {
    id: string;
    name: string;
    type: 'gym' | 'trainer' | 'class';
    date: Date;
    duration: number;
    price: number;
    status: string;
    location?: string;
    notes?: string;
}

export default function BookingsScreen() {
    const navigation = useNavigation();

    const [activeTab, setActiveTab] = useState<TabType>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');

    // Placeholder data
    const mockBookings: Record<TabType, DisplayBooking[]> = {
        upcoming: [
            {
                id: '1',
                name: 'Personal Training Session',
                type: 'trainer',
                date: new Date(Date.now() + 86400000), // Tomorrow
                duration: 60,
                price: 50,
                status: 'confirmed',
                location: 'SIXFINITY Gym - Downtown',
                notes: 'Bring workout gear',
            },
            {
                id: '2',
                name: 'Yoga Class',
                type: 'class',
                date: new Date(Date.now() + 172800000), // 2 days
                duration: 45,
                price: 25,
                status: 'confirmed',
                location: 'SIXFINITY Gym - Mall',
            },
        ],
        past: [
            {
                id: '3',
                name: 'CrossFit Session',
                type: 'class',
                date: new Date(Date.now() - 86400000), // Yesterday
                duration: 60,
                price: 30,
                status: 'completed',
                location: 'SIXFINITY Gym - Downtown',
            },
        ],
        canceled: [
            {
                id: '4',
                name: 'Swimming Lesson',
                type: 'trainer',
                date: new Date(Date.now() - 172800000),
                duration: 30,
                price: 40,
                status: 'canceled',
                location: 'SIXFINITY Gym - Beach',
            },
        ],
    };

    const bookings = mockBookings[activeTab];

    const filteredBookings = searchQuery.trim()
        ? bookings.filter((b) =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.location?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : bookings;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'trainer':
                return '';
            case 'class':
                return '';
            case 'gym':
                return '';
            default:
                return '';
        }
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return palette.success;
            case 'completed':
                return palette.textSecondary;
            case 'canceled':
                return palette.error;
            default:
                return palette.brandPrimary;
        }
    };

    const handleCancel = (id: string) => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => Alert.alert('Success', 'Booking canceled successfully'),
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
                <Text style={styles.headerTitle}>My Bookings</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                        Upcoming
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                        Past
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'canceled' && styles.activeTab]}
                    onPress={() => setActiveTab('canceled')}
                >
                    <Text style={[styles.tabText, activeTab === 'canceled' && styles.activeTabText]}>
                        Canceled
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search bookings..."
                    placeholderTextColor={palette.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Text style={styles.clearButton}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.scrollView}>
                {filteredBookings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>
                            {activeTab === 'upcoming' ? '' : activeTab === 'past' ? '' : ''}
                        </Text>
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'upcoming' ? 'No Upcoming Bookings' :
                                activeTab === 'past' ? 'No Past Bookings' :
                                    'No Canceled Bookings'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeTab === 'upcoming'
                                ? 'Book your first session to get started!'
                                : searchQuery
                                    ? 'No bookings match your search.'
                                    : `You don't have any ${activeTab} bookings.`}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.bookingsList}>
                        {filteredBookings.map((booking) => (
                            <View key={booking.id} style={styles.bookingCard}>
                                <View style={styles.bookingHeader}>
                                    <View style={styles.bookingTitleRow}>
                                        <Text style={styles.typeIcon}>{getTypeIcon(booking.type)}</Text>
                                        <View style={styles.bookingTitleContainer}>
                                            <Text style={styles.bookingName}>{booking.name}</Text>
                                            {booking.location && (
                                                <Text style={styles.location}>{booking.location}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}20` }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                                            {booking.status}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.bookingDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailIcon}></Text>
                                        <Text style={styles.detailText}>
                                            {formatDate(booking.date)} at {formatTime(booking.date)}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailIcon}>⏱️</Text>
                                        <Text style={styles.detailText}>{booking.duration} minutes</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailIcon}></Text>
                                        <Text style={styles.detailText}>₹{booking.price.toFixed(2)}</Text>
                                    </View>
                                </View>

                                {booking.notes && (
                                    <View style={styles.notesContainer}>
                                        <Text style={styles.notesLabel}>Notes:</Text>
                                        <Text style={styles.notesText}>{booking.notes}</Text>
                                    </View>
                                )}

                                <View style={styles.bookingActions}>
                                    {activeTab === 'upcoming' && (
                                        <>
                                            <TouchableOpacity
                                                style={styles.primaryButton}
                                                onPress={() => Alert.alert('Check In', 'QR code feature coming soon!')}
                                            >
                                                <Text style={styles.primaryButtonText}>Check In</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.secondaryButton}
                                                onPress={() => Alert.alert('Reschedule', 'Feature coming soon!')}
                                            >
                                                <Text style={styles.secondaryButtonText}>Reschedule</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.dangerButton}
                                                onPress={() => handleCancel(booking.id)}
                                            >
                                                <Text style={styles.dangerButtonText}>Cancel</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    {activeTab === 'past' && (
                                        <>
                                            <TouchableOpacity
                                                style={styles.primaryButton}
                                                onPress={() => Alert.alert('Review', 'Leave review feature coming soon!')}
                                            >
                                                <Text style={styles.primaryButtonText}>Leave Review</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.secondaryButton}
                                                onPress={() => Alert.alert('Rebook', 'Feature coming soon!')}
                                            >
                                                <Text style={styles.secondaryButtonText}>Book Again</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    {activeTab === 'canceled' && (
                                        <TouchableOpacity
                                            style={styles.secondaryButton}
                                            onPress={() => Alert.alert('Rebook', 'Feature coming soon!')}
                                        >
                                            <Text style={styles.secondaryButtonText}>Book Again</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.sm,
        fontSize: 15,
        color: palette.textPrimary,
    },
    clearButton: {
        fontSize: 18,
        color: palette.textTertiary,
        paddingLeft: spacing.sm,
    },
    scrollView: {
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 3,
        paddingHorizontal: spacing.xl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: 14,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    bookingsList: {
        padding: spacing.md,
    },
    bookingCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    bookingTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    typeIcon: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    bookingTitleContainer: {
        flex: 1,
    },
    bookingName: {
        fontSize: 17,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    location: {
        fontSize: 13,
        color: palette.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    bookingDetails: {
        marginBottom: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    detailIcon: {
        fontSize: 16,
        marginRight: spacing.sm,
        width: 20,
    },
    detailText: {
        fontSize: 14,
        color: palette.textSecondary,
        flex: 1,
    },
    notesContainer: {
        backgroundColor: `${palette.brandPrimary}10`,
        borderRadius: 8,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    notesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    notesText: {
        fontSize: 13,
        color: palette.textPrimary,
        lineHeight: 18,
    },
    bookingActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    primaryButton: {
        flex: 1,
        backgroundColor: palette.brandPrimary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 100,
    },
    primaryButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: palette.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
        minWidth: 100,
    },
    secondaryButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    dangerButton: {
        flex: 1,
        backgroundColor: `${palette.error}20`,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.error,
        minWidth: 100,
    },
    dangerButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.error,
    },
});
