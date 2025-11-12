/**
 * Profile Service
 * Handles all user profile, body stats, fitness goals, achievements, and device operations
 */

import { supabase } from '@/config/supabaseClient';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UserProfile {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
    date_of_birth: string | null;
    phone: string | null;
    height_cm: number | null;
    membership_status: 'free' | 'premium' | 'pro';
    profile_completion_percentage: number;
    referral_code?: string;
    referred_by?: string;
    is_verified?: boolean;
    subscription_status?: 'none' | 'active' | 'expired' | 'canceled' | 'trial';
    created_at: string;
    updated_at: string;
}

export interface FitnessGoal {
    goal_id: string;
    user_id: string;
    goal_type: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'flexibility' | 'general_fitness' | 'custom';
    goal_value: number | null;
    goal_unit: string | null;
    goal_description: string | null;
    target_date: string | null;
    start_value: number | null;
    current_value: number | null;
    progress_percentage: number;
    is_active: boolean;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

export interface BodyStats {
    stat_id: string;
    user_id: string;
    recorded_date: string;

    // Weight and Composition
    weight_kg: number | null;
    bmi: number | null;
    body_fat_percentage: number | null;
    muscle_mass_kg: number | null;
    body_water_percentage: number | null;
    bone_mass_kg: number | null;

    // Measurements (in cm)
    chest_cm: number | null;
    waist_cm: number | null;
    hips_cm: number | null;
    arms_cm: number | null;
    legs_cm: number | null;
    neck_cm: number | null;

    // Daily Health Metrics
    heart_rate_bpm: number | null;
    resting_heart_rate_bpm: number | null;
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    hydration_level_ml: number | null;
    calories_burned_today: number;
    steps_count: number;
    active_minutes: number;
    sleep_hours: number | null;
    stress_level: number | null;

    // Data Source
    source: 'manual' | 'wearable' | 'ai_estimation';
    device_id: string | null;

