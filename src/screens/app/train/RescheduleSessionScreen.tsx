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
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    sendRescheduleNotification,
    cancelAllBookingNotifications,
    scheduleAllSessionReminders,
} from '@/services/notificationsService';

interface TimeSlot {
    id: string;
    day: string;
    date: string;
    time: string;
    available: boolean;
    trainer: string;
    trainerId: string;
}

export const RescheduleSessionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);

    // Mock current booking data
    const currentBooking = {
        id: '1',
        trainer: {
            id: '1',
            name: 'Chaminda Perera',
            photo: undefined,
        },
        currentDate: 'Dec 9, 2025',
        currentTime: '9:00 AM - 10:00 AM',
        gym: 'SIXFINITY Colombo 07',
        price: 2500,
        rescheduleFee: 0, // Free within policy
        rescheduleDeadline: '24 hours before session',
    };

    // Available time slots with same trainer and alternate trainers
    const availableSlots: TimeSlot[] = [
        {
            id: '1',
            day: 'Tue',
            date: 'Dec 10',
            time: '9:00 AM',
            available: true,
            trainer: 'Chaminda Perera',
            trainerId: '1',
        },
        {
            id: '2',
            day: 'Tue',
            date: 'Dec 10',
            time: '11:00 AM',
            available: true,
            trainer: 'Chaminda Perera',
            trainerId: '1',
        },
        {
            id: '3',
            day: 'Tue',
            date: 'Dec 10',
            time: '2:00 PM',
            available: false,
            trainer: 'Chaminda Perera',
            trainerId: '1',
        },
        {
            id: '4',
            day: 'Wed',
            date: 'Dec 11',
            time: '10:00 AM',
            available: true,
            trainer: 'Chaminda Perera',
            trainerId: '1',
        },
        {
            id: '5',
            day: 'Wed',
            date: 'Dec 11',
            time: '3:00 PM',
            available: true,
            trainer: 'Chaminda Perera',
            trainerId: '1',
        },
        // Alternate trainers (if original is unavailable)
        {
            id: '6',
            day: 'Mon',
            date: 'Dec 9',
            time: '2:00 PM',
            available: true,
            trainer: 'Nimesha Silva',
            trainerId: '2',
        },
        {
            id: '7',
            day: 'Tue',
            date: 'Dec 10',
            time: '4:00 PM',
            available: true,
            trainer: 'Ruwan Fernando',
            trainerId: '3',
        },
    ];

    const selectedSlotData = availableSlots.find((s) => s.id === selectedSlot);
    const isTrainerChanged = selectedSlotData && selectedSlotData.trainerId !== currentBooking.trainer.id;
    const priceDifference = isTrainerChanged ? 500 : 0; // Rs. 500 more for different trainer
    const totalAdjustment = priceDifference + currentBooking.rescheduleFee;

    const handleConfirmReschedule = async () => {
        if (!selectedSlot) {
            Alert.alert('Select Time Slot', 'Please select a new time slot to reschedule your session.');
            return;
        }

        if (!agreedToPolicy) {
            Alert.alert('Policy Agreement Required', 'Please agree to the reschedule policy to continue.');
            return;
        }

        const slot = availableSlots.find((s) => s.id === selectedSlot);
        if (!slot) return;

        Alert.alert(
            'Confirm Reschedule',
            `Your session will be rescheduled to ${slot.date} at ${slot.time}${isTrainerChanged ? ` with ${slot.trainer}` : ''
            }.${totalAdjustment > 0 ? `\n\nAdditional fee: Rs. ${totalAdjustment}` : '\n\nNo additional fees.'}`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        // Cancel old notifications
                        // In production, you'd get these IDs from the booking
                        await cancelAllBookingNotifications([]);

                        // Send reschedule notification
                        await sendRescheduleNotification(
                            {
                                date: currentBooking.currentDate,
                                time: currentBooking.currentTime,
                            },
                            {
                                date: slot.date,
                                time: slot.time,
                            },
                            slot.trainer
                        );

                        // Schedule new reminders for the rescheduled session
                        const bookingId = currentBooking.id;
                        await scheduleAllSessionReminders(bookingId, {
                            trainerName: slot.trainer,
                            date: slot.date,
                            time: slot.time,
                            gym: currentBooking.gym,
                        });

                        Alert.alert(
                            'Rescheduled Successfully! ✅',
                            'Your session has been rescheduled. You\'ll receive reminders before your new session time.',
                            [
                                {
                                    text: 'OK',
                                    onPress: () => navigation.goBack(),
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const handleRequestTrainerChange = () => {
        Alert.alert(
            'Request Trainer Change',
            'Browse alternate trainers available at your preferred time. Subject to trainer approval.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Browse Trainers',
                    onPress: () => {
                        // Navigate to trainers list with filters
                        navigation.navigate('Workout' as never);
                    },
                },
            ]
        );
    };

    const handleCancelSession = () => {
        Alert.alert(
            'Cancel Session?',
            `This will cancel your session on ${currentBooking.currentDate}.\n\nCancellation policy: Free cancellation up to 24 hours before session.`,
            [
                {
                    text: 'Keep Session',
                    style: 'cancel',
                },
                {
                    text: 'Cancel Session',
                    onPress: () => {
                        Alert.alert('Session Cancelled', 'Your session has been cancelled and refund has been processed.');
                        navigation.goBack();
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={palette.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reschedule Session</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Current Booking Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Current Session</Text>
                    <View style={styles.currentBookingCard}>
                        <View style={styles.trainerRow}>
                            <Image source={{ uri: currentBooking.trainer.photo }} style={styles.trainerPhoto} />
                            <View style={styles.trainerInfo}>
                                <Text style={styles.trainerName}>{currentBooking.trainer.name}</Text>
                                <View style={styles.infoRow}>
                                    <Icon name="calendar" size={14} color={palette.textSecondary} />
                                    <Text style={styles.infoText}>{currentBooking.currentDate}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Icon name="clock-outline" size={14} color={palette.textSecondary} />
                                    <Text style={styles.infoText}>{currentBooking.currentTime}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Policy Warning */}
                <View style={styles.policyBanner}>
                    <Icon name="information" size={20} color="#4ECDC4" />
                    <Text style={styles.policyBannerText}>
                        Free reschedule up to {currentBooking.rescheduleDeadline}
                    </Text>
                </View>

                {/* Reschedule Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reschedule Options</Text>

                    <TouchableOpacity style={styles.optionCard} onPress={handleRequestTrainerChange}>
                        <Icon name="account-switch" size={24} color={palette.neonGreen} />
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Request Trainer Change</Text>
                            <Text style={styles.optionDesc}>Browse alternate trainers for your session</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color={palette.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionCard} onPress={handleCancelSession}>
                        <Icon name="close-circle" size={24} color="#FF6B6B" />
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Cancel Session</Text>
                            <Text style={styles.optionDesc}>Cancel and receive full refund</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color={palette.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Available Slots */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select New Time Slot</Text>
                    <Text style={styles.sectionSubtitle}>Choose from available slots below</Text>

                    {/* Same Trainer Slots */}
                    <Text style={styles.slotGroupTitle}>With {currentBooking.trainer.name}</Text>
                    <View style={styles.slotsGrid}>
                        {availableSlots
                            .filter((slot) => slot.trainerId === currentBooking.trainer.id)
                            .map((slot) => (
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
                                    <Text
                                        style={[
                                            styles.slotDay,
                                            !slot.available && styles.slotTextDisabled,
                                            selectedSlot === slot.id && styles.slotTextSelected,
                                        ]}
                                    >
                                        {slot.day}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.slotDate,
                                            !slot.available && styles.slotTextDisabled,
                                            selectedSlot === slot.id && styles.slotTextSelected,
                                        ]}
                                    >
                                        {slot.date}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.slotTime,
                                            !slot.available && styles.slotTextDisabled,
                                            selectedSlot === slot.id && styles.slotTextSelected,
                                        ]}
                                    >
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

                    {/* Alternate Trainer Slots */}
                    <Text style={styles.slotGroupTitle}>Alternate Trainers</Text>
                    <View style={styles.slotsGrid}>
                        {availableSlots
                            .filter((slot) => slot.trainerId !== currentBooking.trainer.id)
                            .map((slot) => (
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
                                    <Text
                                        style={[
                                            styles.slotDay,
                                            !slot.available && styles.slotTextDisabled,
                                            selectedSlot === slot.id && styles.slotTextSelected,
                                        ]}
                                    >
                                        {slot.day}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.slotDate,
                                            !slot.available && styles.slotTextDisabled,
                                            selectedSlot === slot.id && styles.slotTextSelected,
                                        ]}
                                    >
                                        {slot.date}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.slotTime,
                                            !slot.available && styles.slotTextDisabled,
                                            selectedSlot === slot.id && styles.slotTextSelected,
                                        ]}
                                    >
                                        {slot.time}
                                    </Text>
                                    <Text style={styles.slotTrainer}>{slot.trainer.split(' ')[0]}</Text>
                                </TouchableOpacity>
                            ))}
                    </View>
                </View>

                {/* Cost Summary */}
                {selectedSlot && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cost Summary</Text>
                        <View style={styles.costCard}>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>Original Price</Text>
                                <Text style={styles.costValue}>Rs. {currentBooking.price.toLocaleString()}</Text>
                            </View>
                            {isTrainerChanged && (
                                <View style={styles.costRow}>
                                    <Text style={styles.costLabel}>Trainer Change Fee</Text>
                                    <Text style={[styles.costValue, { color: '#FFA500' }]}>+Rs. {priceDifference.toLocaleString()}</Text>
                                </View>
                            )}
                            {currentBooking.rescheduleFee > 0 && (
                                <View style={styles.costRow}>
                                    <Text style={styles.costLabel}>Reschedule Fee</Text>
                                    <Text style={[styles.costValue, { color: '#FFA500' }]}>
                                        +Rs. {currentBooking.rescheduleFee.toLocaleString()}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.costRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total Adjustment</Text>
                                <Text style={styles.totalValue}>
                                    {totalAdjustment > 0 ? `+Rs. ${totalAdjustment.toLocaleString()}` : 'Rs. 0'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Agreement */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.agreementRow} onPress={() => setAgreedToPolicy(!agreedToPolicy)}>
                        <Icon
                            name={agreedToPolicy ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={24}
                            color={agreedToPolicy ? palette.neonGreen : palette.textSecondary}
                        />
                        <Text style={styles.agreementText}>I agree to the reschedule policy and terms</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.confirmButton, (!selectedSlot || !agreedToPolicy) && styles.confirmButtonDisabled]}
                    onPress={handleConfirmReschedule}
                    disabled={!selectedSlot || !agreedToPolicy}
                >
                    <LinearGradient
                        colors={
                            selectedSlot && agreedToPolicy
                                ? [palette.neonGreen, palette.neonGreenDim]
                                : ['#444', '#333']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmButtonGradient}
                    >
                        <Icon
                            name="check-bold"
                            size={20}
                            color={selectedSlot && agreedToPolicy ? palette.background : palette.textSecondary}
                        />
                        <Text
                            style={[
                                styles.confirmButtonText,
                                (!selectedSlot || !agreedToPolicy) && styles.confirmButtonTextDisabled,
                            ]}
                        >
                            Confirm Reschedule
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
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    sectionTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: spacing.md,
    },
    sectionSubtitle: {
        color: palette.textSecondary,
        fontSize: 14,
        marginBottom: spacing.md,
    },
    currentBookingCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    trainerRow: {
        flexDirection: 'row',
    },
    trainerPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: palette.border,
    },
    trainerInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    trainerName: {
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    infoText: {
        color: palette.textSecondary,
        fontSize: 13,
    },
    policyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.md,
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        borderRadius: 12,
        gap: spacing.sm,
    },
    policyBannerText: {
        flex: 1,
        color: '#4ECDC4',
        fontSize: 14,
        fontWeight: '600',
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: palette.border,
    },
    optionContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    optionTitle: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    optionDesc: {
        color: palette.textSecondary,
        fontSize: 12,
    },
    slotGroupTitle: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.sm,
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
    slotTrainer: {
        color: palette.textSecondary,
        fontSize: 10,
        marginTop: 4,
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
    costCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    costLabel: {
        color: palette.textSecondary,
        fontSize: 14,
    },
    costValue: {
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: palette.border,
        paddingTop: spacing.sm,
        marginTop: spacing.sm,
        marginBottom: 0,
    },
    totalLabel: {
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    totalValue: {
        color: palette.neonGreen,
        fontSize: 18,
        fontWeight: '700',
    },
    agreementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    agreementText: {
        flex: 1,
        color: palette.textPrimary,
        fontSize: 14,
    },
    bottomBar: {
        flexDirection: 'row',
        padding: spacing.lg,
        backgroundColor: palette.background,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        gap: spacing.md,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    cancelButtonText: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '700',
    },
    confirmButton: {
        flex: 2,
        borderRadius: 25,
        overflow: 'hidden',
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    confirmButtonText: {
        color: palette.background,
        fontSize: 15,
        fontWeight: '700',
    },
    confirmButtonTextDisabled: {
        color: palette.textSecondary,
    },
});
