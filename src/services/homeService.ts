/**
 * Home Dashboard Service
 * Handles all data fetching and calculations for the home screen
 * Includes real pedometer integration and Google Gemini AI
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/config/supabaseClient';
import { Pedometer } from 'expo-sensors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';

const QUOTE_STORAGE_KEY = '@home_motivational_quote';
const QUOTE_DATE_KEY = '@home_quote_date';
const STEPS_TODAY_KEY = '@steps_today';
const STEPS_BASE_KEY = '@steps_base';
const LAST_STEP_UPDATE_KEY = '@last_step_update';

// Initialize Gemini AI
const GEMINI_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// Motivational quotes database
const MOTIVATIONAL_QUOTES = [
    "Your body can stand almost anything. It's your mind you have to convince.",
    "The only bad workout is the one that didn't happen.",
    "Don't stop when you're tired. Stop when you're done.",
    "Success is what comes after you stop making excuses.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Don't wait for opportunity. Create it.",
    "Your limitation—it's only your imagination.",
    "Sometimes later becomes never. Do it now.",
    "Wake up with determination. Go to bed with satisfaction.",
    "Do something today that your future self will thank you for.",
    "Little things make big days.",
    "It's going to be hard, but hard does not mean impossible.",
    "Don't wish for it, work for it.",
    "Go the extra mile. It's never crowded.",
    "You are stronger than you think.",
];

export interface DailySummary {
    steps: number;
    caloriesBurned: number;
    workoutsCompleted: number;
    activeMinutes: number;
    date: string;
}

export interface AIRecommendation {
    type: 'workout' | 'health' | 'nutrition' | 'recovery';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
}

export interface TodaySchedule {
    gymBookings: GymBooking[];
    trainerSessions: TrainerSession[];
    plannedWorkouts: PlannedWorkout[];
}

export interface GymBooking {
    id: string;
    gymName: string;
    gymAddress: string;
    timeSlot: string;
    date: string;
}

export interface TrainerSession {
    id: string;
    trainerName: string;
    sessionType: string;
    time: string;
    date: string;
}

export interface PlannedWorkout {
    id: string;
    name: string;
    duration: number;
    time: string;
}

export interface WeeklyProgress {
    dates: string[];
    weight: number[];
    steps: number[];
    calories: number[];
    waterIntake: number[];
    goalWeight: number;
    goalSteps: number;
    goalCalories: number;
}

/**
 * Get daily motivational quote
 * Refreshes once per day
 */
export async function getDailyQuote(): Promise<string> {
    try {
        const today = new Date().toDateString();
        const storedDate = await AsyncStorage.getItem(QUOTE_DATE_KEY);
        const storedQuote = await AsyncStorage.getItem(QUOTE_STORAGE_KEY);

        // Return stored quote if it's from today
        if (storedDate === today && storedQuote) {
            return storedQuote;
        }

        // Get new random quote
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        const newQuote = MOTIVATIONAL_QUOTES[randomIndex];

        // Store for today
        await AsyncStorage.setItem(QUOTE_STORAGE_KEY, newQuote);
        await AsyncStorage.setItem(QUOTE_DATE_KEY, today);

        return newQuote;
    } catch (error) {
        console.error('Error getting daily quote:', error);
        return MOTIVATIONAL_QUOTES[0]; // Fallback quote
    }
}

/**
 * Check if pedometer is available on device
 */
export async function isPedometerAvailable(): Promise<boolean> {
    try {
        const isAvailable = await Pedometer.isAvailableAsync();
        return isAvailable;
    } catch (error) {
        console.error('Error checking pedometer availability:', error);
        return false;
    }
}

/**
 * Get real-time steps from device pedometer
 */
export async function getTodaySteps(): Promise<number> {
    try {
        const isAvailable = await isPedometerAvailable();

        if (!isAvailable) {
            console.log('📱 Pedometer not available on this device');
            // Return stored steps if pedometer not available
            const storedSteps = await AsyncStorage.getItem(STEPS_TODAY_KEY);
            return storedSteps ? parseInt(storedSteps, 10) : 0;
        }

        // Get steps from midnight to now
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();

        const result = await Pedometer.getStepCountAsync(start, end);
        const steps = result?.steps || 0;

        // Store the steps
        await AsyncStorage.setItem(STEPS_TODAY_KEY, steps.toString());
        await AsyncStorage.setItem(LAST_STEP_UPDATE_KEY, new Date().toISOString());

        console.log(`📊 Today's steps: ${steps}`);
        return steps;
    } catch (error) {
        console.error('Error getting today steps:', error);

        // Fallback to stored value
        const storedSteps = await AsyncStorage.getItem(STEPS_TODAY_KEY);
        return storedSteps ? parseInt(storedSteps, 10) : 0;
    }
}

