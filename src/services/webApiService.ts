/**
 * Web System API Integration Service
 * Connects mobile app with the web system at https://ai-gym-project.onrender.com
 */

const WEB_API_BASE_URL = 'https://ai-gym-project.onrender.com';

export interface SignupRequest {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
    role: 'member' | 'gym_owner' | 'trainer' | 'staff';
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
        user: {
            id: string;
            email: string;
            role: string;
            firstName?: string;
            lastName?: string;
            fullName?: string;
        };
    };
    message?: string;
}

export interface ApiError {
    success: false;
    error: string;
    message: string;
}

/**
 * Register a new user with the web system
 */
export async function signup(data: SignupRequest): Promise<AuthResponse> {
    try {

        const response = await fetch(`${WEB_API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Signup failed');
        }

        return result;
    } catch (error: any) {
        console.error('❌ Signup error:', error);
        throw {
            success: false,
            error: error.message || 'Network error',
            message: error.message || 'Failed to connect to server',
        };
    }
}

/**
 * Login user with the web system
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
    try {

        const response = await fetch(`${WEB_API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Login failed');
        }

        return result;
    } catch (error: any) {
        console.error('❌ Login error:', error);
        throw {
            success: false,
            error: error.message || 'Network error',
            message: error.message || 'Failed to connect to server',
        };
    }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    try {
        const response = await fetch(`${WEB_API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Token refresh failed');
        }

        return result;
    } catch (error: any) {
        console.error('❌ Token refresh error:', error);
        throw {
            success: false,
            error: error.message || 'Network error',
            message: error.message || 'Failed to refresh token',
        };
    }
}

/**
 * Make authenticated API request
 */
export async function authenticatedRequest(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
): Promise<any> {
    try {
        const response = await fetch(`${WEB_API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                ...options.headers,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Request failed');
        }

        return result;
    } catch (error: any) {
        console.error('❌ Authenticated request error:', error);
        throw {
            success: false,
            error: error.message || 'Network error',
            message: error.message || 'Request failed',
        };
    }
}

/**
 * Logout (client-side only - clear tokens)
 */
export function logout(): void {
    // Tokens will be cleared in AuthContext
}

export default {
    signup,
    login,
    refreshAccessToken,
    authenticatedRequest,
    logout,
};
