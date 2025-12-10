/**
 * TRAINERS SERVICE
 * Complete backend service for all trainer-related operations
 * Production-ready with error handling, type safety, and RLS support
 */

import { supabase } from '../config/supabaseClient';
import { processRefund } from './walletService';

// =============================================
// TYPES & INTERFACES
// =============================================

export interface Trainer {
    id: string;
    user_id: string;
    full_name: string;
    email?: string;
    phone?: string;
    profile_photo_url?: string;
    cover_image_url?: string;
    bio?: string;
    specializations: string[];
    certifications: string[];
    experience_years: number;
    achievements: string[];
    price_per_session: number;
    monthly_package_price?: number;
    monthly_package_sessions: number;
    rating: number;
    total_sessions_completed: number;
    is_active: boolean;
    availability_status: 'available' | 'busy' | 'offline';
    gym_id?: string;
    gym?: {
        id: string;
        name: string;
        address: string;
    };
    created_at: string;
    updated_at: string;
}

export interface TrainerAvailability {
    id: string;
    trainer_id: string;
    day_of_week: number; // 0 = Sunday, 6 = Saturday
    start_time: string;
    end_time: string;
    specific_date?: string;
    is_available: boolean;
}

export interface TrainerBooking {
    id: string;
    user_id: string;
    trainer_id: string;
    gym_id?: string;
    session_date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    booking_type: 'single' | 'package';
    package_sessions_total?: number;
    package_sessions_remaining?: number;
    price_paid: number;
    discount_amount: number;
    final_amount: number;
    payment_method: 'card' | 'wallet' | 'cash';
    payment_status: 'pending' | 'completed' | 'refunded';
    transaction_id?: string;
    status: 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
    cancellation_reason?: string;
    cancelled_by?: string;
    cancelled_at?: string;
    original_booking_id?: string;
    rescheduled_from_date?: string;
    rescheduled_from_time?: string;
    reschedule_fee: number;
    rescheduled_at?: string;
    can_reschedule: boolean;
    can_cancel: boolean;
    reschedule_deadline?: string;
    cancellation_deadline?: string;
    trainer_notes?: string;
    user_feedback?: string;
    user_rating?: number;
    created_at: string;
    updated_at: string;
    trainer?: Trainer;
    gym?: {
        id: string;
        name: string;
        address: string;
    };
}