/**
 * Start listening to real-time step updates
 * Returns subscription that should be removed when component unmounts
 */
export function subscribeToStepUpdates(callback: (steps: number) => void) {
    let subscription: any;

    isPedometerAvailable().then(async (isAvailable) => {
        if (!isAvailable) {
            console.log('📱 Pedometer not available for real-time updates');
            return;
        }

        // Get initial steps count from today's start
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        try {
            const initialResult = await Pedometer.getStepCountAsync(start, new Date());
            const baseSteps = initialResult?.steps || 0;
            await AsyncStorage.setItem(STEPS_BASE_KEY, baseSteps.toString());

            // Subscribe to step updates
            subscription = Pedometer.watchStepCount(result => {
                const totalSteps = baseSteps + (result?.steps || 0);
                callback(totalSteps);
                AsyncStorage.setItem(STEPS_TODAY_KEY, totalSteps.toString());
            });
        } catch (error) {
            console.error('Error subscribing to step updates:', error);
        }
    });

    return {
        remove: () => {
            if (subscription) {
                subscription.remove();
            }
        }
    };
}

/**
 * Calculate calories burned from steps
 * Average: 0.04-0.05 calories per step
 */
export function calculateCaloriesFromSteps(steps: number, weight_kg: number = 70): number {
    // Formula: steps * 0.04 * (weight / 70)
    // Adjusted for user weight (70kg baseline)
    const baseCaloriesPerStep = 0.04;
    const weightFactor = weight_kg / 70;
    return Math.round(steps * baseCaloriesPerStep * weightFactor);
}

/**
 * Get today's summary (steps, calories, workouts, active minutes)
 * Now with REAL step tracking!
 */
export async function getDailySummary(userId: string): Promise<DailySummary> {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get REAL steps from pedometer
        const realSteps = await getTodaySteps();

        // Fetch user weight for calorie calculation
        const { data: profile } = await supabase
            .from('profiles')
            .select('weight_kg')
            .eq('id', userId)
            .single();

        const userWeight = profile?.weight_kg || 70;

        // Calculate calories from steps
        const caloriesFromSteps = calculateCaloriesFromSteps(realSteps, userWeight);

        // Try to fetch from database
        const { data, error } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

        if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
            console.error('Error fetching daily summary:', error);
        }

        // If data exists in database, merge with real steps
        if (data) {
            const workoutCalories = data.calories_burned || 0;
            const totalCalories = caloriesFromSteps + workoutCalories;

            return {
                steps: realSteps, // REAL steps from device
                caloriesBurned: totalCalories, // Steps calories + workout calories
                workoutsCompleted: data.workouts_completed || 0,
                activeMinutes: data.active_minutes || 0,
                date: today,
            };
        }

        // Return real steps even if no database entry
        return {
            steps: realSteps, // REAL steps from device
            caloriesBurned: caloriesFromSteps, // Calculated from steps
            workoutsCompleted: 0,
            activeMinutes: 0,
            date: today,
        };
    } catch (error) {
        console.error('Error getting daily summary:', error);

        // Even on error, try to get real steps
        try {
            const realSteps = await getTodaySteps();
            const caloriesFromSteps = calculateCaloriesFromSteps(realSteps);

            return {
                steps: realSteps,
                caloriesBurned: caloriesFromSteps,
                workoutsCompleted: 0,
                activeMinutes: 0,
                date: new Date().toISOString().split('T')[0],
            };
        } catch (stepError) {
            // Ultimate fallback
            return {
                steps: 0,
                caloriesBurned: 0,
                workoutsCompleted: 0,
                activeMinutes: 0,
                date: new Date().toISOString().split('T')[0],
            };
        }
    }
}

/**
 * Update daily summary
 */
export async function updateDailySummary(
    userId: string,
    updates: Partial<DailySummary>
): Promise<void> {
    try {
        const today = new Date().toISOString().split('T')[0];

        // First, try to check if record exists
        const { data: existing } = await supabase
            .from('daily_activity')
            .select('id')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

        const activityData = {
            user_id: userId,
            date: today,
            steps: updates.steps,
            calories_burned: updates.caloriesBurned,
            workouts_completed: updates.workoutsCompleted,
            active_minutes: updates.activeMinutes,
            updated_at: new Date().toISOString(),
        };

        if (existing) {
            // Update existing record
            const { error } = await supabase
                .from('daily_activity')
                .update(activityData)
                .eq('user_id', userId)
                .eq('date', today);

            if (error) {
                console.error('Error updating daily summary:', error);
            }
        } else {
            // Insert new record
            const { error } = await supabase
                .from('daily_activity')
                .insert(activityData);

            if (error) {
                console.error('Error inserting daily summary:', error);
            }
        }
    } catch (error) {
        console.error('Error updating daily summary:', error);
    }
}

