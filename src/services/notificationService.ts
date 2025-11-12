/**
 * Notification Service
 * Handles all notifications and notification preferences
 */

import { supabase } from '@/config/supabaseClient';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Notification {
    notification_id: string;
    user_id: string;
    category: 'payment' | 'booking' | 'reward' | 'system' | 'offer' | 'achievement' | 'workout' | 'meal' | 'gym' | 'trainer' | 'social';
    type: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    title: string;
    message: string;
    body: string | null;
    image_url: string | null;
    icon_url: string | null;
    action_type: 'navigate' | 'open_url' | 'none' | null;
    action_data: any;
    deep_link: string | null;
    delivery_method: 'push' | 'email' | 'sms' | 'in_app';
    is_read: boolean;
    read_at: string | null;
    is_archived: boolean;
    archived_at: string | null;
    scheduled_for: string | null;
    sent_at: string | null;
    expires_at: string | null;
    related_entity_type: string | null;
    related_entity_id: string | null;
    metadata: any;
    created_at: string;
    updated_at: string;
}

export interface NotificationPreferences {
    preference_id: string;
    user_id: string;
    // Push Notifications
    push_enabled: boolean;
    push_payment: boolean;
    push_booking: boolean;
    push_reward: boolean;
    push_system: boolean;
    push_offer: boolean;
    push_achievement: boolean;
    push_workout: boolean;
    push_meal: boolean;
    push_gym: boolean;
    push_trainer: boolean;
    push_social: boolean;
    // Email Notifications
    email_enabled: boolean;
    email_payment: boolean;
    email_booking: boolean;
    email_reward: boolean;
    email_system: boolean;
    email_offer: boolean;
    email_achievement: boolean;
    email_workout: boolean;
    email_meal: boolean;
    email_gym: boolean;
    email_trainer: boolean;
    email_social: boolean;
    email_newsletter: boolean;
    email_promotional: boolean;
    // SMS Notifications
    sms_enabled: boolean;
    sms_payment: boolean;
    sms_booking: boolean;
    sms_reward: boolean;
    sms_system: boolean;
    // General Settings
    do_not_disturb: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
    sound_enabled: boolean;
    vibration_enabled: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// NOTIFICATION OPERATIONS
// ============================================================================

/**
 * Get all notifications for a user
 */
export const getNotifications = async (
    userId: string,
    filters?: {
        category?: Notification['category'];
        is_read?: boolean;
        is_archived?: boolean;
        priority?: Notification['priority'];
        limit?: number;
    }
) => {
    try {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (filters?.category) {
            query = query.eq('category', filters.category);
        }
        if (filters?.is_read !== undefined) {
            query = query.eq('is_read', filters.is_read);
        }
        if (filters?.is_archived !== undefined) {
            query = query.eq('is_archived', filters.is_archived);
        }
        if (filters?.priority) {
            query = query.eq('priority', filters.priority);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return { data: null, error: error };
    }
};

/**
 * Get a single notification
 */
export const getNotification = async (notificationId: string) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('notification_id', notificationId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching notification:', error);
        return { data: null, error: error };
    }
};

/**
 * Get unread notifications
 */
export const getUnreadNotifications = async (userId: string, limit: number = 20) => {
    try {
        return await getNotifications(userId, { is_read: false, is_archived: false, limit });
    } catch (error: any) {
        console.error('Error fetching unread notifications:', error);
        return { data: null, error: error };
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string) => {
    try {
        const { data, error } = await supabase.rpc('get_unread_notification_count', {
            p_user_id: userId,
        });

        if (error) throw error;

        return { data: data || 0, error: null };
    } catch (error: any) {
        console.error('Error fetching unread count:', error);
        return { data: 0, error: error };
    }
};

/**
 * Send/Create a notification
 */
export const sendNotification = async (notification: Partial<Notification>) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                priority: 'normal',
                delivery_method: 'in_app',
                is_read: false,
                is_archived: false,
                sent_at: new Date().toISOString(),
                ...notification,
            })
            .select()
            .single();

        if (error) throw error;

        // Note: Actual push notification/email/SMS sending would be done here
        // This would typically call a separate service (Firebase, OneSignal, etc.)

        return { data, error: null };
    } catch (error: any) {
        console.error('Error sending notification:', error);
        return { data: null, error: error };
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string) => {
    try {
        const { data, error } = await supabase.rpc('mark_notification_as_read', {
            p_notification_id: notificationId,
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return { data: null, error: error };
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId: string) => {
    try {
        const { data, error } = await supabase.rpc('mark_all_notifications_as_read', {
            p_user_id: userId,
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        return { data: null, error: error };
    }
};

/**
 * Archive notification
 */
export const archiveNotification = async (notificationId: string) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .update({
                is_archived: true,
                archived_at: new Date().toISOString(),
            })
            .eq('notification_id', notificationId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error archiving notification:', error);
        return { data: null, error: error };
    }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('notification_id', notificationId);

        if (error) throw error;

        return { data: true, error: null };
    } catch (error: any) {
        console.error('Error deleting notification:', error);
        return { data: false, error: error };
    }
};

/**
 * Clear all notifications (delete all read/archived)
 */
export const clearAllNotifications = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)
            .or('is_read.eq.true,is_archived.eq.true');

        if (error) throw error;

        return { data: true, error: null };
    } catch (error: any) {
        console.error('Error clearing notifications:', error);
        return { data: false, error: error };
    }
};

