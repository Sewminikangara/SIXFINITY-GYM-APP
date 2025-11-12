import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';

type NotificationType = 'booking' | 'payment' | 'reward' | 'system' | 'promo';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionable?: boolean;
}

export default function NotificationsScreen() {
    const navigation = useNavigation();

    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'booking',
            title: 'Booking Confirmed',
            message: 'Your gym session for tomorrow at 10:00 AM has been confirmed.',
            timestamp: new Date(Date.now() - 3600000),
            read: false,
            actionable: true,
        },
        {
            id: '2',
            type: 'reward',
            title: 'Points Earned!',
            message: 'You earned 50 points for completing your workout goal. Keep it up!',
            timestamp: new Date(Date.now() - 86400000),
            read: false,
        },
        {
            id: '3',
            type: 'payment',
            title: 'Payment Successful',
            message: '₹500 has been added to your wallet successfully.',
            timestamp: new Date(Date.now() - 86400000 * 2),
            read: true,
        },
        {
            id: '4',
            type: 'promo',
            title: 'Special Offer Just for You!',
            message: 'Get 30% off on personal training sessions. Offer valid for 7 days.',
            timestamp: new Date(Date.now() - 86400000 * 3),
            read: true,
            actionable: true,
        },
        {
            id: '5',
            type: 'booking',
            title: 'Booking Reminder',
            message: 'Your yoga class starts in 2 hours. Don\'t forget to check in!',
            timestamp: new Date(Date.now() - 86400000 * 4),
            read: true,
        },
        {
            id: '6',
            type: 'system',
            title: 'App Update Available',
            message: 'Version 2.0 is now available with new features and improvements.',
            timestamp: new Date(Date.now() - 86400000 * 7),
            read: true,
        },
    ]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const getTypeIcon = (type: NotificationType) => {
        switch (type) {
            case 'booking':
                return '📅';
            case 'payment':
                return '💳';
            case 'reward':
                return '🎁';
            case 'system':
                return '⚙️';
            case 'promo':
                return '🎉';
            default:
                return '🔔';
        }
    };

    const getTypeColor = (type: NotificationType) => {
        switch (type) {
            case 'booking':
                return palette.brandPrimary;
            case 'payment':
                return palette.success;
            case 'reward':
                return palette.warning;
            case 'system':
                return palette.textSecondary;
            case 'promo':
                return palette.brandSecondary;
            default:
                return palette.textPrimary;
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings' as never)}>
                    <Text style={styles.settingsButton}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Actions Bar */}
            {notifications.length > 0 && (
                <View style={styles.actionsBar}>
                    <Text style={styles.unreadCount}>
                        {unreadCount} unread
                    </Text>
                    <View style={styles.actionsButtons}>
                        {unreadCount > 0 && (
                            <TouchableOpacity onPress={markAllAsRead}>
                                <Text style={styles.actionButton}>Mark all read</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={clearAll}>
                            <Text style={[styles.actionButton, { color: palette.error }]}>Clear all</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptyText}>
                        You're all caught up! We'll notify you when something important happens.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.notificationCard, !item.read && styles.unreadCard]}
                            onPress={() => markAsRead(item.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.notificationContent}>
                                <View
                                    style={[
                                        styles.iconContainer,
                                        { backgroundColor: `${getTypeColor(item.type)}20` },
                                    ]}
                                >
                                    <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
                                </View>

                                <View style={styles.notificationBody}>
                                    <View style={styles.notificationHeader}>
                                        <Text style={styles.notificationTitle}>{item.title}</Text>
                                        {!item.read && <View style={styles.unreadDot} />}
                                    </View>
                                    <Text style={styles.notificationMessage}>{item.message}</Text>
                                    <Text style={styles.notificationTimestamp}>
                                        {formatTimestamp(item.timestamp)}
                                    </Text>
                                </View>
                            </View>

                            {item.actionable && (
                                <TouchableOpacity style={styles.actionLink}>
                                    <Text style={styles.actionLinkText}>View →</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(item.id);
                                }}
                            >
                                <Text style={styles.deleteButtonText}>✕</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            )}
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
    settingsButton: {
        fontSize: 20,
    },
    actionsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    unreadCount: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.textSecondary,
    },
    actionsButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    actionButton: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.brandPrimary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        lineHeight: 20,
    },
    listContainer: {
        padding: spacing.md,
    },
    notificationCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: palette.border,
        position: 'relative',
    },
    unreadCard: {
        borderLeftWidth: 3,
        borderLeftColor: palette.brandPrimary,
        backgroundColor: `${palette.brandPrimary}05`,
    },
    notificationContent: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    typeIcon: {
        fontSize: 20,
    },
    notificationBody: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs / 2,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: palette.brandPrimary,
        marginLeft: spacing.xs,
    },
    notificationMessage: {
        fontSize: 13,
        color: palette.textSecondary,
        lineHeight: 18,
        marginBottom: spacing.xs,
    },
    notificationTimestamp: {
        fontSize: 11,
        color: palette.textTertiary,
    },
    actionLink: {
        alignSelf: 'flex-start',
        paddingVertical: spacing.xs,
    },
    actionLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.brandPrimary,
    },
    deleteButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        padding: spacing.xs,
    },
    deleteButtonText: {
        fontSize: 18,
        color: palette.textTertiary,
        fontWeight: '300',
    },
});
