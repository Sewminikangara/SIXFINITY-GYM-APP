import { supabase } from '@/config/supabaseClient';

export interface FavoriteTrainer {
    id: string;
    user_id: string;
    trainer_id: string;
    created_at: string;
}

/**
 * Add a trainer to favorites
 */
export const addFavoriteTrainer = async (
    userId: string,
    trainerId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { data, error } = await supabase
            .from('favorite_trainers')
            .insert([
                {
                    user_id: userId,
                    trainer_id: trainerId,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding favorite trainer:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error adding favorite trainer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove a trainer from favorites
 */
export const removeFavoriteTrainer = async (
    userId: string,
    trainerId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase
            .from('favorite_trainers')
            .delete()
            .eq('user_id', userId)
            .eq('trainer_id', trainerId);

        if (error) {
            console.error('Error removing favorite trainer:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error removing favorite trainer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if a trainer is in user's favorites
 */
export const isFavoriteTrainer = async (
    userId: string,
    trainerId: string
): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('favorite_trainers')
            .select('id')
            .eq('user_id', userId)
            .eq('trainer_id', trainerId)
            .single();

        if (error) {
            // If no record found, it's not a favorite
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Error checking favorite status:', error);
        return false;
    }
};

/**
 * Get all favorite trainers for a user
 */
export const getFavoriteTrainers = async (userId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('favorite_trainers')
            .select('trainer_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching favorite trainers:', error);
            return [];
        }

        return data?.map((fav) => fav.trainer_id) || [];
    } catch (error) {
        console.error('Error fetching favorite trainers:', error);
        return [];
    }
};

/**
 * Toggle favorite status for a trainer
 */
export const toggleFavoriteTrainer = async (
    userId: string,
    trainerId: string
): Promise<{ success: boolean; isFavorite: boolean; error?: string }> => {
    try {
        const isFav = await isFavoriteTrainer(userId, trainerId);

        if (isFav) {
            const result = await removeFavoriteTrainer(userId, trainerId);
            return { ...result, isFavorite: false };
        } else {
            const result = await addFavoriteTrainer(userId, trainerId);
            return { ...result, isFavorite: true };
        }
    } catch (error: any) {
        console.error('Error toggling favorite trainer:', error);
        return { success: false, isFavorite: false, error: error.message };
    }
};