/**
 * Generate AI recommendations using Google Gemini AI
 * Falls back to rule-based recommendations if AI is unavailable
 */
export async function getAIRecommendations(userId: string): Promise<AIRecommendation[]> {
    try {
        // Fetch user profile and activity data
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        // Get real steps from device
        const todaySteps = await getTodaySteps();

        const { data: activity } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(7);

        const recommendations: AIRecommendation[] = [];

        // Try to use Google Gemini AI for personalized recommendations
        if (genAI && profile) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });

                const avgSteps = activity && activity.length > 0
                    ? activity.reduce((sum, day) => sum + (day.steps || 0), 0) / activity.length
                    : todaySteps;

                const avgCalories = activity && activity.length > 0
                    ? activity.reduce((sum, day) => sum + (day.calories_burned || 0), 0) / activity.length
                    : 0;

                const avgWorkouts = activity && activity.length > 0
                    ? activity.reduce((sum, day) => sum + (day.workouts_completed || 0), 0) / activity.length
                    : 0;

                const prompt = `You are a professional fitness coach. Based on this user data, provide 3-4 concise, actionable fitness recommendations (each 2-3 sentences max):

User Profile:
- Goal: ${profile.primary_goal || 'general fitness'}
- Age: ${profile.age || 'unknown'}
- Weight: ${profile.weight_kg || 'unknown'}kg
- Height: ${profile.height_cm || 'unknown'}cm
- Fitness Level: ${profile.fitness_level || 'beginner'}
- Sleep: ${profile.sleep_hours || 'unknown'} hours/night

Recent Activity (7 days):
- Average Steps: ${Math.round(avgSteps)}/day (Today: ${todaySteps})
- Average Calories: ${Math.round(avgCalories)}/day
- Average Workouts: ${avgWorkouts.toFixed(1)}/day

Provide recommendations in this exact JSON format:
[
  {"type": "workout", "title": "Personalized workout tip", "message": "your recommendation here", "priority": "high"},
  {"type": "health", "title": "Health insight", "message": "your recommendation here", "priority": "medium"},
  {"type": "nutrition", "title": "Nutrition suggestion", "message": "your recommendation here", "priority": "high"},
  {"type": "recovery", "title": "Recovery advice", "message": "your recommendation here", "priority": "medium"}
]`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Extract JSON from response
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const aiRecommendations = JSON.parse(jsonMatch[0]);
                    console.log('✨ AI Recommendations generated successfully');
                    return aiRecommendations;
                }
            } catch (aiError) {
                console.log('⚠️ AI generation failed, using rule-based recommendations:', aiError);
            }
        }

        // Fallback to rule-based recommendations
        if (profile) {
            // Workout recommendation based on goal
            if (profile.primary_goal === 'weight_loss') {
                recommendations.push({
                    type: 'workout',
                    title: 'Personalized workout tip',
                    message: `Focus on cardio exercises for 30-45 minutes. High-intensity interval training (HIIT) can help accelerate weight loss. Try combining it with strength training 2-3 times per week.`,
                    priority: 'high',
                });
            } else if (profile.primary_goal === 'muscle_gain') {
                recommendations.push({
                    type: 'workout',
                    title: 'Personalized workout tip',
                    message: `Prioritize compound exercises like squats, deadlifts, and bench press. Aim for 3-4 sets of 8-12 reps with progressive overload. Rest 48 hours between muscle groups.`,
                    priority: 'high',
                });
            } else {
                recommendations.push({
                    type: 'workout',
                    title: 'Personalized workout tip',
                    message: `Balance your routine with 150 minutes of moderate cardio and 2-3 strength sessions weekly. Don't forget flexibility exercises like yoga or stretching.`,
                    priority: 'medium',
                });
            }

            // Health insight based on real steps
            if (todaySteps < 5000) {
                recommendations.push({
                    type: 'health',
                    title: 'Health insight',
                    message: `You've taken ${todaySteps.toLocaleString()} steps today. Aim for 8,000-10,000 steps daily to reduce cardiovascular risks and improve overall health. Every step counts!`,
                    priority: 'high',
                });
            } else if (todaySteps >= 10000) {
                recommendations.push({
                    type: 'health',
                    title: 'Health insight',
                    message: `Excellent! You've taken ${todaySteps.toLocaleString()} steps today. You're meeting the recommended daily activity level. Keep up the great work!`,
                    priority: 'low',
                });
            } else {
                recommendations.push({
                    type: 'health',
                    title: 'Health insight',
                    message: `You're at ${todaySteps.toLocaleString()} steps today. Just ${(10000 - todaySteps).toLocaleString()} more steps to reach your 10K goal! A short walk can make the difference.`,
                    priority: 'medium',
                });
            }

            // Nutrition suggestion based on goal
            if (profile.primary_goal === 'weight_loss') {
                const proteinTarget = Math.round((profile.weight_kg || 70) * 2.2);
                recommendations.push({
                    type: 'nutrition',
                    title: 'Nutrition suggestion',
                    message: `Maintain a slight calorie deficit (300-500 calories below maintenance). Focus on protein (${proteinTarget}g/day), vegetables, and whole grains. Stay hydrated with 8-10 glasses of water!`,
                    priority: 'high',
                });
            } else if (profile.primary_goal === 'muscle_gain') {
                const proteinTarget = Math.round((profile.weight_kg || 70) * 2.2 * 1.8);
                recommendations.push({
                    type: 'nutrition',
                    title: 'Nutrition suggestion',
                    message: `Aim for a calorie surplus with ${proteinTarget}g of protein daily. Include complex carbs post-workout and healthy fats. Consider 4-6 smaller meals throughout the day.`,
                    priority: 'high',
                });
            } else {
                recommendations.push({
                    type: 'nutrition',
                    title: 'Nutrition suggestion',
                    message: `Maintain balanced macros: 40% carbs, 30% protein, 30% fats. Eat whole foods, lean proteins, and colorful vegetables. Stay hydrated and listen to your hunger cues.`,
                    priority: 'medium',
                });
            }

            // Recovery advice based on sleep
            if (profile.sleep_hours && parseInt(profile.sleep_hours) < 7) {
                recommendations.push({
                    type: 'recovery',
                    title: 'Recovery advice',
                    message: `You're averaging ${profile.sleep_hours} hours of sleep. Aim for 7-9 hours for optimal recovery and muscle growth. Consider a consistent sleep schedule and pre-bed routine.`,
                    priority: 'high',
                });
            } else {
                recommendations.push({
                    type: 'recovery',
                    title: 'Recovery advice',
                    message: `Great sleep habits! Don't forget active recovery days. Include stretching, foam rolling, or light yoga. Listen to your body—rest is when muscles grow.`,
                    priority: 'medium',
                });
            }
        } else {
            // Default recommendations if no profile
            recommendations.push(
                {
                    type: 'workout',
                    title: 'Personalized workout tip',
                    message: `Start with a balanced routine: 3 days of strength training and 2-3 days of cardio. Focus on proper form before increasing weight or intensity.`,
                    priority: 'medium',
                },
                {
                    type: 'nutrition',
                    title: 'Nutrition suggestion',
                    message: `Track your meals to understand your eating patterns. Aim for whole foods, lean proteins, vegetables, and complex carbs. Stay hydrated with 8-10 glasses of water daily.`,
                    priority: 'medium',
                },
                {
                    type: 'recovery',
                    title: 'Recovery advice',
                    message: `Rest is crucial! Aim for 7-9 hours of sleep nightly. Include rest days in your routine and consider activities like stretching or light walking on recovery days.`,
                    priority: 'medium',
                }
            );
        }

        return recommendations;
    } catch (error) {
        console.error('Error getting AI recommendations:', error);
        return [];
    }
}

