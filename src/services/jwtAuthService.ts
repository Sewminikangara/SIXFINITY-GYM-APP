import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../config/env';

const API_BASE_URL = env.apiBaseUrl;

const TOKEN_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
};

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface User {
    id: string; // JWT backend member_id
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    role: 'member' | 'trainer' | 'gym_owner' | 'staff';
    onboardingCompleted?: boolean;
    supabaseUserId?: string; // Supabase UUID for database operations
}

export interface SignupRequest {
    email: string;
    password: string;
    fullName: string;
    role?: 'member';
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        tokens: AuthTokens;
    };
    message?: string;
}

/**
 * Store tokens securely
 */
export async function storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken);
}

/**
 * Store user data
 */
export async function storeUserData(user: User): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(user));
}

/**
 * Get stored access token
 */
export async function getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
}

/**
 * Get stored refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
}

/**
 * Get stored user data
 */
export async function getUserData(): Promise<User | null> {
    const data = await AsyncStorage.getItem(TOKEN_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
}

/**
 * Clear all stored auth data
 */
export async function clearAuthData(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(TOKEN_KEYS.USER_DATA);
}

/**
 * Sign up a new user
 */
export async function signup(request: SignupRequest): Promise<AuthResponse> {
    try {
        console.log('[JWT] Signup request to:', `${API_BASE_URL}/api/auth/signup`);
        console.log('[JWT] Request payload:', { email: request.email, role: request.role });

        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...request,
                role: request.role || 'member',
            }),
        });

        console.log('[JWT] Response status:', response.status);
        console.log('[JWT] Response content-type:', response.headers.get('content-type'));

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response from server:', text.substring(0, 200));
            throw new Error('Server error. Please try again later.');
        }

        const data: AuthResponse = await response.json();

        if (!response.ok) {
            console.error('[JWT] Signup failed:', data.message);
            throw new Error(data.message || 'Signup failed');
        }

        console.log('[JWT] Signup successful, user ID:', data.data.user.id);

        // Store tokens and user data
        await storeTokens(data.data.tokens);
        await storeUserData(data.data.user);

        return data;
    } catch (error: any) {
        console.error('Signup error:', error);
        // Provide user-friendly error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
            throw new Error('Network error. Please check your internet connection.');
        }
        throw error;
    }
}

/**
 * Login user
 */
export async function login(request: LoginRequest): Promise<AuthResponse> {
    try {
        console.log('[JWT Auth] 📡 Sending login request to:', `${API_BASE_URL}/api/auth/login`);
        console.log('[JWT Auth] 📧 Email:', request.email);

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        console.log('[JWT Auth] 📨 Response status:', response.status, response.statusText);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('[JWT Auth] ❌ Non-JSON response from server:', text.substring(0, 200));
            throw new Error('Server error. Please try again later.');
        }

        const data: AuthResponse = await response.json();

        if (!response.ok) {
            console.error('[JWT Auth] ❌ Login failed:', data.message || 'Unknown error');
            throw new Error(data.message || 'Invalid email or password');
        }

        console.log('[JWT Auth] ✅ Login successful!');
        console.log('[JWT Auth] 👤 User ID:', data.data.user.id);
        console.log('[JWT Auth] 📧 User email:', data.data.user.email);

        // Store tokens and user data
        await storeTokens(data.data.tokens);
        await storeUserData(data.data.user);

        return data;
    } catch (error: any) {
        console.error('[JWT Auth] ❌ Login error:', error.message);

        // Provide user-friendly error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
            console.error('[JWT Auth] 🌐 Network error - cannot reach server');
            throw new Error('Network error. Please check your internet connection and make sure the backend server is running.');
        }

        throw error;
    }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<string> {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
    }

    const newAccessToken = data.data.accessToken;
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, newAccessToken);

    return newAccessToken;
}

/**
 * Verify if access token is valid
 */
export async function verifyToken(): Promise<boolean> {
    const accessToken = await getAccessToken();

    if (!accessToken) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        return response.ok && data.success;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

/**
 * Make authenticated API request with automatic token refresh
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    let accessToken = await getAccessToken();

    if (!accessToken) {
        throw new Error('No access token available');
    }

    // Try request with current token
    let response = await fetch(`${API_BASE_URL}${url}`, {
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
            accessToken = await refreshAccessToken();

            // Retry request with new token
            response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
        } catch (refreshError) {
            // Refresh failed, user needs to login again
            await clearAuthData();
            throw new Error('Session expired. Please login again.');
        }
    }

    return response;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
    await clearAuthData();
}