    created_at: string;
    updated_at: string;
}

export interface AIFitnessSummary {
    summary_id: string;
    user_id: string;
    summary_text: string;
    goal_progress_percentage: number | null;
    predicted_goal_completion_date: string | null;
    ai_recommendation: string | null;
    weekly_progress_summary: string | null;
    monthly_progress_summary: string | null;
    strengths: any;
    improvement_areas: any;
    generated_at: string;
    is_current: boolean;
    version: number;
}

export interface Achievement {
    achievement_id: string;
    user_id: string;
    badge_name: string;
    badge_icon: string | null;
    badge_category: 'workouts' | 'streaks' | 'goals' | 'milestones' | 'social' | 'special';
    description: string | null;
    criteria_type: string | null;
    criteria_value: number | null;
    current_progress: number;
    target_progress: number;
    progress_percentage: number;
    is_earned: boolean;
    earned_date: string | null;
    display_order: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    points_value: number;
    created_at: string;
    updated_at: string;
}

export interface WearableDevice {
    device_id: string;
    user_id: string;
    device_name: string;
    device_type: 'apple_watch' | 'fitbit' | 'samsung_gear' | 'mi_band' | 'garmin' | 'other';
    device_model: string | null;
    device_serial_number: string | null;
    sync_status: 'connected' | 'disconnected' | 'syncing' | 'error';
    last_sync_time: string | null;
    sync_frequency_minutes: number;
    heart_rate_enabled: boolean;
    steps_enabled: boolean;
    sleep_enabled: boolean;
    calories_enabled: boolean;
    blood_pressure_enabled: boolean;
    blood_oxygen_enabled: boolean;
    battery_level: number | null;
    connection_type: 'bluetooth' | 'wifi' | 'cloud' | null;
    connected_at: string;
    disconnected_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface HealthRisk {
    risk_id: string;
    user_id: string;
    risk_type: 'cardiovascular' | 'diabetes' | 'obesity' | 'hypertension' | 'injury' | 'overtraining' | 'general';
    risk_score: number;
    risk_level: 'low' | 'moderate' | 'high' | 'critical';
    ai_recommendation: string | null;
    contributing_factors: any;
    recommended_actions: any;
    assessed_at: string;
    assessment_method: 'ai_analysis' | 'manual_input' | 'doctor_consultation';
    is_current: boolean;
    next_assessment_date: string | null;
    reviewed_by_professional: boolean;
    created_at: string;
}

export interface UserPreferences {
    preference_id: string;
    user_id: string;
    region_code: string | null;
    timezone: string;
    currency: string;
    language: string;
    unit_weight: 'kg' | 'lbs';
    unit_height: 'cm' | 'ft_in';
    unit_distance: 'km' | 'miles';
    unit_calories: 'kcal' | 'cal';
    unit_water: 'ml' | 'oz';
    auto_conversion_enabled: boolean;
    theme: 'light' | 'dark' | 'system';
    auto_sync_enabled: boolean;
    download_quality: 'low' | 'medium' | 'high';
    allow_push: boolean;
    allow_email: boolean;
    allow_sms: boolean;
    notifications_preview: boolean;
    share_activity: boolean;
    profile_visibility: 'public' | 'friends' | 'private';
    ai_tips_enabled: boolean;
    ai_voice_language: string;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// PROFILE OPERATIONS
// ============================================================================

/**
 * Get user profile by user ID
 */
export const getUserProfile = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching user profile:', error);
        return { data: null, error: error };
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (userId: string, updates: Partial<UserProfile>) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return { data: null, error: error };
    }
};

/**
 * Create user profile (typically called on first login)
 */
export const createProfile = async (userId: string, profileData: Partial<UserProfile>) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert({
                user_id: userId,
                ...profileData,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating profile:', error);
        return { data: null, error: error };
    }
};

/**
 * Calculate and update profile completion percentage
 */
export const updateProfileCompletion = async (userId: string) => {
    try {
        // Call the PostgreSQL function to calculate completion
        const { data, error } = await supabase.rpc('calculate_profile_completion', {
            p_user_id: userId,
        });

        if (error) throw error;

        // Update the profile with new completion percentage
        await supabase
            .from('user_profiles')
            .update({ profile_completion_percentage: data })
            .eq('user_id', userId);

        return { data: data, error: null };
    } catch (error: any) {
        console.error('Error updating profile completion:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// BODY STATS OPERATIONS
// ============================================================================

/**
 * Get user's latest body stats
 */
export const getLatestBodyStats = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('body_stats')
            .select('*')
            .eq('user_id', userId)
            .order('recorded_date', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching latest body stats:', error);
        return { data: null, error: error };
    }
};

/**
 * Get body stats history (for charts/graphs)
 */
export const getBodyStatsHistory = async (userId: string, startDate?: string, endDate?: string) => {
    try {
        let query = supabase
            .from('body_stats')
            .select('*')
            .eq('user_id', userId)
            .order('recorded_date', { ascending: true });

        if (startDate) {
            query = query.gte('recorded_date', startDate);
        }
        if (endDate) {
            query = query.lte('recorded_date', endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching body stats history:', error);
        return { data: null, error: error };
    }
};

/**
 * Add or update body stats
 */
export const updateBodyStats = async (userId: string, stats: Partial<BodyStats>) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Check if stats already exist for today
        const { data: existing } = await supabase
            .from('body_stats')
            .select('stat_id')
            .eq('user_id', userId)
            .eq('recorded_date', today)
            .single();

        let result;

        if (existing) {
            // Update existing record
            result = await supabase
                .from('body_stats')
                .update(stats)
                .eq('stat_id', existing.stat_id)
                .select()
                .single();
        } else {
            // Insert new record
            result = await supabase
                .from('body_stats')
                .insert({
                    user_id: userId,
                    recorded_date: today,
                    ...stats,
                })
                .select()
                .single();
        }

        if (result.error) throw result.error;

        return { data: result.data, error: null };
    } catch (error: any) {
        console.error('Error updating body stats:', error);
        return { data: null, error: error };
    }
};

/**
 * Calculate BMI
 */
export const calculateBMI = (weightKg: number, heightCm: number): number => {
    if (!heightCm || heightCm === 0) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
};

// ============================================================================
// FITNESS GOALS OPERATIONS
// ============================================================================

/**
 * Get all fitness goals for a user
 */
export const getFitnessGoals = async (userId: string, activeOnly: boolean = false) => {
    try {
        let query = supabase
            .from('fitness_goals')
            .select('*')
            .eq('user_id', userId)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: false });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching fitness goals:', error);
        return { data: null, error: error };
    }
};

/**
 * Get primary fitness goal
 */
export const getPrimaryGoal = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('fitness_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .eq('is_primary', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching primary goal:', error);
        return { data: null, error: error };
    }
};

/**
 * Create a new fitness goal
 */