/**
 * Get today's schedule (gym bookings, trainer sessions, planned workouts)
 */
export async function getTodaySchedule(userId: string): Promise<TodaySchedule> {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch gym bookings
        const { data: gymBookings } = await supabase
            .from('gym_bookings')
            .select('*, gyms(name, address)')
            .eq('user_id', userId)
            .eq('booking_date', today)
            .eq('status', 'confirmed');

        // Fetch trainer sessions
        const { data: trainerSessions } = await supabase
            .from('trainer_sessions')
            .select('*, trainers(full_name)')
            .eq('member_id', userId)
            .eq('session_date', today)
            .eq('status', 'confirmed');

        // Fetch planned workouts
        const { data: plannedWorkouts } = await supabase
            .from('planned_workouts')
            .select('*')
            .eq('user_id', userId)
            .eq('planned_date', today);

        return {
            gymBookings: gymBookings?.map((booking: any) => ({
                id: booking.id,
                gymName: booking.gyms?.name || 'Gym',
                gymAddress: booking.gyms?.address || '',
                timeSlot: booking.time_slot,
                date: booking.booking_date,
            })) || [],
            trainerSessions: trainerSessions?.map((session: any) => ({
                id: session.id,
                trainerName: session.trainers?.full_name || 'Trainer',
                sessionType: session.session_type,
                time: session.session_time,
                date: session.session_date,
            })) || [],
            plannedWorkouts: plannedWorkouts?.map((workout: any) => ({
                id: workout.id,
                name: workout.workout_name,
                duration: workout.duration_minutes,
                time: workout.planned_time,
            })) || [],
        };
    } catch (error) {
        console.error('Error getting today schedule:', error);
        return {
            gymBookings: [],
            trainerSessions: [],
            plannedWorkouts: [],
        };
    }
}

