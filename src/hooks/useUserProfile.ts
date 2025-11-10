import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    age?: number;
    gender?: string;
    heightCm?: number;
    weightKg?: number;
    goalWeightKg?: number;
    primaryGoal?: string;
    activityLevel?: string;
    bodyType?: string;
    goalTimeline?: string;
    onboardingCompleted: boolean;
    createdAt: string;
}

interface UseUserProfileReturn {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileReturn => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        if (!user?.id) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select(
                    `
          id,
          email,
          full_name,
          age,
          gender,
          height_cm,
          weight_kg,
          goal_weight_kg,
          primary_goal,
          activity_level,
          body_type,
          goal_timeline,
          onboarding_completed,
          created_at
        `,
                )
                .eq('id', user.id)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            if (data) {
                setProfile({
                    id: data.id,
                    email: data.email,
                    fullName: data.full_name || 'User',
                    age: data.age,
                    gender: data.gender,
                    heightCm: data.height_cm,
                    weightKg: data.weight_kg,
                    goalWeightKg: data.goal_weight_kg,
                    primaryGoal: data.primary_goal,
                    activityLevel: data.activity_level,
                    bodyType: data.body_type,
                    goalTimeline: data.goal_timeline,
                    onboardingCompleted: data.onboarding_completed || false,
                    createdAt: data.created_at,
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user?.id]);

    return {
        profile,
        loading,
        error,
        refetch: fetchProfile,
    };
};
