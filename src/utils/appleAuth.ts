import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '../config/supabaseClient';

/**
 * Check if Apple Authentication is available on the device
 */
export const isAppleAuthAvailable = async (): Promise<boolean> => {
    try {
        // Apple Sign-In is only available on iOS 13+
        if (Platform.OS !== 'ios') {
            return false;
        }

        const isAvailable = await AppleAuthentication.isAvailableAsync();
        return isAvailable;
    } catch (error) {
        console.error('Error checking Apple Auth availability:', error);
        return false;
    }
};

/**
 * Sign in with Apple using Supabase
 */
export const signInWithApple = async (): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        // Check if Apple Authentication is available
        const available = await isAppleAuthAvailable();
        if (!available) {
            return {
                success: false,
                error: 'Apple Sign-In is not available on this device',
            };
        }

        // Request Apple ID credential
        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
        });

        // Check if we got the necessary credentials
        if (!credential.identityToken) {
            return {
                success: false,
                error: 'No identity token received from Apple',
            };
        }

        // Sign in to Supabase with the Apple identity token
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken,
        });

        if (error) {
            console.error('Apple sign in error:', error);
            return {
                success: false,
                error: error.message || 'Failed to sign in with Apple',
            };
        }

        if (data?.session) {
            // Update user metadata with Apple user info if available
            if (credential.fullName?.givenName || credential.fullName?.familyName) {
                const fullName = [
                    credential.fullName?.givenName,
                    credential.fullName?.familyName,
                ]
                    .filter(Boolean)
                    .join(' ');

                if (fullName) {
                    await supabase.auth.updateUser({
                        data: { full_name: fullName },
                    });
                }
            }

            return { success: true };
        }

        return {
            success: false,
            error: 'No session created',
        };
    } catch (error: any) {
        console.error('Apple sign in error:', error);

        // Handle specific Apple Authentication errors
        if (error.code === 'ERR_CANCELED') {
            return {
                success: false,
                error: 'Sign in was cancelled',
            };
        }

        return {
            success: false,
            error: error?.message || 'An unexpected error occurred',
        };
    }
};