/**
 * Get weekly progress data for charts
 */
export async function getWeeklyProgress(userId: string): Promise<WeeklyProgress> {
    try {
        const today = new Date();
        const dates: string[] = [];
        const weight: number[] = [];
        const steps: number[] = [];
        const calories: number[] = [];
        const waterIntake: number[] = [];

        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }

        // Fetch activity data
        const { data: activityData } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('user_id', userId)
            .in('date', dates)
            .order('date', { ascending: true });

        // Fetch weight data
        const { data: weightData } = await supabase
            .from('weight_logs')
            .select('*')
            .eq('user_id', userId)
            .in('date', dates)
            .order('date', { ascending: true });

        // Fetch profile for goals
        const { data: profile } = await supabase
            .from('profiles')
            .select('goal_weight_kg, weight_kg')
            .eq('id', userId)
            .single();

        // Fill data arrays
        dates.forEach(date => {
            const activity = activityData?.find(a => a.date === date);
            const weightLog = weightData?.find(w => w.date === date);

            steps.push(activity?.steps || 0);
            calories.push(activity?.calories_burned || 0);
            waterIntake.push(activity?.water_intake || 0);
            weight.push(weightLog?.weight || profile?.weight_kg || 0);
        });

        return {
            dates,
            weight,
            steps,
            calories,
            waterIntake,
            goalWeight: profile?.goal_weight_kg || 0,
            goalSteps: 10000, // Default goal
            goalCalories: 2500, // Default goal
        };
    } catch (error) {
        console.error('Error getting weekly progress:', error);
        return {
            dates: [],
            weight: [],
            steps: [],
            calories: [],
            waterIntake: [],
            goalWeight: 0,
            goalSteps: 10000,
            goalCalories: 2500,
        };
    }
}

/**
 * Complete a workout (manual entry)
 */
export async function completeWorkout(userId: string, workoutData: {
    name: string;
    duration: number;
    caloriesBurned: number;
}): Promise<void> {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Log workout
        await supabase.from('workout_logs').insert({
            user_id: userId,
            workout_name: workoutData.name,
            duration_minutes: workoutData.duration,
            calories_burned: workoutData.caloriesBurned,
            date: today,
            created_at: new Date().toISOString(),
        });

        // Update daily summary
        const currentSummary = await getDailySummary(userId);
        await updateDailySummary(userId, {
            workoutsCompleted: currentSummary.workoutsCompleted + 1,
            caloriesBurned: currentSummary.caloriesBurned + workoutData.caloriesBurned,
            activeMinutes: currentSummary.activeMinutes + workoutData.duration,
        });
    } catch (error) {
        console.error('Error completing workout:', error);
        throw error;
    }
}

/**
 * Track active minutes (app usage time)
 */
let appOpenTime: Date | null = null;

export function startTrackingActiveMinutes(): void {
    appOpenTime = new Date();
}

export async function stopTrackingActiveMinutes(userId: string): Promise<void> {
    if (!appOpenTime) return;

    try {
        const now = new Date();
        const minutesActive = Math.floor((now.getTime() - appOpenTime.getTime()) / 60000);

        if (minutesActive > 0) {
            const currentSummary = await getDailySummary(userId);
            await updateDailySummary(userId, {
                activeMinutes: currentSummary.activeMinutes + minutesActive,
            });
        }

        appOpenTime = null;
    } catch (error) {
        console.error('Error tracking active minutes:', error);
    }
}
