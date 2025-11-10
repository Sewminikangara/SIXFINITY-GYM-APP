import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../config/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google using Supabase OAuth
 */
export const signInWithGoogle = async (): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        const redirectUrl = makeRedirectUri({
            scheme: 'gymapp',
            path: 'auth/callback',
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: false,
            },
        });

        if (error) {
            console.error('Google sign in error:', error);
            return {
                success: false,
                error: error.message || 'Failed to sign in with Google',
            };
        }

        if (data?.url) {
            // Open the OAuth URL in the browser
            const result = await WebBrowser.openAuthSessionAsync(
                data.url,
                redirectUrl
            );

            if (result.type === 'success') {
                return { success: true };
            } else if (result.type === 'cancel') {
                return {
                    success: false,
                    error: 'Sign in was cancelled',
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to complete sign in',
                };
            }
        }

        return {
            success: false,
            error: 'No authentication URL received',
        };
    } catch (error: any) {
        console.error('Google sign in error:', error);
        return {
            success: false,
            error: error?.message || 'An unexpected error occurred',
        };
    }
};

/**
 * Handle the OAuth callback from Google
 * This is called automatically by Supabase when the user completes OAuth
 */
export const handleGoogleCallback = async (url: string): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        // Supabase automatically handles the callback
        // Just check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Callback error:', error);
            return {
                success: false,
                error: error.message || 'Failed to complete authentication',
            };
        }

        if (session) {
            return { success: true };
        }

        return {
            success: false,
            error: 'No session found',
        };
    } catch (error: any) {
        console.error('Callback handling error:', error);
        return {
            success: false,
            error: error?.message || 'An unexpected error occurred',
        };
    }
};
