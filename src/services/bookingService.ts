/**
 * Booking Service
 * Handles gym bookings, trainer sessions, cancellations, and booking history
 */

import { supabase } from '@/config/supabaseClient';


export interface Booking {
    booking_id: string;
    user_id: string;
    gym_id: string | null;
    trainer_id: string | null;
    booking_type: 'gym_access' | 'personal_training' | 'group_class' | 'virtual_session';
    session_type: string | null;
    class_name: string | null;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    end_time: string | null;
    status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'canceled' | 'no_show' | 'rescheduled';
    checked_in_at: string | null;
    checked_out_at: string | null;
    check_in_method: 'qr_code' | 'nfc' | 'manual' | 'auto' | null;
    location: string | null;
    virtual_meeting_link: string | null;
    virtual_meeting_platform: 'zoom' | 'google_meet' | 'teams' | 'other' | null;
    virtual_meeting_id: string | null;
    virtual_meeting_password: string | null;
    price: number;
    paid_amount: number;
    payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed';
    payment_method: string | null;
    transaction_id: string | null;
    booking_notes: string | null;
    special_requests: string | null;
    equipment_needed: string[];
    confirmed_by: string | null;
    confirmed_at: string | null;
    canceled_by: string | null;
    canceled_at: string | null;
    cancellation_reason: string | null;
    cancellation_type: 'user_canceled' | 'gym_canceled' | 'trainer_canceled' | 'system_canceled' | null;
    refund_amount: number;
    refund_status: 'not_applicable' | 'pending' | 'approved' | 'processed' | 'rejected' | null;
    refund_processed_at: string | null;
    is_recurring: boolean;
    recurring_pattern: any;
    parent_booking_id: string | null;
    reminder_sent: boolean;
    reminder_sent_at: string | null;
    rating: number | null;
    review: string | null;
    reviewed_at: string | null;
    metadata: any;
    created_at: string;
    updated_at: string;
}

export interface BookingHistory {
    history_id: string;
    booking_id: string;
    user_id: string;
    gym_id: string | null;
    trainer_id: string | null;
    session_date: string;
    duration_minutes: number;
    check_in_time: string;
    check_out_time: string | null;
    actual_duration_minutes: number | null;
    session_type: string | null;
    calories_burned: number | null;
    average_heart_rate: number | null;
    distance_km: number | null;
    performance_notes: string | null;
    trainer_notes: string | null;
    equipment_used: string[];
    workout_summary: any;
    created_at: string;
}

export interface BookingCancellation {
    cancellation_id: string;
    booking_id: string;
    user_id: string;
    canceled_by: string;
    canceled_by_role: 'user' | 'gym' | 'trainer' | 'admin';
    cancellation_reason: string;
    cancellation_type: 'user_canceled' | 'gym_canceled' | 'trainer_canceled' | 'system_canceled';
    original_price: number;
    refund_amount: number;
    refund_percentage: number;
    cancellation_fee: number;
    hours_before_session: number;
    refund_policy_applied: string | null;
    refund_status: 'pending' | 'approved' | 'processed' | 'rejected';
    refund_processed_at: string | null;
    refund_transaction_id: string | null;
    notes: string | null;
    canceled_at: string;
    created_at: string;
}

export interface BookingDetails {
    detail_id: string;
    booking_id: string;
    user_id: string;
    gym_name: string | null;
    gym_address: string | null;
    gym_contact: string | null;
    trainer_name: string | null;
    trainer_contact: string | null;
    trainer_specialization: string | null;
    check_in_qr_code: string | null;
    parking_info: string | null;
    facilities_available: string[];
    amenities: string[];
    dress_code: string | null;
    what_to_bring: string[];
    covid_guidelines: string | null;
    emergency_contact: string | null;
    access_instructions: string | null;
    created_at: string;
    updated_at: string;
}

