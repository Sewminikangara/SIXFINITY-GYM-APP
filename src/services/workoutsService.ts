/**
 * WORKOUTS SERVICE
 * Complete backend service for all workout-related operations
 * Production-ready with error handling, type safety, and progress tracking
 */

import { supabase } from '../config/supabaseClient';

// =============================================
// TYPES & INTERFACES
// =============================================

export interface Workout {
    id: string;
    name: string;
    description?: string;
    thumbnail_url?: string;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    duration_minutes: number;
    category: string;
    muscle_groups: string[];
    equipment_needed: string[];
    total_exercises: number;
    estimated_calories: number;
    goal_tags: string[];
    intensity_level: number;
    is_active: boolean;
    is_featured: boolean;
    created_by?: string;
    trainer_id?: string;
    created_at: string;
    updated_at: string;
    exercises?: WorkoutExercise[];
    trainer?: {
        id: string;
        full_name: string;
        profile_photo_url?: string;
    };
}

export interface WorkoutExercise {
    id: string;
    workout_id: string;
    exercise_name: string;
    exercise_order: number;
    sets: number;
    reps: number;
    rest_seconds: number;
    gif_url?: string;
    video_url?: string;
    instructions?: string;
    tips?: string;
    muscle_groups: string[];
    created_at: string;
}

export interface WorkoutSession {
    id: string;
    user_id: string;
    workout_id?: string;
    plan_id?: string;
    started_at?: string;
    completed_at?: string;
    duration_seconds?: number;
    total_exercises: number;
    completed_exercises: number;
    total_sets: number;
    completed_sets: number;
    calories_burned?: number;
    avg_heart_rate?: number;
    max_heart_rate?: number;
    status: 'in_progress' | 'completed' | 'abandoned';
    session_notes?: string;
    fatigue_level?: number;
    created_at: string;
    updated_at: string;
    workout?: Workout;
    exercises?: WorkoutSessionExercise[];
}

export interface WorkoutSessionExercise {
    id: string;
    session_id: string;
    exercise_id?: string;
    exercise_name: string;
    exercise_order?: number;
    sets_completed: number;
    sets_data?: {
        set: number;
        reps: number;
        weight?: number;
        completed: boolean;
    }[];
    rest_time_seconds?: number;
    exercise_duration_seconds?: number;
    is_completed: boolean;
    skipped: boolean;
    created_at: string;
}

export interface UserWorkoutPlan {
    id: string;
    user_id: string;
    plan_name: string;
    description?: string;
    duration_weeks?: number;
    workouts_per_week?: number;
    total_workouts: number;
    completed_workouts: number;
    progress_percentage: number;
    is_active: boolean;
    started_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    items?: UserWorkoutPlanItem[];
}

export interface UserWorkoutPlanItem {
    id: string;
    plan_id: string;
    workout_id?: string;
    day_of_week?: number;
    week_number?: number;
    workout_order?: number;
    is_completed: boolean;
    completed_at?: string;
    created_at: string;
    workout?: Workout;
}

export interface WorkoutFilters {
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    minDuration?: number;
    maxDuration?: number;
    muscleGroup?: string;
    equipment?: string;
    goalTag?: string;
    isFeatured?: boolean;
    searchQuery?: string;
}

// =============================================
// WORKOUTS - GET & SEARCH
// =============================================

/**
 * Get all workouts with optional filters
 */
