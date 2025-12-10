import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// NOTE: expo-notifications removed from Expo Go in SDK 53+
// This will work in development builds but is disabled for Expo Go
// Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: false,
//         shouldShowBanner: true,
//         shouldShowList: true,
//     }),
// });

/**
 * Request notification permissions from the user
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return false;
        }

        // For Android, create notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#C5FF4A',
            });

            await Notifications.setNotificationChannelAsync('bookings', {
                name: 'Bookings',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#C5FF4A',
                description: 'Notifications for trainer bookings',
            });

            await Notifications.setNotificationChannelAsync('reminders', {
                name: 'Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FFD700',
                description: 'Session reminders',
            });
        }

        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Get the Expo push token for this device
 */
export const getExpoPushToken = async (): Promise<string | null> => {
    try {
        const token = await Notifications.getExpoPushTokenAsync({
            projectId: 'your-expo-project-id', // Replace with your actual project ID
        });
        return token.data;
    } catch (error) {
        return null;
    }
};

/**
 * Send a local notification for booking confirmation
 */
export const sendBookingConfirmation = async (booking: {
    trainerName: string;
    date: string;
    time: string;
    gym: string;
}): Promise<void> => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🎉 Booking Confirmed!',
                body: `Your session with ${booking.trainerName} is confirmed for ${booking.date} at ${booking.time}`,
                data: {
                    type: 'booking_confirmed',
                    trainerName: booking.trainerName,
                    date: booking.date,
                    time: booking.time,
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                categoryIdentifier: 'bookings',
            },
            trigger: null, // Send immediately
        });
    } catch (error) {
    }
};

/**
 * Schedule a reminder notification before the session
 */
export const scheduleSessionReminder = async (
    bookingId: string,
    booking: {
        trainerName: string;
        date: string;
        time: string;
        gym: string;
    },
    hoursBeforeSession: number = 24
): Promise<string | null> => {
    try {
        // Parse the session date and time
        const sessionDateTime = new Date(`${booking.date} ${booking.time}`);
        const reminderTime = new Date(sessionDateTime.getTime() - hoursBeforeSession * 60 * 60 * 1000);

        // Don't schedule if reminder time is in the past
        if (reminderTime.getTime() < Date.now()) {
            return null;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '⏰ Session Reminder',
                body: `Your session with ${booking.trainerName} is in ${hoursBeforeSession} hours at ${booking.gym}`,
                data: {
                    type: 'session_reminder',
                    bookingId,
                    trainerName: booking.trainerName,
                    date: booking.date,
                    time: booking.time,
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                categoryIdentifier: 'reminders',
            },
            trigger: {
                type: 'date',
                date: reminderTime,
            } as Notifications.DateTriggerInput,
        });

        return notificationId;
    } catch (error) {
        return null;
    }
};

/**
 * Schedule multiple reminders (24h and 1h before session)
 */
export const scheduleAllSessionReminders = async (
    bookingId: string,
    booking: {
        trainerName: string;
        date: string;
        time: string;
        gym: string;
    }
): Promise<string[]> => {
    const notificationIds: string[] = [];

    // 24-hour reminder
    const id24h = await scheduleSessionReminder(bookingId, booking, 24);
    if (id24h) notificationIds.push(id24h);

    // 1-hour reminder
    const id1h = await scheduleSessionReminder(bookingId, booking, 1);
    if (id1h) notificationIds.push(id1h);

    return notificationIds;
};

/**
 * Send reschedule notification
 */
export const sendRescheduleNotification = async (
    oldBooking: { date: string; time: string },
    newBooking: { date: string; time: string },
    trainerName: string
): Promise<void> => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '📅 Session Rescheduled',
                body: `Your session with ${trainerName} has been moved from ${oldBooking.date} ${oldBooking.time} to ${newBooking.date} ${newBooking.time}`,
                data: {
                    type: 'session_rescheduled',
                    oldDate: oldBooking.date,
                    oldTime: oldBooking.time,
                    newDate: newBooking.date,
                    newTime: newBooking.time,
                    trainerName,
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                categoryIdentifier: 'bookings',
            },
            trigger: null,
        });
    } catch (error) {
    }
};

/**
 * Send cancellation notification
 */
export const sendCancellationNotification = async (
    booking: { trainerName: string; date: string; time: string },
    initiatedBy: 'user' | 'trainer'
): Promise<void> => {
    try {
        const title = initiatedBy === 'trainer'
            ? '❌ Session Cancelled by Trainer'
            : '✅ Cancellation Confirmed';

        const body = initiatedBy === 'trainer'
            ? `${booking.trainerName} has cancelled your session on ${booking.date} at ${booking.time}. Full refund will be processed.`
            : `Your session with ${booking.trainerName} on ${booking.date} at ${booking.time} has been cancelled.`;

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: {
                    type: 'session_cancelled',
                    initiatedBy,
                    trainerName: booking.trainerName,
                    date: booking.date,
                    time: booking.time,
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                categoryIdentifier: 'bookings',
            },
            trigger: null,
        });
    } catch (error) {
    }
};

/**
 * Send review reminder after completed session
 */
export const sendReviewReminder = async (
    bookingId: string,
    trainerName: string
): Promise<void> => {
    try {
        // Schedule review reminder 2 hours after session completion
        const reminderTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '⭐ Rate Your Session',
                body: `How was your training with ${trainerName}? Leave a review to help others!`,
                data: {
                    type: 'review_reminder',
                    bookingId,
                    trainerName,
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.DEFAULT,
                categoryIdentifier: 'reminders',
            },
            trigger: {
                type: 'date',
                date: reminderTime,
            } as Notifications.DateTriggerInput,
        });
    } catch (error) {
    }
};

/**
 * Cancel scheduled notifications by ID
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
    }
};

/**
 * Cancel all scheduled notifications for a booking
 */
export const cancelAllBookingNotifications = async (
    notificationIds: string[]
): Promise<void> => {
    try {
        for (const id of notificationIds) {
            await Notifications.cancelScheduledNotificationAsync(id);
        }
    } catch (error) {
    }
};

/**
 * Get all scheduled notifications
 */
export const getAllScheduledNotifications = async () => {
    try {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        return notifications;
    } catch (error) {
        return [];
    }
};

/**
 * Listen for notification responses (when user taps a notification)
 */
export const addNotificationResponseListener = (
    callback: (response: Notifications.NotificationResponse) => void
) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Listen for notifications received while app is in foreground
 */
export const addNotificationReceivedListener = (
    callback: (notification: Notifications.Notification) => void
) => {
    return Notifications.addNotificationReceivedListener(callback);
};