export interface BookingNotification {
    notification_id: string;
    booking_id: string;
    user_id: string;
    notification_type: 'booking_confirmed' | 'reminder' | 'check_in_ready' | 'session_started' | 'session_completed' | 'canceled' | 'rescheduled' | 'payment_received' | 'refund_processed';
    title: string;
    message: string;
    sent_at: string;
    delivery_method: 'push' | 'email' | 'sms' | 'in_app';
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

// BOOKING OPERATIONS

/**
 * Create a new booking
 */
export const createBooking = async (bookingData: Partial<Booking>) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                status: 'pending',
                payment_status: 'pending',
                ...bookingData,
            })
            .select()
            .single();

        if (error) throw error;

        // Auto-create booking details
        if (data) {
            await createBookingDetails(data.booking_id, data.user_id, {});
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating booking:', error);
        return { data: null, error: error };
    }
};

/**
 * Get all bookings for a user
 */
export const getBookings = async (
    userId: string,
    filters?: {
        status?: Booking['status'];
        booking_type?: Booking['booking_type'];
        startDate?: string;
        endDate?: string;
        limit?: number;
    }
) => {
    try {
        let query = supabase
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .order('scheduled_date', { ascending: false })
            .order('scheduled_time', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.booking_type) {
            query = query.eq('booking_type', filters.booking_type);
        }
        if (filters?.startDate) {
            query = query.gte('scheduled_date', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('scheduled_date', filters.endDate);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching bookings:', error);
        return { data: null, error: error };
    }
};

/**
 * Get a single booking by ID
 */
export const getBooking = async (bookingId: string) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('booking_id', bookingId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching booking:', error);
        return { data: null, error: error };
    }
};

/**
 * Get upcoming bookings
 */
export const getUpcomingBookings = async (userId: string, limit: number = 10) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .gte('scheduled_date', today)
            .in('status', ['pending', 'confirmed'])
            .order('scheduled_date', { ascending: true })
            .order('scheduled_time', { ascending: true })
            .limit(limit);

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching upcoming bookings:', error);
        return { data: null, error: error };
    }
};

/**
 * Update booking
 */
export const updateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .update(updates)
            .eq('booking_id', bookingId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating booking:', error);
        return { data: null, error: error };
    }
};

/**
 * Confirm booking
 */
