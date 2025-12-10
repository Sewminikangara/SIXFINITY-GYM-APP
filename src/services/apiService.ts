import { env } from '../config/env';
import * as JWTAuth from './jwtAuthService';

const API_BASE_URL = env.apiBaseUrl;

/**
 * Make authenticated API call with automatic token refresh
 */
async function authenticatedFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    let accessToken = await JWTAuth.getAccessToken();

    if (!accessToken) {
        throw new Error('No access token available. Please login.');
    }

    // Try request with current token
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    // If unauthorized, try refreshing token
    if (response.status === 401) {
        try {
            accessToken = await JWTAuth.refreshAccessToken();

            // Retry request with new token
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
        } catch (refreshError) {
            await JWTAuth.clearAuthData();
            throw new Error('Session expired. Please login again.');
        }
    }

    return response;
}

// ============================================
// MEMBER / PROFILE APIs
// ============================================

export interface MemberProfile {
    id: number;
    memberId: string;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    phone: string;
    email: string;
    jobTitle?: string;
    startDate: string;
    subscriptionStatus: string;
    assignedTrainer?: string;
    gymId?: number;
}

export async function getMemberProfile(memberId: number): Promise<MemberProfile> {
    const response = await authenticatedFetch(`/api/members/${memberId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
    }

    return data.data;
}

export async function updateMemberProfile(
    memberId: number,
    updates: Partial<MemberProfile>
): Promise<MemberProfile> {
    const response = await authenticatedFetch(`/api/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
    }

    return data.data;
}

// ============================================
// GYM APIs
// ============================================

export interface Gym {
    id: number;
    gymId: string;
    gymName: string;
    ownerName: string;
    contactNumber: string;
    emailAddress: string;
    address: string;
    city: string;
    state?: string;
    zipCode?: string;
    country: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
    maxMembers: number;
    currentMembers: number;
    website?: string;
    logoUrl?: string;
    description?: string;
    isActive: boolean;
}

export async function getAllGyms(): Promise<Gym[]> {
    const response = await authenticatedFetch('/api/gyms');
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch gyms');
    }

    return data.data;
}

export async function getGymById(gymId: number): Promise<Gym> {
    const response = await authenticatedFetch(`/api/gyms/${gymId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch gym details');
    }

    return data.data;
}

export async function getActiveGyms(): Promise<Gym[]> {
    const response = await authenticatedFetch('/api/gyms/active');
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch active gyms');
    }

    return data.data;
}

// ============================================
// TRAINER APIs  
// ============================================

export interface Trainer {
    id: number;
    trainerId: string;
    firstName: string;
    lastName: string;
    specialization: string;
    experience: number;
    rating?: number;
    pricePerSession: number;
    availability: string;
    bio?: string;
    certifications?: string[];
    gymId?: number;
}

export async function getAllTrainers(): Promise<Trainer[]> {
    const response = await authenticatedFetch('/api/trainers');
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch trainers');
    }

    return data.data;
}

export async function getTrainerById(trainerId: number): Promise<Trainer> {
    const response = await authenticatedFetch(`/api/trainers/${trainerId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch trainer details');
    }

    return data.data;
}

export async function getTrainersByGym(gymId: number): Promise<Trainer[]> {
    const response = await authenticatedFetch(`/api/trainers/gym/${gymId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch gym trainers');
    }

    return data.data;
}

// ============================================
// BOOKING APIs
// ============================================

export interface Booking {
    id: number;
    bookingId: string;
    memberId: number;
    trainerId?: number;
    gymId: number;
    sessionType: 'gym' | 'trainer' | 'class';
    sessionDate: string;
    sessionTime: string;
    duration: number;
    status: 'upcoming' | 'completed' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    amount: number;
}

export async function getMyBookings(memberId: number): Promise<Booking[]> {
    const response = await authenticatedFetch(`/api/bookings/member/${memberId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch bookings');
    }

    return data.data;
}

export async function createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    const response = await authenticatedFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
    }

    return data.data;
}

export async function cancelBooking(bookingId: number): Promise<void> {
    const response = await authenticatedFetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel booking');
    }
}

// ============================================
// WALLET & PAYMENT APIs (Mock - implement based on your backend)
// ============================================

export interface Wallet {
    id: number;
    memberId: number;
    balance: number;
    rewardPoints: number;
    currency: string;
}

export interface Transaction {
    id: number;
    walletId: number;
    type: 'topup' | 'payment' | 'refund' | 'reward';
    amount: number;
    status: 'success' | 'pending' | 'failed';
    description: string;
    timestamp: string;
}

export async function getWalletBalance(memberId: number): Promise<Wallet> {
    // Implement when backend endpoint is ready
    const response = await authenticatedFetch(`/api/wallet/${memberId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch wallet');
    }

    return data.data;
}

export async function getTransactionHistory(memberId: number): Promise<Transaction[]> {
    // Implement when backend endpoint is ready
    const response = await authenticatedFetch(`/api/transactions/${memberId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions');
    }

    return data.data;
}

export async function addMoneyToWallet(
    memberId: number,
    amount: number,
    paymentMethod: string
): Promise<Transaction> {
    const response = await authenticatedFetch('/api/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ memberId, amount, paymentMethod }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to add money');
    }

    return data.data;
}

// ============================================
// EQUIPMENT APIs
// ============================================

export interface Equipment {
    id: number;
    equipmentId: string;
    equipmentName: string;
    category: string;
    gymId: number;
    quantity: number;
    status: 'available' | 'in_use' | 'maintenance';
}

export async function getGymEquipment(gymId: number): Promise<Equipment[]> {
    const response = await authenticatedFetch(`/api/equipment/gym/${gymId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch equipment');
    }

    return data.data;
}

// ============================================
// REFERRAL APIs (Mock - implement when ready)
// ============================================

export interface Referral {
    id: number;
    referrerId: number;
    refereeId?: number;
    referralCode: string;
    status: 'pending' | 'completed';
    rewardPoints: number;
}

export async function getMyReferrals(memberId: number): Promise<Referral[]> {
    // Implement when backend endpoint is ready
    const response = await authenticatedFetch(`/api/referrals/${memberId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch referrals');
    }

    return data.data;
}

export async function generateReferralCode(memberId: number): Promise<string> {
    const response = await authenticatedFetch('/api/referrals/generate', {
        method: 'POST',
        body: JSON.stringify({ memberId }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to generate referral code');
    }

    return data.data.referralCode;
}

export default {
    // Member APIs
    getMemberProfile,
    updateMemberProfile,

    // Gym APIs
    getAllGyms,
    getGymById,
    getActiveGyms,

    // Trainer APIs
    getAllTrainers,
    getTrainerById,
    getTrainersByGym,

    // Booking APIs
    getMyBookings,
    createBooking,
    cancelBooking,

    // Wallet APIs
    getWalletBalance,
    getTransactionHistory,
    addMoneyToWallet,

    // Equipment APIs
    getGymEquipment,

    // Referral APIs
    getMyReferrals,
    generateReferralCode,
};
