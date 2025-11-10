import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_user_email';

/**
 * Check if the device supports biometric authentication
 */
export const checkBiometricSupport = async (): Promise<{
    isSupported: boolean;
    biometricType: string | null;
}> => {
    try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
            return { isSupported: false, biometricType: null };
        }

        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) {
            return { isSupported: false, biometricType: 'not_enrolled' };
        }

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        let biometricType = 'biometric';

        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            biometricType = 'Face ID';
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            biometricType = 'Touch ID';
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            biometricType = 'Iris';
        }

        return { isSupported: true, biometricType };
    } catch (error) {
        console.error('Error checking biometric support:', error);
        return { isSupported: false, biometricType: null };
    }
};

/**
 * Authenticate user with biometric authentication
 */
export const authenticateWithBiometrics = async (): Promise<{
    success: boolean;
    email?: string;
    error?: string;
}> => {
    try {
        const { isSupported, biometricType } = await checkBiometricSupport();

        if (!isSupported) {
            return {
                success: false,
                error: biometricType === 'not_enrolled'
                    ? 'No biometric authentication is enrolled on this device'
                    : 'Biometric authentication is not supported on this device',
            };
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to sign in',
            fallbackLabel: 'Use passcode',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (result.success) {
            // Get stored user email
            const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
            if (!email) {
                return {
                    success: false,
                    error: 'No saved credentials found. Please sign in with your email first.',
                };
            }

            return { success: true, email };
        } else {
            return {
                success: false,
                error: 'Authentication failed',
            };
        }
    } catch (error) {
        console.error('Biometric authentication error:', error);
        return {
            success: false,
            error: 'An error occurred during authentication',
        };
    }
};

/**
 * Save biometric authentication preference and user email
 */
export const saveBiometricPreference = async (
    enabled: boolean,
    email?: string
): Promise<void> => {
    try {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled.toString());
        if (enabled && email) {
            await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
        } else if (!enabled) {
            await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
        }
    } catch (error) {
        console.error('Error saving biometric preference:', error);
    }
};

/**
 * Check if biometric authentication is enabled
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
    try {
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        return enabled === 'true';
    } catch (error) {
        console.error('Error checking biometric preference:', error);
        return false;
    }
};

/**
 * Get the saved email for biometric authentication
 */
export const getSavedBiometricEmail = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    } catch (error) {
        console.error('Error getting saved email:', error);
        return null;
    }
};

/**
 * Clear biometric authentication data
 */
export const clearBiometricData = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
    } catch (error) {
        console.error('Error clearing biometric data:', error);
    }
};