export const confirmBooking = async (bookingId: string, confirmedBy: string) => {
    try {
        const { data, error } = await updateBooking(bookingId, {
            status: 'confirmed',
            confirmed_by: confirmedBy,
            confirmed_at: new Date().toISOString(),
        });

        if (error) throw error;

        // Send confirmation notification
        if (data) {
            await createBookingNotification({
                booking_id: bookingId,
                user_id: data.user_id,
                notification_type: 'booking_confirmed',
                title: 'Booking Confirmed',
                message: `Your booking for ${data.scheduled_date} at ${data.scheduled_time} has been confirmed.`,
                delivery_method: 'push',
            });
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error confirming booking:', error);
        return { data: null, error: error };
    }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (
    bookingId: string,
    canceledBy: string,
    canceledByRole: BookingCancellation['canceled_by_role'],
    reason: string
) => {
    try {
        // Get booking details
        const { data: booking } = await getBooking(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Calculate hours before session
        const scheduledDateTime = new Date(`${booking.scheduled_date} ${booking.scheduled_time}`);
        const now = new Date();
        const hoursBeforeSession = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Calculate refund based on cancellation policy (from database trigger)
        // 48+ hours: 100%, 24-48 hours: 80%, 12-24 hours: 50%, <12 hours: 0%
        let refundPercentage = 0;
        if (hoursBeforeSession >= 48) {
            refundPercentage = 100;
        } else if (hoursBeforeSession >= 24) {
            refundPercentage = 80;
        } else if (hoursBeforeSession >= 12) {
            refundPercentage = 50;
        }

        const refundAmount = (booking.price * refundPercentage) / 100;
        const cancellationFee = booking.price - refundAmount;

        // Update booking status
        const { data, error } = await updateBooking(bookingId, {
            status: 'canceled',
            canceled_by: canceledBy,
            canceled_at: new Date().toISOString(),
            cancellation_reason: reason,
            cancellation_type:
                canceledByRole === 'user'
                    ? 'user_canceled'
                    : canceledByRole === 'gym'
                        ? 'gym_canceled'
                        : canceledByRole === 'trainer'
                            ? 'trainer_canceled'
                            : 'system_canceled',
            refund_amount: refundAmount,
            refund_status: refundAmount > 0 ? 'pending' : 'not_applicable',
        });

        if (error) throw error;

        // Create cancellation record
        await supabase.from('booking_cancellations').insert({
            booking_id: bookingId,
            user_id: booking.user_id,
            canceled_by: canceledBy,
            canceled_by_role: canceledByRole,
            cancellation_reason: reason,
            cancellation_type:
                canceledByRole === 'user'
                    ? 'user_canceled'
                    : canceledByRole === 'gym'
                        ? 'gym_canceled'
                        : canceledByRole === 'trainer'
                            ? 'trainer_canceled'
                            : 'system_canceled',
            original_price: booking.price,
            refund_amount: refundAmount,
            refund_percentage: refundPercentage,
            cancellation_fee: cancellationFee,
            hours_before_session: hoursBeforeSession,
            refund_status: refundAmount > 0 ? 'pending' : 'rejected',
        });

        // Send cancellation notification
        await createBookingNotification({
            booking_id: bookingId,
            user_id: booking.user_id,
            notification_type: 'canceled',
            title: 'Booking Canceled',
            message: `Your booking has been canceled. ${refundAmount > 0 ? `Refund of $${refundAmount.toFixed(2)} will be processed.` : 'No refund applicable.'
                }`,
            delivery_method: 'push',
        });

        return { data, error: null, refundAmount, cancellationFee };
    } catch (error: any) {
        console.error('Error canceling booking:', error);
        return { data: null, error: error, refundAmount: 0, cancellationFee: 0 };
    }
};

/**
 * Calculate refund amount based on cancellation time
 */
export const calculateRefund = (booking: Booking): { refundAmount: number; refundPercentage: number; cancellationFee: number } => {
    const scheduledDateTime = new Date(`${booking.scheduled_date} ${booking.scheduled_time}`);
    const now = new Date();
    const hoursBeforeSession = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursBeforeSession >= 48) {
        refundPercentage = 100;
    } else if (hoursBeforeSession >= 24) {
        refundPercentage = 80;
    } else if (hoursBeforeSession >= 12) {
        refundPercentage = 50;
    }

    const refundAmount = (booking.price * refundPercentage) / 100;
    const cancellationFee = booking.price - refundAmount;

    return { refundAmount, refundPercentage, cancellationFee };
};

/**
 * Reschedule booking
 */
export const rescheduleBooking = async (
    bookingId: string,
    newDate: string,
    newTime: string
) => {
    try {
        const { data, error } = await updateBooking(bookingId, {
            scheduled_date: newDate,
            scheduled_time: newTime,
            status: 'rescheduled',
        });

        if (error) throw error;

        // Send rescheduled notification
        if (data) {
            await createBookingNotification({
                booking_id: bookingId,
                user_id: data.user_id,
                notification_type: 'rescheduled',
                title: 'Booking Rescheduled',
                message: `Your booking has been rescheduled to ${newDate} at ${newTime}.`,
                delivery_method: 'push',
            });
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error rescheduling booking:', error);
        return { data: null, error: error };
    }
};

// CHECK-IN/CHECK-OUT OPERATIONS

/**
 * Check in to a booking
 */
export const checkIn = async (
    bookingId: string,
    method: Booking['check_in_method'] = 'manual'
) => {
    try {
        const { data, error } = await updateBooking(bookingId, {
            status: 'checked_in',
            checked_in_at: new Date().toISOString(),
            check_in_method: method,
        });

        if (error) throw error;

        // Send check-in notification
        if (data) {
            await createBookingNotification({
                booking_id: bookingId,
                user_id: data.user_id,
                notification_type: 'session_started',
                title: 'Session Started',
                message: 'You have checked in. Enjoy your workout!',
                delivery_method: 'push',
            });
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error checking in:', error);
        return { data: null, error: error };
    }
};

/**
 * Check out from a booking
 */
export const checkOut = async (bookingId: string) => {
    try {
        const { data, error } = await updateBooking(bookingId, {
            status: 'completed',
            checked_out_at: new Date().toISOString(),
        });

        if (error) throw error;

        // Create booking history
        if (data && data.checked_in_at) {
            const checkedInTime = new Date(data.checked_in_at);
            const checkedOutTime = new Date();
            const actualDuration = Math.round((checkedOutTime.getTime() - checkedInTime.getTime()) / (1000 * 60));

            await supabase.from('booking_history').insert({
                booking_id: bookingId,
                user_id: data.user_id,
                gym_id: data.gym_id,
                trainer_id: data.trainer_id,
                session_date: data.scheduled_date,
                duration_minutes: data.duration_minutes,
                check_in_time: data.checked_in_at,
                check_out_time: checkedOutTime.toISOString(),
                actual_duration_minutes: actualDuration,
                session_type: data.session_type,
            });

            // Send completion notification
            await createBookingNotification({
                booking_id: bookingId,
                user_id: data.user_id,
                notification_type: 'session_completed',
                title: 'Session Completed',
                message: 'Great job! Your session is complete. How was your experience?',
                delivery_method: 'push',
            });
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error checking out:', error);
        return { data: null, error: error };
    }
};


// RATING & REVIEW OPERATIONS


/**
 * Rate and review a session
 */
export const rateSession = async (
    bookingId: string,
    rating: number,
    review?: string
) => {
    try {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        const { data, error } = await updateBooking(bookingId, {
            rating: rating,
            review: review || null,
            reviewed_at: new Date().toISOString(),
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error rating session:', error);
        return { data: null, error: error };
    }
};

// BOOKING HISTORY OPERATIONS

/**
 * Get booking history for a user
 */
export const getBookingHistory = async (userId: string, limit: number = 20) => {
    try {
        const { data, error } = await supabase
            .from('booking_history')
            .select('*')
            .eq('user_id', userId)
            .order('session_date', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching booking history:', error);
        return { data: null, error: error };
    }
};

/**
 * Update booking history with performance metrics
 */
export const updateBookingHistory = async (
    historyId: string,
    metrics: {
        calories_burned?: number;
        average_heart_rate?: number;
        distance_km?: number;
        performance_notes?: string;
        trainer_notes?: string;
        equipment_used?: string[];
        workout_summary?: any;
    }
) => {
    try {
        const { data, error } = await supabase
            .from('booking_history')
            .update(metrics)
            .eq('history_id', historyId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating booking history:', error);
        return { data: null, error: error };
    }
};

// BOOKING DETAILS OPERATIONS

/**
 * Get booking details
 */
export const getBookingDetails = async (bookingId: string) => {
    try {
        const { data, error } = await supabase
            .from('booking_details')
            .select('*')
            .eq('booking_id', bookingId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching booking details:', error);
        return { data: null, error: error };
    }
};

/**
 * Create booking details (typically called automatically)
 */
export const createBookingDetails = async (
    bookingId: string,
    userId: string,
    details: Partial<BookingDetails>
) => {
    try {
        const { data, error } = await supabase
            .from('booking_details')
            .insert({
                booking_id: bookingId,
                user_id: userId,
                ...details,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating booking details:', error);
        return { data: null, error: error };
    }
};

/**
 * Update booking details
 */
export const updateBookingDetails = async (
    bookingId: string,
    updates: Partial<BookingDetails>
) => {
    try {
        const { data, error } = await supabase
            .from('booking_details')
            .update(updates)
            .eq('booking_id', bookingId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating booking details:', error);
        return { data: null, error: error };
    }
};

// CANCELLATION 

/**
 * Get cancellation details
 */
export const getCancellationDetails = async (bookingId: string) => {
    try {
        const { data, error } = await supabase
            .from('booking_cancellations')
            .select('*')
            .eq('booking_id', bookingId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching cancellation details:', error);
        return { data: null, error: error };
    }
};

/**
 * Process refund for cancellation
 */
export const processRefund = async (cancellationId: string, transactionId: string) => {
    try {
        const { data, error } = await supabase
            .from('booking_cancellations')
            .update({
                refund_status: 'processed',
                refund_processed_at: new Date().toISOString(),
                refund_transaction_id: transactionId,
            })
            .eq('cancellation_id', cancellationId)
            .select()
            .single();

        if (error) throw error;

        // Send refund notification
        if (data) {
            await createBookingNotification({
                booking_id: data.booking_id,
                user_id: data.user_id,
                notification_type: 'refund_processed',
                title: 'Refund Processed',
                message: `Your refund of $${data.refund_amount.toFixed(2)} has been processed.`,
                delivery_method: 'push',
            });
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error processing refund:', error);
        return { data: null, error: error };
    }
};

// NOTIFICATION 
/**
 * Get booking notifications
 */
export const getBookingNotifications = async (
    bookingId: string,
    userId: string
) => {
    try {
        const { data, error } = await supabase
            .from('booking_notifications')
            .select('*')
            .eq('booking_id', bookingId)
            .eq('user_id', userId)
            .order('sent_at', { ascending: false });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching booking notifications:', error);
        return { data: null, error: error };
    }
};

/**
 * Create booking notification
 */
export const createBookingNotification = async (
    notification: Partial<BookingNotification>
) => {
    try {
        const { data, error } = await supabase
            .from('booking_notifications')
            .insert({
                sent_at: new Date().toISOString(),
                is_read: false,
                ...notification,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating booking notification:', error);
        return { data: null, error: error };
    }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
    try {
        const { data, error } = await supabase
            .from('booking_notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('notification_id', notificationId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return { data: null, error: error };
    }
};


// STATISTICS & ANALYTICS

/**
 * Get booking statistics for a user
 */
export const getBookingStats = async (userId: string) => {
    try {
        // Total bookings
        const { count: totalBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Completed bookings
        const { count: completedBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');

        // Canceled bookings
        const { count: canceledBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'canceled');

        // Upcoming bookings
        const today = new Date().toISOString().split('T')[0];
        const { count: upcomingBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('scheduled_date', today)
            .in('status', ['pending', 'confirmed']);

        // Total spent
        const { data: transactions } = await supabase
            .from('bookings')
            .select('paid_amount')
            .eq('user_id', userId)
            .eq('payment_status', 'paid');

        const totalSpent = transactions?.reduce((sum, t) => sum + (t.paid_amount || 0), 0) || 0;

        return {
            data: {
                totalBookings: totalBookings || 0,
                completedBookings: completedBookings || 0,
                canceledBookings: canceledBookings || 0,
                upcomingBookings: upcomingBookings || 0,
                totalSpent: totalSpent,
            },
            error: null,
        };
    } catch (error: any) {
        console.error('Error fetching booking stats:', error);
        return {
            data: {
                totalBookings: 0,
                completedBookings: 0,
                canceledBookings: 0,
                upcomingBookings: 0,
                totalSpent: 0,
            },
            error: error,
        };
    }
};

// UTILITY FUNCTIONS

/**
 * Format booking date and time
 */
export const formatBookingDateTime = (date: string, time: string): string => {
    const bookingDate = new Date(`${date} ${time}`);
    return bookingDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

/**
 * Check if booking is in the past
 */
export const isBookingPast = (date: string, time: string): boolean => {
    const bookingDateTime = new Date(`${date} ${time}`);
    return bookingDateTime < new Date();
};

/**
 * Check if booking can be canceled
 */
export const canCancelBooking = (date: string, time: string): boolean => {
    const bookingDateTime = new Date(`${date} ${time}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilBooking > 0; // Can cancel anytime before the booking
};

/**
 * Get hours until booking
 */
export const getHoursUntilBooking = (date: string, time: string): number => {
    const bookingDateTime = new Date(`${date} ${time}`);
    const now = new Date();
    return Math.max(0, (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
};
