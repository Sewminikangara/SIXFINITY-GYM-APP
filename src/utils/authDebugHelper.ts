// 🔧 AUTH DEBUG HELPER
// Add this to a debug screen or console to test auth issues

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/config/supabaseClient';
import { env } from '@/config/env';

/**
 * Test 1: Check Environment Variables
 */
export async function testEnv() {
    console.log('=== 🌍 ENVIRONMENT CHECK ===');
    console.log('API Base URL:', env.apiBaseUrl);
    console.log('Supabase URL:', env.supabaseUrl);
    console.log('Supabase Key:', env.supabaseAnonKey ? '✅ Set' : '❌ Missing');
    console.log('');
}

/**
 * Test 2: Check Stored Auth Data
 */
export async function testStoredAuth() {
    console.log('=== 💾 STORED AUTH DATA ===');

    const accessToken = await SecureStore.getItemAsync('access_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    const userData = await AsyncStorage.getItem('user_data');
    const onboarding = await AsyncStorage.getItem('onboarding_complete');

    console.log('Access Token:', accessToken ? '✅ Exists' : '❌ Missing');
    console.log('Refresh Token:', refreshToken ? '✅ Exists' : '❌ Missing');
    console.log('User Data:', userData ? '✅ Exists' : '❌ Missing');
    console.log('Onboarding:', onboarding);

    if (userData) {
        console.log('User:', JSON.parse(userData));
    }
    console.log('');
}

/**
 * Test 3: Test Backend Connection
 */
export async function testBackendConnection() {
    console.log('=== 📡 BACKEND CONNECTION TEST ===');
    console.log('Testing:', `${env.apiBaseUrl}/api/health`);

    try {
        const response = await fetch(`${env.apiBaseUrl}/api/health`, {
            method: 'GET',
        });

        console.log('Status:', response.status, response.statusText);

        if (response.ok) {
            const data = await response.json();
            console.log('Response:', data);
            console.log('✅ Backend is reachable!');
        } else {
            console.log('❌ Backend returned error');
        }
    } catch (error: any) {
        console.log('❌ Cannot reach backend:', error.message);
        console.log('Possible issues:');
        console.log('  - Backend server not running');
        console.log('  - Wrong URL in .env file');
        console.log('  - Firewall blocking connection');
        console.log('  - Using localhost on physical device');
    }
    console.log('');
}

/**
 * Test 4: Test Login with Credentials
 */
export async function testLogin(email: string, password: string) {
    console.log('=== 🔐 LOGIN TEST ===');
    console.log('Email:', email);
    console.log('Password:', password.replace(/./g, '*'));
    console.log('URL:', `${env.apiBaseUrl}/api/auth/login`);

    try {
        const response = await fetch(`${env.apiBaseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        console.log('Status:', response.status, response.statusText);

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login successful!');
            console.log('User ID:', data.data.user.id);
            console.log('User Email:', data.data.user.email);
            console.log('Has Access Token:', !!data.data.tokens.accessToken);
        } else {
            console.log('❌ Login failed:', data.message);
        }
    } catch (error: any) {
        console.log('❌ Login error:', error.message);
    }
    console.log('');
}

/**
 * Test 5: Check Supabase Profile
 */
export async function testSupabaseProfile(email: string) {
    console.log('=== 👤 SUPABASE PROFILE CHECK ===');
    console.log('Email:', email);

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (error) {
            console.log('❌ Query error:', error.message);
            return;
        }

        if (data && data.length > 0) {
            console.log('✅ Profile found!');
            console.log('ID:', data[0].id);
            console.log('Email:', data[0].email);
            console.log('Full Name:', data[0].full_name);
            console.log('Onboarding Completed:', data[0].onboarding_completed);
            console.log('Age:', data[0].age);
            console.log('Primary Goal:', data[0].primary_goal);
            console.log('Activity Level:', data[0].activity_level);
            console.log('');
            console.log('Profile Status:');
            if (data[0].onboarding_completed === true) {
                console.log('  ✅ Onboarding flag is TRUE');
            } else {
                console.log('  ❌ Onboarding flag is FALSE');
            }

            const hasCriticalFields = !!(
                data[0].full_name &&
                data[0].age &&
                data[0].primary_goal &&
                data[0].activity_level
            );

            if (hasCriticalFields) {
                console.log('  ✅ Has all critical fields');
            } else {
                console.log('  ❌ Missing critical fields');
            }
        } else {
            console.log('❌ No profile found for this email');
            console.log('User needs to sign up or complete onboarding');
        }
    } catch (error: any) {
        console.log('❌ Error:', error.message);
    }
    console.log('');
}

/**
 * Test 6: Clear All Auth Data
 */
export async function clearAllAuthData() {
    console.log('=== 🧹 CLEARING ALL AUTH DATA ===');

    try {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await AsyncStorage.removeItem('user_data');
        await AsyncStorage.removeItem('onboarding_complete');
        await AsyncStorage.removeItem('biometric_enabled');
        await AsyncStorage.removeItem('session');

        console.log('✅ All auth data cleared!');
        console.log('You can now sign up or login fresh');
    } catch (error: any) {
        console.log('❌ Error clearing data:', error.message);
    }
    console.log('');
}

/**
 * Run All Tests
 */
export async function runAllAuthTests(email?: string, password?: string) {
    console.log('');
    console.log('🔧========================================🔧');
    console.log('    AUTH SYSTEM DIAGNOSTIC REPORT');
    console.log('🔧========================================🔧');
    console.log('');

    await testEnv();
    await testStoredAuth();
    await testBackendConnection();

    if (email && password) {
        await testLogin(email, password);
    }

    if (email) {
        await testSupabaseProfile(email);
    }

    console.log('🔧========================================🔧');
    console.log('    END OF DIAGNOSTIC REPORT');
    console.log('🔧========================================🔧');
    console.log('');
}

/**
 * HOW TO USE:
 * 
 * 1. Import this file in your SignInScreen or create a debug screen
 * 
 * 2. Add test buttons:
 * 
 * <Button onPress={() => runAllAuthTests('test4@gmail.com', 'your_password')}>
 *   🔧 Run Auth Tests
 * </Button>
 * 
 * <Button onPress={() => clearAllAuthData()}>
 *   🧹 Clear All Data
 * </Button>
 * 
 * 3. Check the console logs for detailed diagnostics
 * 
 * 4. The tests will tell you exactly what's wrong:
 *    - Backend not reachable
 *    - Profile missing
 *    - Onboarding incomplete
 *    - Credentials wrong
 *    etc.
 */
