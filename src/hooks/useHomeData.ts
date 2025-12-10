/**
 * Custom hook for HOME Dashboard data
 * Manages all state and data fetching for the home screen
 * Includes REAL-TIME step tracking from device pedometer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
    getDailyQuote,
    getDailySummary,
    getAIRecommendations,
    getTodaySchedule,
    getWeeklyProgress,
    startTrackingActiveMinutes,
    stopTrackingActiveMinutes,
    subscribeToStepUpdates,
    isPedometerAvailable,
    type DailySummary,
    type AIRecommendation,
    type TodaySchedule,
    type WeeklyProgress,
} from '@/services/homeService';

export interface HomeData {
    quote: string;
    summary: DailySummary;
    recommendations: AIRecommendation[];
    schedule: TodaySchedule;
    progress: WeeklyProgress;
}

export function useHomeData(userId: string | null) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pedometerAvailable, setPedometerAvailable] = useState(false);
    const stepSubscriptionRef = useRef<any>(null);
    const [data, setData] = useState<HomeData>({
        quote: '',
        summary: {
            steps: 0,
            caloriesBurned: 0,
            workoutsCompleted: 0,
            activeMinutes: 0,
            date: new Date().toISOString().split('T')[0],
        },
        recommendations: [],
        schedule: {
            gymBookings: [],
            trainerSessions: [],
            plannedWorkouts: [],
        },
        progress: {
            dates: [],
            weight: [],
            steps: [],
            calories: [],
            waterIntake: [],
            goalWeight: 0,
            goalSteps: 10000,
            goalCalories: 2500,
        },
    });

    // Check if pedometer is available
    useEffect(() => {
        isPedometerAvailable().then(available => {
            setPedometerAvailable(available);
            console.log('📱 Pedometer available:', available);
        });
    }, []);

    // Subscribe to real-time step updates
    useEffect(() => {
        if (!userId || !pedometerAvailable) return;

        console.log('📊 Starting real-time step tracking...');

        stepSubscriptionRef.current = subscribeToStepUpdates((newSteps) => {
            console.log('👟 Steps updated:', newSteps);
            setData(prevData => ({
                ...prevData,
                summary: {
                    ...prevData.summary,
                    steps: newSteps,
                },
            }));
        });

        return () => {
            if (stepSubscriptionRef.current) {
                console.log('📊 Stopping step tracking...');
                stepSubscriptionRef.current.remove();
            }
        };
    }, [userId, pedometerAvailable]);

    // Load all data
    const loadData = useCallback(async (isRefresh = false) => {
        if (!userId) return;

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Fetch all data in parallel, force refresh AI recommendations on pull-to-refresh
            const [quote, summary, recommendations, schedule, progress] = await Promise.all([
                getDailyQuote(),
                getDailySummary(userId),
                getAIRecommendations(userId, isRefresh), // Force refresh when user pulls to refresh
                getTodaySchedule(userId),
                getWeeklyProgress(userId),
            ]);

            setData({
                quote,
                summary,
                recommendations,
                schedule,
                progress,
            });
        } catch (err) {
            console.error('Error loading home data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Track active minutes when app state changes
    useEffect(() => {
        if (!userId) return;

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                startTrackingActiveMinutes();
                // Refresh data when app becomes active
                loadData();
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                stopTrackingActiveMinutes(userId);
            }
        });

        // Start tracking on mount
        startTrackingActiveMinutes();

        return () => {
            subscription.remove();
            stopTrackingActiveMinutes(userId);
        };
    }, [userId, loadData]);

    // Refresh function for pull-to-refresh
    const refresh = useCallback(() => {
        return loadData(true);
    }, [loadData]);

    return {
        loading,
        refreshing,
        error,
        data,
        refresh,
        pedometerAvailable, // Expose pedometer status
    };
}