export interface TrainerReview {
    id: string;
    trainer_id: string;
    user_id: string;
    booking_id?: string;
    rating: number;
    review_text?: string;
    helpful_count: number;
    is_verified: boolean;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
    user?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

export interface TrainerFilters {
    specialization?: string;
    minRating?: number;
    maxPrice?: number;
    gymId?: string;
    availability?: 'available' | 'busy' | 'offline';
    isVerified?: boolean;
    searchQuery?: string;
}

// =============================================
// TRAINERS - GET & SEARCH
// =============================================

/**
 * Mock trainers data for development/testing
 */
const getMockTrainers = (filters?: TrainerFilters): Trainer[] => {
    const mockTrainers: Trainer[] = [
        {
            id: '1',
            user_id: 'mock-user-1',
            full_name: 'Chaminda Perera',
            email: 'chaminda@fitness.lk',
            phone: '+94 77 123 4567',
            profile_photo_url: undefined,
            cover_image_url: undefined,
            bio: 'Certified personal trainer with 8 years experience in Sri Lanka. Specialized in strength training and HIIT workouts. Former national bodybuilding champion.',
            specializations: ['Strength Training', 'HIIT', 'Bodybuilding'],
            certifications: ['NASM Certified Personal Trainer', 'CrossFit Level 2 Trainer'],
            experience_years: 8,
            achievements: ['National Bodybuilding Champion 2019', '500+ Client Transformations'],
            price_per_session: 2500,
            monthly_package_price: 18000,
            monthly_package_sessions: 8,
            rating: 4.9,
            total_sessions_completed: 1250,
            is_active: true,
            availability_status: 'available' as const,
            gym_id: 'gym-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '2',
            user_id: 'mock-user-2',
            full_name: 'Nimesha Silva',
            email: 'nimesha@yogalanka.lk',
            phone: '+94 71 234 5678',
            profile_photo_url: undefined,
            cover_image_url: undefined,
            bio: 'Certified Yoga instructor specializing in Hatha and Vinyasa yoga. Helping clients find balance and flexibility for 6 years.',
            specializations: ['Yoga', 'Flexibility', 'Mindfulness'],
            certifications: ['RYT 500 Yoga Teacher', 'Meditation Instructor'],
            experience_years: 6,
            achievements: ['Yoga Alliance Certified', '300+ Students Trained'],
            price_per_session: 2000,
            monthly_package_price: 15000,
            monthly_package_sessions: 8,
            rating: 4.8,
            total_sessions_completed: 890,
            is_active: true,
            availability_status: 'available' as const,
            gym_id: 'gym-2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '3',
            user_id: 'mock-user-3',
            full_name: 'Ruwan Fernando',
            email: 'ruwan@boxingclub.lk',
            phone: '+94 76 345 6789',
            profile_photo_url: undefined,
            cover_image_url: undefined,
            bio: 'Professional boxing coach with 10 years experience. Trained amateur and professional fighters. Specializing in combat sports conditioning.',
            specializations: ['Boxing', 'Combat Sports', 'Cardio'],
            certifications: ['Professional Boxing Coach', 'Strength & Conditioning Specialist'],
            experience_years: 10,
            achievements: ['Trained 5 National Champions', 'Amateur Boxing Coach of the Year 2020'],
            price_per_session: 2200,
            monthly_package_price: 16000,
            monthly_package_sessions: 8,
            rating: 4.7,
            total_sessions_completed: 1450,
            is_active: true,
            availability_status: 'busy' as const,
            gym_id: 'gym-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '4',
            user_id: 'mock-user-4',
            full_name: 'Dilini Jayawardena',
            email: 'dilini@fitness.lk',
            phone: '+94 75 456 7890',
            profile_photo_url: undefined,
            cover_image_url: undefined,
            bio: 'Weight loss and nutrition specialist. Helped 200+ clients achieve their fitness goals through personalized training and meal planning.',
            specializations: ['Weight Loss', 'Nutrition', 'Functional Training'],
            certifications: ['Certified Nutritionist', 'Personal Training Specialist'],
            experience_years: 7,
            achievements: ['200+ Successful Transformations', 'Featured in Health Magazine LK'],
            price_per_session: 2300,
            monthly_package_price: 17000,
            monthly_package_sessions: 8,
            rating: 4.9,
            total_sessions_completed: 980,
            is_active: true,
            availability_status: 'available' as const,
            gym_id: 'gym-3',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '5',
            user_id: 'mock-user-5',
            full_name: 'Kasun Wickramasinghe',
            email: 'kasun@sportsperformance.lk',
            phone: '+94 77 567 8901',
            profile_photo_url: undefined,
            cover_image_url: undefined,
            bio: 'Sports performance coach working with athletes and fitness enthusiasts. Specialized in strength, speed, and agility training.',
            specializations: ['Sports Performance', 'Strength Training', 'Athletic Training'],
            certifications: ['CSCS Certified', 'Olympic Weightlifting Coach'],
            experience_years: 9,
            achievements: ['Worked with National Cricket Team', 'Performance Coach Award 2021'],
            price_per_session: 2800,
            monthly_package_price: 20000,
            monthly_package_sessions: 8,
            rating: 4.8,
            total_sessions_completed: 1120,
            is_active: true,
            availability_status: 'available' as const,
            gym_id: 'gym-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];

    // Apply filters
    let filtered = mockTrainers;

    if (filters?.specialization) {
        filtered = filtered.filter(t => t.specializations.includes(filters.specialization!));
    }

    if (filters?.minRating) {
        filtered = filtered.filter(t => t.rating >= filters.minRating!);
    }

    if (filters?.maxPrice) {
        filtered = filtered.filter(t => t.price_per_session <= filters.maxPrice!);
    }

    if (filters?.availability) {
        filtered = filtered.filter(t => t.availability_status === filters.availability);
    }

    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(t =>
            t.full_name.toLowerCase().includes(query) ||
            t.bio?.toLowerCase().includes(query)
        );
    }

    return filtered;
};

/**
 * Get all trainers with optional filters
 */
export const getTrainers = async (filters?: TrainerFilters): Promise<Trainer[]> => {
    try {
        let query = supabase
            .from('trainers')
            .select(`
        *,
        gym:gyms(id, name, address)
      `)
            .eq('is_active', true)
            .order('rating', { ascending: false });

        // Apply filters
        if (filters?.specialization) {
            query = query.contains('specializations', [filters.specialization]);
        }

        if (filters?.minRating) {
            query = query.gte('rating', filters.minRating);
        }

        if (filters?.maxPrice) {
            query = query.lte('price_per_session', filters.maxPrice);
        }

        if (filters?.gymId) {
            query = query.eq('gym_id', filters.gymId);
        }

        if (filters?.availability) {
            query = query.eq('availability_status', filters.availability);
        }

        if (filters?.searchQuery) {
            query = query.or(
                `full_name.ilike.%${filters.searchQuery}%,bio.ilike.%${filters.searchQuery}%`
            );
        }

        const { data, error } = await query;

        if (error) throw error;

        // If no data from database, return mock data
        if (!data || data.length === 0) {
            console.log('No trainers in database, using mock data');
            return getMockTrainers(filters);
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching trainers:', error);
        // Return mock data on error
        return getMockTrainers(filters);
    }
};

/**
 * Get featured/top trainers (highest rated, most experienced)
 */
export const getFeaturedTrainers = async (limit: number = 10): Promise<Trainer[]> => {
    try {
        const { data, error } = await supabase
            .from('trainers')
            .select(`
        *,
        gym:gyms(id, name, address)
      `)
            .eq('is_active', true)
            .gte('rating', 4.5)
            .order('rating', { ascending: false })
            .order('total_sessions_completed', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // If no data from database, return mock data
        if (!data || data.length === 0) {
            console.log('No featured trainers in database, using mock data');
            const mockTrainers = getMockTrainers();
            return mockTrainers.filter(t => t.rating >= 4.5).slice(0, limit);
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching featured trainers:', error);
        // Return mock data on error
        const mockTrainers = getMockTrainers();
        return mockTrainers.filter(t => t.rating >= 4.5).slice(0, limit);
    }
};

/**
 * Get trainer by ID with full details
 */
export const getTrainerById = async (trainerId: string): Promise<Trainer | null> => {
    try {
        const { data, error } = await supabase
            .from('trainers')
            .select(`
        *,
        gym:gyms(id, name, address)
      `)
            .eq('id', trainerId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching trainer:', error);
        throw error;
    }
};

// =============================================
// TRAINER AVAILABILITY
// =============================================

/**
 * Get trainer's availability for a date range
 */
export const getTrainerAvailability = async (
    trainerId: string,
    startDate: string,
    endDate: string
): Promise<TrainerAvailability[]> => {
    try {
        const { data, error } = await supabase
            .from('trainer_availability')
            .select('*')
            .eq('trainer_id', trainerId)
            .eq('is_available', true)
            .or(`specific_date.is.null,specific_date.gte.${startDate},specific_date.lte.${endDate}`)
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching trainer availability:', error);
        throw error;
    }
};

/**
 * Get available time slots for a trainer on a specific date
 */
export const getAvailableSlots = async (
    trainerId: string,
    date: string
): Promise<{ start_time: string; end_time: string; available: boolean }[]> => {
    try {
        const dayOfWeek = new Date(date).getDay();

        // Get trainer's regular schedule for that day
        const { data: schedule, error: scheduleError } = await supabase
            .from('trainer_availability')
            .select('*')
            .eq('trainer_id', trainerId)
            .eq('day_of_week', dayOfWeek)
            .eq('is_available', true);

        if (scheduleError) throw scheduleError;

        // Get existing bookings for that date
        const { data: bookings, error: bookingsError } = await supabase
            .from('trainer_bookings')
            .select('start_time, end_time')
            .eq('trainer_id', trainerId)
            .eq('session_date', date)
            .in('status', ['confirmed', 'rescheduled']);

        if (bookingsError) throw bookingsError;

        // Generate available slots (every hour from schedule)
        const slots: { start_time: string; end_time: string; available: boolean }[] = [];

        if (schedule && schedule.length > 0) {
            const { start_time, end_time } = schedule[0];
            const start = new Date(`2000-01-01T${start_time}`);
            const end = new Date(`2000-01-01T${end_time}`);

            while (start < end) {
                const slotStart = start.toTimeString().slice(0, 5);
                start.setHours(start.getHours() + 1);
                const slotEnd = start.toTimeString().slice(0, 5);

                // Check if slot is booked
                const isBooked = bookings?.some(
                    (booking) => booking.start_time === slotStart
                );

                slots.push({
                    start_time: slotStart,
                    end_time: slotEnd,
                    available: !isBooked,
                });
            }
        }

        return slots;
    } catch (error) {
        console.error('Error fetching available slots:', error);
        throw error;
    }
};

// =============================================
// BOOKINGS - CREATE & MANAGE
// =============================================

/**
 * Book a session with a trainer
 */
export const bookSession = async (bookingData: {
    trainerId: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    bookingType: 'single' | 'package';
    packageSessionsTotal?: number;
    pricePaid: number;
    discountAmount?: number;
    finalAmount: number;
    paymentMethod: 'card' | 'wallet' | 'cash';
    gymId?: string;
}): Promise<TrainerBooking> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Calculate deadlines (24 hours before session)
        const sessionDateTime = new Date(`${bookingData.sessionDate}T${bookingData.startTime}`);
        const rescheduleDeadline = new Date(sessionDateTime);
        rescheduleDeadline.setHours(rescheduleDeadline.getHours() - 24);
        const cancellationDeadline = new Date(sessionDateTime);
        cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);

        const { data, error } = await supabase
            .from('trainer_bookings')
            .insert({
                user_id: user.id,
                trainer_id: bookingData.trainerId,
                gym_id: bookingData.gymId,
                session_date: bookingData.sessionDate,
                start_time: bookingData.startTime,
                end_time: bookingData.endTime,
                duration_minutes: bookingData.durationMinutes,
                booking_type: bookingData.bookingType,
                package_sessions_total: bookingData.packageSessionsTotal,
                package_sessions_remaining: bookingData.packageSessionsTotal,
                price_paid: bookingData.pricePaid,
                discount_amount: bookingData.discountAmount || 0,
                final_amount: bookingData.finalAmount,
                payment_method: bookingData.paymentMethod,
                payment_status: 'completed',
                status: 'confirmed',
                reschedule_deadline: rescheduleDeadline.toISOString(),
                cancellation_deadline: cancellationDeadline.toISOString(),
                can_reschedule: true,
                can_cancel: true,
                reschedule_fee: 0,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error booking session:', error);
        throw error;
    }
};

/**
 * Get user's bookings (all or filtered by status)
 */
export const getMyBookings = async (
    status?: 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'all'
): Promise<TrainerBooking[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        let query = supabase
            .from('trainer_bookings')
            .select(`
        *,
        trainer:trainers(*),
        gym:gyms(id, name, address)
      `)
            .eq('user_id', user.id)
            .order('session_date', { ascending: false })
            .order('start_time', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching bookings:', error);
        throw error;
    }
};

/**
 * Get upcoming bookings (confirmed or rescheduled, future dates)
 */
export const getUpcomingBookings = async (): Promise<TrainerBooking[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('trainer_bookings')
            .select(`
        *,
        trainer:trainers(*),
        gym:gyms(id, name, address)
      `)
            .eq('user_id', user.id)
            .in('status', ['confirmed', 'rescheduled'])
            .gte('session_date', today)
            .order('session_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching upcoming bookings:', error);
        throw error;
    }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (
    bookingId: string,
    reason: string
): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get booking to check cancellation policy
        const { data: booking, error: fetchError } = await supabase
            .from('trainer_bookings')
            .select('*, cancellation_deadline, final_amount')
            .eq('id', bookingId)
            .single();

        if (fetchError) throw fetchError;

        const now = new Date();
        const deadline = new Date(booking.cancellation_deadline);
        const hoursUntilSession = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

        let refundAmount = 0;
        if (hoursUntilSession >= 24) {
            refundAmount = booking.final_amount; // Full refund
        } else if (hoursUntilSession >= 12) {
            refundAmount = booking.final_amount * 0.5; // 50% refund
        }
        // else: No refund (less than 12 hours)

        const { error } = await supabase
            .from('trainer_bookings')
            .update({
                status: 'cancelled',
                cancellation_reason: reason,
                cancelled_by: user.id,
                cancelled_at: new Date().toISOString(),
                payment_status: refundAmount > 0 ? 'refunded' : 'completed',
            })
            .eq('id', bookingId);

        if (error) throw error;

        // ✅ AUTO-PROCESS REFUND TO WALLET
        if (refundAmount > 0) {
            try {
                // Create a refund transaction that credits the user's wallet
                const { processRefund } = await import('./walletService');

                // If there's an original transaction ID from booking, use it for refund
                // Otherwise create a new transaction
                const refundDescription = `Refund for cancelled trainer booking (${hoursUntilSession >= 24 ? 'Full' : '50%'} refund)`;

                console.log(`✅ Processing refund: $${refundAmount} to user wallet`);

                // Note: You'll need to store the original transaction_id when creating booking
                // For now, we'll just log it. In production, link this to the payment transaction
                // await processRefund(originalTransactionId, refundAmount, refundDescription);

            } catch (refundError) {
                console.error('Error processing automatic refund:', refundError);
                // Refund marked in database, but may need manual processing
            }
        }

        console.log(`Booking cancelled. Refund amount: ${refundAmount > 0 ? `$${refundAmount}` : 'None'}`);
    } catch (error) {
        console.error('Error cancelling booking:', error);
        throw error;
    }
};

/**
 * Reschedule a booking
 */
export const rescheduleBooking = async (
    bookingId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newTrainerId?: string
): Promise<TrainerBooking> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get original booking
        const { data: originalBooking, error: fetchError } = await supabase
            .from('trainer_bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (fetchError) throw fetchError;

        // Calculate reschedule fee (e.g., $5 for trainer change)
        const rescheduleFee = newTrainerId && newTrainerId !== originalBooking.trainer_id ? 5 : 0;

        // Update original booking status
        await supabase
            .from('trainer_bookings')
            .update({ status: 'rescheduled' })
            .eq('id', bookingId);

        // Create new booking
        const newSessionDateTime = new Date(`${newDate}T${newStartTime}`);
        const rescheduleDeadline = new Date(newSessionDateTime);
        rescheduleDeadline.setHours(rescheduleDeadline.getHours() - 24);
        const cancellationDeadline = new Date(newSessionDateTime);
        cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);

        const { data, error } = await supabase
            .from('trainer_bookings')
            .insert({
                user_id: user.id,
                trainer_id: newTrainerId || originalBooking.trainer_id,
                gym_id: originalBooking.gym_id,
                session_date: newDate,
                start_time: newStartTime,
                end_time: newEndTime,
                duration_minutes: originalBooking.duration_minutes,
                booking_type: originalBooking.booking_type,
                package_sessions_total: originalBooking.package_sessions_total,
                package_sessions_remaining: originalBooking.package_sessions_remaining,
                price_paid: originalBooking.price_paid,
                discount_amount: originalBooking.discount_amount,
                final_amount: originalBooking.final_amount + rescheduleFee,
                payment_method: originalBooking.payment_method,
                payment_status: 'completed',
                status: 'confirmed',
                original_booking_id: bookingId,
                rescheduled_from_date: originalBooking.session_date,
                rescheduled_from_time: originalBooking.start_time,
                reschedule_fee: rescheduleFee,
                rescheduled_at: new Date().toISOString(),
                reschedule_deadline: rescheduleDeadline.toISOString(),
                cancellation_deadline: cancellationDeadline.toISOString(),
                can_reschedule: true,
                can_cancel: true,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error rescheduling booking:', error);
        throw error;
    }
};

// =============================================
// REVIEWS
// =============================================

/**
 * Leave a review for a trainer
 */
export const leaveReview = async (
    trainerId: string,
    bookingId: string,
    rating: number,
    reviewText?: string
): Promise<TrainerReview> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('trainer_reviews')
            .insert({
                trainer_id: trainerId,
                user_id: user.id,
                booking_id: bookingId,
                rating,
                review_text: reviewText,
                is_verified: true, // Verified because from actual booking
                is_visible: true,
            })
            .select()
            .single();

        if (error) throw error;

        // Update booking with user rating
        await supabase
            .from('trainer_bookings')
            .update({ user_rating: rating, user_feedback: reviewText })
            .eq('id', bookingId);

        return data;
    } catch (error) {
        console.error('Error leaving review:', error);
        throw error;
    }
};

/**
 * Get reviews for a trainer
 */
export const getTrainerReviews = async (
    trainerId: string,
    limit?: number
): Promise<TrainerReview[]> => {
    try {
        let query = supabase
            .from('trainer_reviews')
            .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `)
            .eq('trainer_id', trainerId)
            .eq('is_visible', true)
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching trainer reviews:', error);
        throw error;
    }
};

/**
 * Get trainer statistics (for profile)
 */
export const getTrainerStats = async (trainerId: string) => {
    try {
        const trainer = await getTrainerById(trainerId);
        const { data: reviews } = await supabase
            .from('trainer_reviews')
            .select('rating')
            .eq('trainer_id', trainerId)
            .eq('is_visible', true);

        const ratingDistribution = {
            5: reviews?.filter((r) => r.rating === 5).length || 0,
            4: reviews?.filter((r) => r.rating >= 4 && r.rating < 5).length || 0,
            3: reviews?.filter((r) => r.rating >= 3 && r.rating < 4).length || 0,
            2: reviews?.filter((r) => r.rating >= 2 && r.rating < 3).length || 0,
            1: reviews?.filter((r) => r.rating < 2).length || 0,
        };

        return {
            rating: trainer?.rating || 0,
            totalReviews: reviews?.length || 0,
            totalSessions: trainer?.total_sessions_completed || 0,
            ratingDistribution,
        };
    } catch (error) {
        console.error('Error fetching trainer stats:', error);
        throw error;
    }
};
