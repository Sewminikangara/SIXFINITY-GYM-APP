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
const AI_RECOMMENDATIONS_KEY = '@ai_recommendations';
const AI_RECOMMENDATIONS_DATE_KEY = '@ai_recommendations_date';

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
 * Calculate BMI and return health category
 */
export function calculateBMI(weight_kg: number, height_cm: number): {
    bmi: number;
    category: 'underweight' | 'normal' | 'overweight' | 'obese';
    message: string;
} {
    const heightMeters = height_cm / 100;
    const bmi = weight_kg / (heightMeters * heightMeters);

    let category: 'underweight' | 'normal' | 'overweight' | 'obese';
    let message: string;

    if (bmi < 18.5) {
        category = 'underweight';
        message = 'Underweight - Consider consulting a nutritionist for healthy weight gain strategies.';
    } else if (bmi < 25) {
        category = 'normal';
        message = 'Healthy weight - Maintain your current lifestyle with balanced nutrition and regular exercise.';
    } else if (bmi < 30) {
        category = 'overweight';
        message = 'Overweight - Focus on creating a calorie deficit through balanced diet and increased physical activity.';
    } else {
        category = 'obese';
        message = 'Obese - Consider consulting healthcare professionals for a comprehensive weight management plan.';
    }

    return { bmi: Math.round(bmi * 10) / 10, category, message };
}

/**
 * Calculate target protein intake based on goal and weight
 */
export function calculateProteinTarget(weight_kg: number, goal: string): number {
    const baseProteinPerKg = 2.2; // grams per kg (1g per lb)

    switch (goal) {
        case 'muscle_gain':
        case 'gain_muscle':
        case 'gain_strength':
            return Math.round(weight_kg * baseProteinPerKg * 1.8); // Higher for muscle gain
        case 'weight_loss':
        case 'lose_weight':
            return Math.round(weight_kg * baseProteinPerKg * 1.2); // Moderate for weight loss
        default:
            return Math.round(weight_kg * baseProteinPerKg); // Standard
    }
}

/**
 * Get cached AI recommendations if available and fresh
 */
async function getCachedRecommendations(): Promise<AIRecommendation[] | null> {
    try {
        const cachedData = await AsyncStorage.getItem(AI_RECOMMENDATIONS_KEY);
        const cachedDate = await AsyncStorage.getItem(AI_RECOMMENDATIONS_DATE_KEY);

        if (!cachedData || !cachedDate) return null;

        const cacheTime = new Date(cachedDate).getTime();
        const now = new Date().getTime();
        const hoursSinceCache = (now - cacheTime) / (1000 * 60 * 60);

        // Cache valid for 6 hours
        if (hoursSinceCache < 6) {
            console.log('📦 Using cached AI recommendations');
            return JSON.parse(cachedData);
        }

        return null;
    } catch (error) {
        console.error('Error reading cached recommendations:', error);
        return null;
    }
}

/**
 * Cache AI recommendations
 */
async function cacheRecommendations(recommendations: AIRecommendation[]): Promise<void> {
    try {
        await AsyncStorage.setItem(AI_RECOMMENDATIONS_KEY, JSON.stringify(recommendations));
        await AsyncStorage.setItem(AI_RECOMMENDATIONS_DATE_KEY, new Date().toISOString());
        console.log('💾 AI recommendations cached');
    } catch (error) {
        console.error('Error caching recommendations:', error);
    }
}

/**
 * Generate AI recommendations using Google Gemini AI
 * Falls back to rule-based recommendations if AI is unavailable
 */