export const createGoal = async (userId: string, goal: Partial<FitnessGoal>) => {
    try {
        // If this is set as primary, unset other primary goals first
        if (goal.is_primary) {
            await supabase
                .from('fitness_goals')
                .update({ is_primary: false })
                .eq('user_id', userId);
        }

        const { data, error } = await supabase
            .from('fitness_goals')
            .insert({
                user_id: userId,
                ...goal,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating goal:', error);
        return { data: null, error: error };
    }
};

/**
 * Update fitness goal
 */
export const updateGoal = async (goalId: string, updates: Partial<FitnessGoal>) => {
    try {
        const { data, error } = await supabase
            .from('fitness_goals')
            .update(updates)
            .eq('goal_id', goalId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating goal:', error);
        return { data: null, error: error };
    }
};

/**
 * Delete fitness goal
 */
export const deleteGoal = async (goalId: string) => {
    try {
        const { error } = await supabase
            .from('fitness_goals')
            .delete()
            .eq('goal_id', goalId);

        if (error) throw error;

        return { data: true, error: null };
    } catch (error: any) {
        console.error('Error deleting goal:', error);
        return { data: false, error: error };
    }
};

/**
 * Update goal progress
 */
export const updateGoalProgress = async (goalId: string, currentValue: number) => {
    try {
        // Get goal details
        const { data: goal } = await supabase
            .from('fitness_goals')
            .select('start_value, goal_value')
            .eq('goal_id', goalId)
            .single();

        if (!goal || !goal.start_value || !goal.goal_value) {
            throw new Error('Goal data incomplete');
        }

        // Calculate progress percentage
        const totalChange = Math.abs(goal.goal_value - goal.start_value);
        const currentChange = Math.abs(currentValue - goal.start_value);
        const progressPercentage = Math.min(100, (currentChange / totalChange) * 100);

        const { data, error } = await supabase
            .from('fitness_goals')
            .update({
                current_value: currentValue,
                progress_percentage: progressPercentage,
            })
            .eq('goal_id', goalId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating goal progress:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// AI FITNESS SUMMARY OPERATIONS
// ============================================================================

/**
 * Get current AI fitness summary
 */
export const getAISummary = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('ai_fitness_summary')
            .select('*')
            .eq('user_id', userId)
            .eq('is_current', true)
            .order('generated_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching AI summary:', error);
        return { data: null, error: error };
    }
};

/**
 * Create AI fitness summary (typically called by AI service)
 */
export const createAISummary = async (userId: string, summary: Partial<AIFitnessSummary>) => {
    try {
        // Mark previous summaries as not current
        await supabase
            .from('ai_fitness_summary')
            .update({ is_current: false })
            .eq('user_id', userId);

        const { data, error } = await supabase
            .from('ai_fitness_summary')
            .insert({
                user_id: userId,
                is_current: true,
                ...summary,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating AI summary:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// ACHIEVEMENTS OPERATIONS
// ============================================================================

/**
 * Get all achievements for a user
 */
export const getAchievements = async (userId: string, earnedOnly: boolean = false) => {
    try {
        let query = supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId)
            .order('earned_date', { ascending: false, nullsFirst: false })
            .order('display_order', { ascending: true });

        if (earnedOnly) {
            query = query.eq('is_earned', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching achievements:', error);
        return { data: null, error: error };
    }
};

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = async (
    userId: string,
    category: Achievement['badge_category']
) => {
    try {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId)
            .eq('badge_category', category)
            .order('display_order', { ascending: true });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching achievements by category:', error);
        return { data: null, error: error };
    }
};

/**
 * Update achievement progress
 */
export const updateAchievementProgress = async (
    achievementId: string,
    currentProgress: number
) => {
    try {
        // Get achievement details
        const { data: achievement } = await supabase
            .from('achievements')
            .select('target_progress, is_earned')
            .eq('achievement_id', achievementId)
            .single();

        if (!achievement) throw new Error('Achievement not found');

        const progressPercentage = (currentProgress / achievement.target_progress) * 100;
        const isEarned = currentProgress >= achievement.target_progress;

        const updates: any = {
            current_progress: currentProgress,
            progress_percentage: Math.min(100, progressPercentage),
        };

        // If just earned, set earned_date
        if (isEarned && !achievement.is_earned) {
            updates.is_earned = true;
            updates.earned_date = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('achievements')
            .update(updates)
            .eq('achievement_id', achievementId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating achievement progress:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// WEARABLE DEVICE OPERATIONS
// ============================================================================

/**
 * Get all connected devices for a user
 */
export const getDevices = async (userId: string, activeOnly: boolean = true) => {
    try {
        let query = supabase
            .from('wearable_devices')
            .select('*')
            .eq('user_id', userId)
            .order('connected_at', { ascending: false });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching devices:', error);
        return { data: null, error: error };
    }
};

/**
 * Get device status
 */
export const getDeviceStatus = async (deviceId: string) => {
    try {
        const { data, error } = await supabase
            .from('wearable_devices')
            .select('*')
            .eq('device_id', deviceId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching device status:', error);
        return { data: null, error: error };
    }
};

/**
 * Connect a new device
 */
export const connectDevice = async (userId: string, device: Partial<WearableDevice>) => {
    try {
        const { data, error } = await supabase
            .from('wearable_devices')
            .insert({
                user_id: userId,
                sync_status: 'connected',
                is_active: true,
                ...device,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error connecting device:', error);
        return { data: null, error: error };
    }
};

/**
 * Disconnect a device
 */
export const disconnectDevice = async (deviceId: string) => {
    try {
        const { data, error } = await supabase
            .from('wearable_devices')
            .update({
                sync_status: 'disconnected',
                is_active: false,
                disconnected_at: new Date().toISOString(),
            })
            .eq('device_id', deviceId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error disconnecting device:', error);
        return { data: null, error: error };
    }
};

/**
 * Update device sync status
 */
export const updateDeviceSync = async (
    deviceId: string,
    status: WearableDevice['sync_status'],
    batteryLevel?: number
) => {
    try {
        const updates: any = {
            sync_status: status,
            last_sync_time: new Date().toISOString(),
        };

        if (batteryLevel !== undefined) {
            updates.battery_level = batteryLevel;
        }

        const { data, error } = await supabase
            .from('wearable_devices')
            .update(updates)
            .eq('device_id', deviceId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating device sync:', error);
        return { data: null, error: error };
    }
};

/**
 * Update device permissions
 */
export const updateDevicePermissions = async (
    deviceId: string,
    permissions: {
        heart_rate_enabled?: boolean;
        steps_enabled?: boolean;
        sleep_enabled?: boolean;
        calories_enabled?: boolean;
        blood_pressure_enabled?: boolean;
        blood_oxygen_enabled?: boolean;
    }
) => {
    try {
        const { data, error } = await supabase
            .from('wearable_devices')
            .update(permissions)
            .eq('device_id', deviceId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating device permissions:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// USER PREFERENCES OPERATIONS
// ============================================================================

/**
 * Get user preferences
 */
export const getUserPreferences = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // If no preferences exist, create default ones
        if (!data) {
            return createUserPreferences(userId);
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching user preferences:', error);
        return { data: null, error: error };
    }
};

/**
 * Create user preferences with defaults
 */
export const createUserPreferences = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .insert({ user_id: userId })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating user preferences:', error);
        return { data: null, error: error };
    }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
    userId: string,
    preferences: Partial<UserPreferences>
) => {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .update(preferences)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating user preferences:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// HEALTH RISK OPERATIONS
// ============================================================================

/**
 * Get current health risks
 */
export const getHealthRisks = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('health_risk')
            .select('*')
            .eq('user_id', userId)
            .eq('is_current', true)
            .order('assessed_at', { ascending: false });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching health risks:', error);
        return { data: null, error: error };
    }
};

/**
 * Create health risk assessment
 */
export const createHealthRisk = async (userId: string, risk: Partial<HealthRisk>) => {
    try {
        const { data, error } = await supabase
            .from('health_risk')
            .insert({
                user_id: userId,
                is_current: true,
                ...risk,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating health risk:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert weight between units
 */
export const convertWeight = (value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number => {
    if (from === to) return value;
    if (from === 'kg' && to === 'lbs') return value * 2.20462;
    if (from === 'lbs' && to === 'kg') return value / 2.20462;
    return value;
};

/**
 * Convert height between units
 */
export const convertHeight = (value: number, from: 'cm' | 'ft_in', to: 'cm' | 'ft_in'): any => {
    if (from === to) return value;
    if (from === 'cm' && to === 'ft_in') {
        const totalInches = value / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        return { feet, inches };
    }
    if (from === 'ft_in' && to === 'cm') {
        // Assume value is in format: {feet: X, inches: Y}
        return ((value as any).feet * 12 + (value as any).inches) * 2.54;
    }
    return value;
};

/**
 * Convert distance between units
 */
export const convertDistance = (value: number, from: 'km' | 'miles', to: 'km' | 'miles'): number => {
    if (from === to) return value;
    if (from === 'km' && to === 'miles') return value * 0.621371;
    if (from === 'miles' && to === 'km') return value / 0.621371;
    return value;
};