export const getWorkouts = async (filters?: WorkoutFilters): Promise<Workout[]> => {
    try {
        let query = supabase
            .from('workouts')
            .select(`
        *,
        trainer:trainers(id, full_name, profile_photo_url)
      `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.category) {
            query = query.eq('category', filters.category);
        }

        if (filters?.difficulty) {
            query = query.eq('difficulty_level', filters.difficulty);
        }

        if (filters?.minDuration) {
            query = query.gte('duration_minutes', filters.minDuration);
        }

        if (filters?.maxDuration) {
            query = query.lte('duration_minutes', filters.maxDuration);
        }

        if (filters?.muscleGroup) {
            query = query.contains('muscle_groups', [filters.muscleGroup]);
        }

        if (filters?.equipment) {
            query = query.contains('equipment_needed', [filters.equipment]);
        }

        if (filters?.goalTag) {
            query = query.contains('goal_tags', [filters.goalTag]);
        }

        if (filters?.isFeatured !== undefined) {
            query = query.eq('is_featured', filters.isFeatured);
        }

        if (filters?.searchQuery) {
            query = query.or(
                `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
            );
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching workouts:', error);
        throw error;
    }
};

/**
 * Get workouts by category
 */
export const getWorkoutsByCategory = async (category: string): Promise<Workout[]> => {
    return getWorkouts({ category });
};

/**
 * Get featured workouts
 */
export const getFeaturedWorkouts = async (limit: number = 10): Promise<Workout[]> => {
    try {
        const { data, error } = await supabase
            .from('workouts')
            .select(`
        *,
        trainer:trainers(id, full_name, profile_photo_url)
      `)
            .eq('is_active', true)
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching featured workouts:', error);
        throw error;
    }
};

/**
 * Get workout by ID with all exercises
 */
export const getWorkoutById = async (workoutId: string): Promise<Workout | null> => {
    try {
        const { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .select(`
        *,
        trainer:trainers(id, full_name, profile_photo_url)
      `)
            .eq('id', workoutId)
            .single();

        if (workoutError) throw workoutError;

        // Get exercises for this workout
        const { data: exercises, error: exercisesError } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('workout_id', workoutId)
            .order('exercise_order', { ascending: true });

        if (exercisesError) throw exercisesError;

        return {
            ...workout,
            exercises: exercises || [],
        };
    } catch (error) {
        console.error('Error fetching workout:', error);
        throw error;
    }
};

/**
 * Get recommended workouts based on user profile/goals
 */
export const getRecommendedWorkouts = async (
    userGoals?: string[],
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced'
): Promise<Workout[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get user's recent workout history to understand preferences
        const { data: recentSessions } = await supabase
            .from('workout_sessions')
            .select('workout_id')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(10);

        const completedWorkoutIds = recentSessions?.map((s) => s.workout_id) || [];

        let query = supabase
            .from('workouts')
            .select(`
        *,
        trainer:trainers(id, full_name, profile_photo_url)
      `)
            .eq('is_active', true);

        // Filter by fitness level if provided
        if (fitnessLevel) {
            query = query.eq('difficulty_level', fitnessLevel);
        }

        // Filter by goals if provided
        if (userGoals && userGoals.length > 0) {
            query = query.overlaps('goal_tags', userGoals);
        }

        // Exclude recently completed workouts
        if (completedWorkoutIds.length > 0) {
            query = query.not('id', 'in', `(${completedWorkoutIds.join(',')})`);
        }

        query = query.order('is_featured', { ascending: false }).limit(10);

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching recommended workouts:', error);
        throw error;
    }
};

// =============================================
// WORKOUT SESSIONS - TRACKING & PROGRESS
// =============================================

/**
 * Start a new workout session
 */
export const startWorkoutSession = async (
    workoutId: string,
    planId?: string
): Promise<WorkoutSession> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get workout details
        const workout = await getWorkoutById(workoutId);
        if (!workout) throw new Error('Workout not found');

        // Create session
        const { data: session, error: sessionError } = await supabase
            .from('workout_sessions')
            .insert({
                user_id: user.id,
                workout_id: workoutId,
                plan_id: planId,
                started_at: new Date().toISOString(),
                status: 'in_progress',
                total_exercises: workout.total_exercises,
                completed_exercises: 0,
                total_sets: workout.exercises?.reduce((sum, ex) => sum + ex.sets, 0) || 0,
                completed_sets: 0,
            })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // Create session exercises
        if (workout.exercises && workout.exercises.length > 0) {
            const sessionExercises = workout.exercises.map((exercise) => ({
                session_id: session.id,
                exercise_id: exercise.id,
                exercise_name: exercise.exercise_name,
                exercise_order: exercise.exercise_order,
                sets_completed: 0,
                sets_data: [],
                is_completed: false,
                skipped: false,
            }));

            await supabase.from('workout_session_exercises').insert(sessionExercises);
        }

        return session;
    } catch (error) {
        console.error('Error starting workout session:', error);
        throw error;
    }
};

/**
 * Update exercise progress during workout
 */
export const updateExerciseProgress = async (
    sessionId: string,
    exerciseId: string,
    setData: {
        set: number;
        reps: number;
        weight?: number;
        completed: boolean;
    }
): Promise<void> => {
    try {
        // Get current exercise data
        const { data: exercise, error: fetchError } = await supabase
            .from('workout_session_exercises')
            .select('sets_data, sets_completed')
            .eq('session_id', sessionId)
            .eq('exercise_id', exerciseId)
            .single();

        if (fetchError) throw fetchError;

        const setsData = exercise.sets_data || [];
        const existingSetIndex = setsData.findIndex((s: any) => s.set === setData.set);

        if (existingSetIndex >= 0) {
            setsData[existingSetIndex] = setData;
        } else {
            setsData.push(setData);
        }

        const setsCompleted = setsData.filter((s: any) => s.completed).length;

        // Update exercise
        const { error: updateError } = await supabase
            .from('workout_session_exercises')
            .update({
                sets_data: setsData,
                sets_completed: setsCompleted,
            })
            .eq('session_id', sessionId)
            .eq('exercise_id', exerciseId);

        if (updateError) throw updateError;

        // Update session's total completed sets
        const { data: allExercises } = await supabase
            .from('workout_session_exercises')
            .select('sets_completed')
            .eq('session_id', sessionId);

        const totalCompletedSets = allExercises?.reduce(
            (sum, ex) => sum + ex.sets_completed,
            0
        ) || 0;

        await supabase
            .from('workout_sessions')
            .update({ completed_sets: totalCompletedSets })
            .eq('id', sessionId);
    } catch (error) {
        console.error('Error updating exercise progress:', error);
        throw error;
    }
};

/**
 * Mark exercise as completed
 */
export const completeExercise = async (
    sessionId: string,
    exerciseId: string
): Promise<void> => {
    try {
        await supabase
            .from('workout_session_exercises')
            .update({ is_completed: true })
            .eq('session_id', sessionId)
            .eq('exercise_id', exerciseId);

        // Update session's completed exercises count
        const { data: allExercises } = await supabase
            .from('workout_session_exercises')
            .select('is_completed')
            .eq('session_id', sessionId);

        const completedCount = allExercises?.filter((ex) => ex.is_completed).length || 0;

        await supabase
            .from('workout_sessions')
            .update({ completed_exercises: completedCount })
            .eq('id', sessionId);
    } catch (error) {
        console.error('Error completing exercise:', error);
        throw error;
    }
};

/**
 * Complete entire workout session
 */
export const completeWorkout = async (
    sessionId: string,
    sessionData: {
        notes?: string;
        caloriesBurned?: number;
        avgHeartRate?: number;
        maxHeartRate?: number;
        fatigueLevel?: number;
    }
): Promise<WorkoutSession> => {
    try {
        const { data: session, error: fetchError } = await supabase
            .from('workout_sessions')
            .select('started_at')
            .eq('id', sessionId)
            .single();

        if (fetchError) throw fetchError;

        const completedAt = new Date();
        const startedAt = new Date(session.started_at);
        const durationSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);

        const { data, error } = await supabase
            .from('workout_sessions')
            .update({
                completed_at: completedAt.toISOString(),
                duration_seconds: durationSeconds,
                status: 'completed',
                session_notes: sessionData.notes,
                calories_burned: sessionData.caloriesBurned,
                avg_heart_rate: sessionData.avgHeartRate,
                max_heart_rate: sessionData.maxHeartRate,
                fatigue_level: sessionData.fatigueLevel,
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error completing workout:', error);
        throw error;
    }
};

/**
 * Abandon workout session
 */
export const abandonWorkout = async (sessionId: string): Promise<void> => {
    try {
        await supabase
            .from('workout_sessions')
            .update({ status: 'abandoned' })
            .eq('id', sessionId);
    } catch (error) {
        console.error('Error abandoning workout:', error);
        throw error;
    }
};

/**
 * Get user's workout history
 */
export const getWorkoutHistory = async (
    limit?: number,
    offset?: number
): Promise<WorkoutSession[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        let query = supabase
            .from('workout_sessions')
            .select(`
        *,
        workout:workouts(*)
      `)
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false });

        if (limit) query = query.limit(limit);
        if (offset) query = query.range(offset, offset + (limit || 10) - 1);

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching workout history:', error);
        throw error;
    }
};

/**
 * Get workout session details with exercises
 */
export const getSessionDetails = async (sessionId: string): Promise<WorkoutSession | null> => {
    try {
        const { data: session, error: sessionError } = await supabase
            .from('workout_sessions')
            .select(`
        *,
        workout:workouts(*)
      `)
            .eq('id', sessionId)
            .single();

        if (sessionError) throw sessionError;

        const { data: exercises, error: exercisesError } = await supabase
            .from('workout_session_exercises')
            .select('*')
            .eq('session_id', sessionId)
            .order('exercise_order', { ascending: true });

        if (exercisesError) throw exercisesError;

        return {
            ...session,
            exercises: exercises || [],
        };
    } catch (error) {
        console.error('Error fetching session details:', error);
        throw error;
    }
};

// =============================================
// WORKOUT PLANS
// =============================================

/**
 * Get user's workout plans
 */
export const getMyWorkoutPlans = async (activeOnly: boolean = false): Promise<UserWorkoutPlan[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        let query = supabase
            .from('user_workout_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching workout plans:', error);
        throw error;
    }
};

/**
 * Create a new workout plan
 */
export const createWorkoutPlan = async (planData: {
    planName: string;
    description?: string;
    durationWeeks?: number;
    workoutsPerWeek?: number;
    workouts: {
        workoutId: string;
        dayOfWeek: number;
        weekNumber: number;
        workoutOrder: number;
    }[];
}): Promise<UserWorkoutPlan> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Create plan
        const { data: plan, error: planError } = await supabase
            .from('user_workout_plans')
            .insert({
                user_id: user.id,
                plan_name: planData.planName,
                description: planData.description,
                duration_weeks: planData.durationWeeks,
                workouts_per_week: planData.workoutsPerWeek,
                total_workouts: planData.workouts.length,
                completed_workouts: 0,
                progress_percentage: 0,
                is_active: true,
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (planError) throw planError;

        // Create plan items
        const planItems = planData.workouts.map((workout) => ({
            plan_id: plan.id,
            workout_id: workout.workoutId,
            day_of_week: workout.dayOfWeek,
            week_number: workout.weekNumber,
            workout_order: workout.workoutOrder,
            is_completed: false,
        }));

        await supabase.from('user_workout_plan_items').insert(planItems);

        return plan;
    } catch (error) {
        console.error('Error creating workout plan:', error);
        throw error;
    }
};

/**
 * Get workout statistics
 */
export const getWorkoutStats = async (dateRange?: { start: string; end: string }) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        let query = supabase
            .from('workout_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed');

        if (dateRange) {
            query = query
                .gte('completed_at', dateRange.start)
                .lte('completed_at', dateRange.end);
        }

        const { data: sessions, error } = await query;

        if (error) throw error;

        const totalWorkouts = sessions?.length || 0;
        const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
        const totalCalories = sessions?.reduce((sum, s) => sum + (s.calories_burned || 0), 0) || 0;
        const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

        return {
            totalWorkouts,
            totalDuration,
            totalCalories,
            avgDuration,
        };
    } catch (error) {
        console.error('Error fetching workout stats:', error);
        throw error;
    }
};