export async function getAIRecommendations(userId: string, forceRefresh: boolean = false): Promise<AIRecommendation[]> {
    try {
        // Check for cached recommendations first (unless force refresh)
        if (!forceRefresh) {
            const cached = await getCachedRecommendations();
            if (cached) return cached;
        }

        // Fetch user profile and activity data
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Error fetching profile for recommendations:', profileError);
            // Return default recommendations if profile fetch fails
            return getDefaultRecommendations();
        }

        // Get real steps from device
        const todaySteps = await getTodaySteps();

        const { data: activity } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(7);

        const recommendations: AIRecommendation[] = [];

        // Calculate BMI if height and weight available
        let bmiData: ReturnType<typeof calculateBMI> | null = null;
        if (profile?.height_cm && profile?.weight_kg) {
            bmiData = calculateBMI(profile.weight_kg, profile.height_cm);
        }

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

                const bmiInfo = bmiData ? `BMI: ${bmiData.bmi} (${bmiData.category})` : 'BMI: unknown';

                const prompt = `You are a professional fitness coach and nutritionist. Based on this user data, provide 3-4 concise, actionable fitness recommendations (each 2-3 sentences max):

User Profile:
- Goal: ${profile.primary_goal || 'general fitness'}
- Age: ${profile.age || 'unknown'}
- Gender: ${profile.gender || 'unknown'}
- Weight: ${profile.weight_kg || 'unknown'}kg
- Height: ${profile.height_cm || 'unknown'}cm
- ${bmiInfo}
- Fitness Level: ${profile.activity_level || 'beginner'}
- Medical Conditions: ${profile.medical_conditions?.join(', ') || 'none'}
- Dietary Restrictions: ${profile.dietary_restrictions?.join(', ') || 'none'}

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
                    console.log('✨ AI Recommendations generated successfully via Gemini AI');

                    // Cache the recommendations
                    await cacheRecommendations(aiRecommendations);

                    return aiRecommendations;
                }
            } catch (aiError) {
                console.log('⚠️ AI generation failed, using rule-based recommendations:', aiError);
            }
        } else if (!genAI) {
            console.log('⚠️ Gemini API not configured, using rule-based recommendations');
        }

        // Fallback to rule-based recommendations
        if (profile) {
            // 1. WORKOUT RECOMMENDATION based on goal, age, and fitness level
            if (profile.primary_goal === 'weight_loss' || profile.primary_goal === 'lose_weight') {
                const cardioMinutes = profile.activity_level === 'sedentary' ? '30-40' : '40-50';
                recommendations.push({
                    type: 'workout',
                    title: '🏃 Weight Loss Workout Plan',
                    message: `Focus on cardio exercises for ${cardioMinutes} minutes, 4-5 times per week. High-intensity interval training (HIIT) can accelerate fat loss. Combine with strength training 2-3 times weekly to preserve muscle mass while losing weight.`,
                    priority: 'high',
                });
            } else if (profile.primary_goal === 'muscle_gain' || profile.primary_goal === 'gain_muscle' || profile.primary_goal === 'gain_strength') {
                const restTime = profile.activity_level === 'very_active' ? '48-72' : '72';
                recommendations.push({
                    type: 'workout',
                    title: '💪 Muscle Building Workout Plan',
                    message: `Prioritize compound exercises: squats, deadlifts, bench press, overhead press, and rows. Aim for 3-4 sets of 8-12 reps with progressive overload. Rest ${restTime} hours between muscle groups for optimal recovery and growth.`,
                    priority: 'high',
                });
            } else if (profile.primary_goal === 'improve_fitness') {
                recommendations.push({
                    type: 'workout',
                    title: '⚡ General Fitness Plan',
                    message: `Balance your routine with 150 minutes of moderate cardio weekly and 2-3 full-body strength sessions. Include flexibility work like yoga or stretching 2x per week. Vary your workouts to stay motivated and challenge different muscle groups.`,
                    priority: 'medium',
                });
            } else {
                recommendations.push({
                    type: 'workout',
                    title: '🎯 Balanced Fitness Routine',
                    message: `Maintain fitness with 3 days of mixed cardio (running, cycling, swimming) and 2-3 days of strength training. Don't forget flexibility exercises. Listen to your body and adjust intensity based on how you feel.`,
                    priority: 'medium',
                });
            }

            // 2. HEALTH INSIGHT based on BMI and real steps
            if (bmiData) {
                if (bmiData.category === 'obese' || bmiData.category === 'overweight') {
                    const targetBMI = bmiData.category === 'obese' ? 29 : 24.9;
                    const targetWeight = Math.round((targetBMI * Math.pow(profile.height_cm / 100, 2)) * 10) / 10;
                    const weightToLose = Math.round((profile.weight_kg - targetWeight) * 10) / 10;

                    recommendations.push({
                        type: 'health',
                        title: '❤️ BMI Health Alert',
                        message: `Your BMI is ${bmiData.bmi} (${bmiData.category}). Aim to gradually lose ${weightToLose}kg over several months through sustainable lifestyle changes. Small consistent steps lead to lasting results. Consider consulting a healthcare provider for personalized guidance.`,
                        priority: 'high',
                    });
                } else if (bmiData.category === 'underweight') {
                    const targetWeight = Math.round((20 * Math.pow(profile.height_cm / 100, 2)) * 10) / 10;
                    const weightToGain = Math.round((targetWeight - profile.weight_kg) * 10) / 10;

                    recommendations.push({
                        type: 'health',
                        title: '❤️ BMI Health Notice',
                        message: `Your BMI is ${bmiData.bmi} (underweight). Aim to gain ${weightToGain}kg through nutrient-dense foods and strength training. Focus on healthy calories from whole foods, not junk. Consider consulting a nutritionist for a personalized meal plan.`,
                        priority: 'high',
                    });
                } else {
                    // Normal BMI - focus on steps
                    if (todaySteps < 5000) {
                        recommendations.push({
                            type: 'health',
                            title: '🚶 Daily Activity Goal',
                            message: `You've taken ${todaySteps.toLocaleString()} steps today. Your BMI is healthy (${bmiData.bmi}), but aim for 8,000-10,000 daily steps to maintain cardiovascular health and prevent weight gain. Every step counts toward your wellness!`,
                            priority: 'high',
                        });
                    } else if (todaySteps >= 10000) {
                        recommendations.push({
                            type: 'health',
                            title: '✨ Excellent Activity!',
                            message: `Outstanding! You've taken ${todaySteps.toLocaleString()} steps today and your BMI is ${bmiData.bmi} (healthy). You're meeting recommended activity levels. Keep up this excellent habit for long-term health benefits!`,
                            priority: 'low',
                        });
                    } else {
                        recommendations.push({
                            type: 'health',
                            title: '👟 Almost There!',
                            message: `You're at ${todaySteps.toLocaleString()} steps today. Just ${(10000 - todaySteps).toLocaleString()} more to reach your 10K goal! Take a 15-minute walk after dinner or park farther from your destination. Your BMI is healthy at ${bmiData.bmi}.`,
                            priority: 'medium',
                        });
                    }
                }
            } else {
                // No BMI data - focus on steps only
                if (todaySteps < 5000) {
                    recommendations.push({
                        type: 'health',
                        title: '🚶 Increase Daily Movement',
                        message: `You've taken ${todaySteps.toLocaleString()} steps today. Aim for 8,000-10,000 steps daily to reduce cardiovascular risks and improve overall health. Try taking the stairs, walking during lunch, or a post-dinner stroll!`,
                        priority: 'high',
                    });
                } else if (todaySteps >= 10000) {
                    recommendations.push({
                        type: 'health',
                        title: '🎉 Daily Goal Achieved!',
                        message: `Excellent! You've taken ${todaySteps.toLocaleString()} steps today. You're meeting the recommended daily activity level. This consistency will pay dividends for your long-term health. Keep up the fantastic work!`,
                        priority: 'low',
                    });
                } else {
                    recommendations.push({
                        type: 'health',
                        title: '💚 Keep Moving Forward',
                        message: `You're at ${todaySteps.toLocaleString()} steps today. Just ${(10000 - todaySteps).toLocaleString()} more steps to reach your 10K goal! A 15-20 minute walk will get you there. Small movements add up!`,
                        priority: 'medium',
                    });
                }
            }

            // 3. NUTRITION SUGGESTION based on goal and weight
            if (profile.primary_goal === 'weight_loss' || profile.primary_goal === 'lose_weight') {
                const proteinTarget = calculateProteinTarget(profile.weight_kg || 70, 'weight_loss');
                const calorieDeficit = profile.gender === 'female' ? '300-400' : '400-500';

                recommendations.push({
                    type: 'nutrition',
                    title: '🥗 Weight Loss Nutrition',
                    message: `Maintain a calorie deficit of ${calorieDeficit} calories below maintenance. Target ${proteinTarget}g protein daily to preserve muscle. Fill half your plate with vegetables, quarter with lean protein, quarter with complex carbs. Drink 8-10 glasses of water daily!`,
                    priority: 'high',
                });
            } else if (profile.primary_goal === 'muscle_gain' || profile.primary_goal === 'gain_muscle' || profile.primary_goal === 'gain_strength') {
                const proteinTarget = calculateProteinTarget(profile.weight_kg || 70, 'muscle_gain');
                const calorieSurplus = profile.gender === 'female' ? '200-300' : '300-500';

                recommendations.push({
                    type: 'nutrition',
                    title: '💪 Muscle Gain Nutrition',
                    message: `Aim for a ${calorieSurplus} calorie surplus with ${proteinTarget}g protein daily. Include complex carbs post-workout (rice, oats, sweet potato) and healthy fats (avocado, nuts, olive oil). Eat 4-6 smaller meals throughout the day for consistent fuel.`,
                    priority: 'high',
                });
            } else {
                const proteinTarget = calculateProteinTarget(profile.weight_kg || 70, 'maintain');

                recommendations.push({
                    type: 'nutrition',
                    title: '🍽️ Balanced Nutrition',
                    message: `Maintain balanced macros: 40% carbs, 30% protein (${proteinTarget}g), 30% fats. Eat whole foods, lean proteins (chicken, fish, tofu), colorful vegetables, and whole grains. Stay hydrated and practice mindful eating—listen to your hunger cues.`,
                    priority: 'medium',
                });
            }

            // 4. RECOVERY ADVICE based on age, activity, and medical conditions
            const hasInjury = profile.past_injuries || (profile.medical_conditions && profile.medical_conditions.length > 0);
            const isHighActivity = profile.activity_level === 'very_active' || profile.activity_level === 'extra_active';

            if (hasInjury) {
                recommendations.push({
                    type: 'recovery',
                    title: '🩹 Injury-Aware Recovery',
                    message: `Given your injury history, prioritize proper warm-ups (10 min) and cool-downs (10 min). Include mobility work and stretching daily. Rest is when your body repairs—take 1-2 complete rest days weekly. Listen to pain signals and never push through sharp pain.`,
                    priority: 'high',
                });
            } else if (isHighActivity) {
                recommendations.push({
                    type: 'recovery',
                    title: '😴 Active Recovery Protocol',
                    message: `With your high activity level, recovery is crucial! Aim for 8-9 hours of sleep nightly. Include 1-2 active recovery days with light yoga, swimming, or walking. Consider foam rolling, stretching, and massage to prevent overtraining and injury.`,
                    priority: 'high',
                });
            } else if (profile.age && profile.age >= 40) {
                recommendations.push({
                    type: 'recovery',
                    title: '🧘 Age-Optimized Recovery',
                    message: `At ${profile.age} years, recovery takes longer but is more important. Aim for 7-9 hours of quality sleep, stay hydrated, and include flexibility work 3x weekly. Consider supplements like omega-3s. Listen to your body—rest when needed, push when you can.`,
                    priority: 'high',
                });
            } else {
                recommendations.push({
                    type: 'recovery',
                    title: '💤 Recovery Essentials',
                    message: `Aim for 7-9 hours of sleep nightly for optimal recovery and muscle growth. Include active recovery days with stretching, foam rolling, or light yoga. Hydrate well and consider contrast showers. Remember: rest is when muscles grow!`,
                    priority: 'medium',
                });
            }
        } else {
            // Default recommendations if no profile
            recommendations.push(...getDefaultRecommendations());
        }

        // Cache the recommendations
        await cacheRecommendations(recommendations);

        return recommendations;
    } catch (error) {
        console.error('Error getting AI recommendations:', error);

        // Try to return cached recommendations on error
        const cached = await getCachedRecommendations();
        if (cached) return cached;

        // Final fallback
        return getDefaultRecommendations();
    }
}