// ============================================================================
// NOTIFICATION PREFERENCES OPERATIONS
// ============================================================================

/**
 * Get notification preferences
 */
export const getPreferences = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // If no preferences exist, create default
        if (!data) {
            return await createDefaultPreferences(userId);
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching notification preferences:', error);
        return { data: null, error: error };
    }
};

/**
 * Create default notification preferences
 */
export const createDefaultPreferences = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .insert({
                user_id: userId,
                // All push enabled by default
                push_enabled: true,
                push_payment: true,
                push_booking: true,
                push_reward: true,
                push_system: true,
                push_offer: true,
                push_achievement: true,
                push_workout: true,
                push_meal: true,
                push_gym: true,
                push_trainer: true,
                push_social: true,
                // Email selective by default
                email_enabled: true,
                email_payment: true,
                email_booking: true,
                email_reward: true,
                email_system: true,
                email_newsletter: false,
                email_promotional: false,
                // SMS minimal by default
                sms_enabled: false,
                sms_payment: true,
                sms_booking: true,
                // General settings
                frequency: 'instant',
                sound_enabled: true,
                vibration_enabled: true,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating default preferences:', error);
        return { data: null, error: error };
    }
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (
    userId: string,
    preferences: Partial<NotificationPreferences>
) => {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .update(preferences)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating notification preferences:', error);
        return { data: null, error: error };
    }
};

/**
 * Toggle specific notification category
 */
export const toggleCategory = async (
    userId: string,
    channel: 'push' | 'email' | 'sms',
    category: string,
    enabled: boolean
) => {
    try {
        const key = `${channel}_${category}`;
        return await updatePreferences(userId, { [key]: enabled } as any);
    } catch (error: any) {
        console.error('Error toggling notification category:', error);
        return { data: null, error: error };
    }
};

/**
 * Set quiet hours
 */
export const setQuietHours = async (
    userId: string,
    enabled: boolean,
    startTime?: string,
    endTime?: string
) => {
    try {
        return await updatePreferences(userId, {
            quiet_hours_enabled: enabled,
            quiet_hours_start: startTime || null,
            quiet_hours_end: endTime || null,
        });
    } catch (error: any) {
        console.error('Error setting quiet hours:', error);
        return { data: null, error: error };
    }
};

/**
 * Enable/Disable Do Not Disturb
 */
export const setDoNotDisturb = async (userId: string, enabled: boolean) => {
    try {
        return await updatePreferences(userId, { do_not_disturb: enabled });
    } catch (error: any) {
        console.error('Error setting do not disturb:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// NOTIFICATION STATISTICS
// ============================================================================

/**
 * Get notification statistics
 */
export const getNotificationStats = async (userId: string) => {
    try {
        const { count: total } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { count: unread } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        const { count: archived } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_archived', true);

        return {
            data: {
                total: total || 0,
                unread: unread || 0,
                read: (total || 0) - (unread || 0),
                archived: archived || 0,
            },
            error: null,
        };
    } catch (error: any) {
        console.error('Error fetching notification stats:', error);
        return {
            data: { total: 0, unread: 0, read: 0, archived: 0 },
            error: error,
        };
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format notification time (e.g., "2 hours ago", "yesterday")
 */
export const formatNotificationTime = (timestamp: string): string => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return notificationTime.toLocaleDateString();
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority: Notification['priority']): string => {
    const colors = {
        low: '#94A3B8',
        normal: '#3B82F6',
        high: '#F59E0B',
        urgent: '#EF4444',
    };
    return colors[priority] || colors.normal;
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category: Notification['category']): string => {
    const icons = {
        payment: '💳',
        booking: '📅',
        reward: '🎁',
        system: '⚙️',
        offer: '🏷️',
        achievement: '🏆',
        workout: '💪',
        meal: '🍽️',
        gym: '🏋️',
        trainer: '👤',
        social: '👥',
    };
    return icons[category] || '🔔';
};