/**
 * Get default recommendations when no profile or on error
 */
function getDefaultRecommendations(): AIRecommendation[] {
    return [
        {
            type: 'workout',
            title: '🏋️ Start Your Fitness Journey',
            message: `Begin with a balanced routine: 3 days of strength training and 2-3 days of cardio. Focus on proper form before increasing weight or intensity. Consider working with a trainer for the first few sessions to learn correct techniques.`,
            priority: 'medium',
        },
        {
            type: 'nutrition',
            title: '🥙 Nutrition Foundations',
            message: `Track your meals to understand your eating patterns. Aim for whole foods, lean proteins, vegetables, and complex carbs. Stay hydrated with 8-10 glasses of water daily. Avoid processed foods and sugary drinks.`,
            priority: 'medium',
        },
        {
            type: 'recovery',
            title: '😴 Rest & Recovery',
            message: `Rest is crucial! Aim for 7-9 hours of sleep nightly. Include rest days in your routine and consider activities like stretching or light walking on recovery days. Your body needs time to repair and grow stronger.`,
            priority: 'medium',
        },
        {
            type: 'health',
            title: '❤️ Complete Your Profile',
            message: `Complete your profile with height, weight, age, and goals to receive personalized AI-powered recommendations tailored to your specific needs. The more details you provide, the better we can help you!`,
            priority: 'high',
        },
    ];
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
