import { supabase } from '@/config/supabaseClient';


export interface Meal {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_name: string | null;
  meal_date: string; // ISO date string
  meal_time: string; // Time string (HH:MM:SS)
  total_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  fiber_grams: number | null;
  sugar_grams: number | null;
  sodium_mg: number | null;
  meal_category: string | null;
  entry_method: 'manual' | 'photo' | 'barcode' | 'ai-suggestion';
  photo_url: string | null;
  barcode_value: string | null;
  ai_detected_foods: any | null;
  ai_confidence_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_name: string;
  food_brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  fiber_grams: number | null;
  sugar_grams: number | null;
  sodium_mg: number | null;
  external_food_id: string | null;
  external_source: string | null;
  created_at: string;
}

export interface DailyNutritionSummary {
  id: string;
  user_id: string;
  date: string;
  total_calories_consumed: number;
  calories_target: number;
  calories_burned: number;
  calories_net: number;
  total_protein_grams: number;
  total_carbs_grams: number;
  total_fats_grams: number;
  total_fiber_grams: number;
  total_sugar_grams: number;
  total_sodium_mg: number;
  protein_target_grams: number | null;
  carbs_target_grams: number | null;
  fats_target_grams: number | null;
  total_water_ml: number;
  water_goal_ml: number;
  meals_logged: number;
  breakfast_logged: boolean;
  lunch_logged: boolean;
  dinner_logged: boolean;
  snacks_count: number;
  workout_duration_minutes: number;
  workout_calories_burned: number;
  goal_met: boolean;
  protein_goal_met: boolean;
  water_goal_met: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMealInput {
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_name?: string;
  meal_date?: string; // ISO date string, defaults to today
  meal_time?: string; // Time string, defaults to now
  total_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  fiber_grams?: number;
  sugar_grams?: number;
  sodium_mg?: number;
  meal_category?: string;
  entry_method: 'manual' | 'photo' | 'barcode' | 'ai-suggestion';
  photo_url?: string;
  barcode_value?: string;
  ai_detected_foods?: any;
  ai_confidence_score?: number;
  notes?: string;
}

export interface CreateMealItemInput {
  meal_id: string;
  food_name: string;
  food_brand?: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  fiber_grams?: number;
  sugar_grams?: number;
  sodium_mg?: number;
  external_food_id?: string;
  external_source?: string;
}

// ============================================
// MEAL CRUD OPERATIONS
// ============================================

/**
 * Create a new meal
 */
export const createMeal = async (input: CreateMealInput): Promise<Meal> => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: input.user_id,
        meal_type: input.meal_type,
        meal_name: input.meal_name || null,
        meal_date: input.meal_date || today,
        meal_time: input.meal_time || currentTime,
        total_calories: input.total_calories,
        protein_grams: input.protein_grams,
        carbs_grams: input.carbs_grams,
        fats_grams: input.fats_grams,
        fiber_grams: input.fiber_grams || null,
        sugar_grams: input.sugar_grams || null,
        sodium_mg: input.sodium_mg || null,
        meal_category: input.meal_category || null,
        entry_method: input.entry_method,
        photo_url: input.photo_url || null,
        barcode_value: input.barcode_value || null,
        ai_detected_foods: input.ai_detected_foods || null,
        ai_confidence_score: input.ai_confidence_score || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Meal;
  } catch (error) {
    console.error('Error creating meal:', error);
    throw new Error('Failed to create meal');
  }
};

/**
 * Get meals for a specific date
 */
export const getMealsByDate = async (
  userId: string,
  date: string
): Promise<Meal[]> => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .eq('meal_date', date)
      .order('meal_time', { ascending: true });

    if (error) throw error;
    return data as Meal[];
  } catch (error) {
    console.error('Error getting meals:', error);
    throw new Error('Failed to get meals');
  }
};

/**
 * Get meals by type for a specific date
 */
export const getMealsByType = async (
  userId: string,
  date: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<Meal[]> => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .eq('meal_date', date)
      .eq('meal_type', mealType)
      .order('meal_time', { ascending: true });

    if (error) throw error;
    return data as Meal[];
  } catch (error) {
    console.error('Error getting meals by type:', error);
    throw new Error('Failed to get meals by type');
  }
};

/**
 * Get a single meal by ID
 */
export const getMealById = async (mealId: string): Promise<Meal | null> => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .single();

    if (error) throw error;
    return data as Meal;
  } catch (error) {
    console.error('Error getting meal:', error);
    return null;
  }
};

/**
 * Update a meal
 */
export const updateMeal = async (
  mealId: string,
  updates: Partial<CreateMealInput>
): Promise<Meal> => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mealId)
      .select()
      .single();

    if (error) throw error;
    return data as Meal;
  } catch (error) {
    console.error('Error updating meal:', error);
    throw new Error('Failed to update meal');
  }
};

/**
 * Delete a meal
 */
export const deleteMeal = async (mealId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('meals').delete().eq('id', mealId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw new Error('Failed to delete meal');
  }
};

// MEAL ITEMS 

/**
 * Add a meal item to a meal
 */
export const addMealItem = async (
  input: CreateMealItemInput
): Promise<MealItem> => {
  try {
    const { data, error } = await supabase
      .from('meal_items')
      .insert({
        meal_id: input.meal_id,
        food_name: input.food_name,
        food_brand: input.food_brand || null,
        serving_size: input.serving_size,
        serving_unit: input.serving_unit,
        calories: input.calories,
        protein_grams: input.protein_grams,
        carbs_grams: input.carbs_grams,
        fats_grams: input.fats_grams,
        fiber_grams: input.fiber_grams || null,
        sugar_grams: input.sugar_grams || null,
        sodium_mg: input.sodium_mg || null,
        external_food_id: input.external_food_id || null,
        external_source: input.external_source || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as MealItem;
  } catch (error) {
    console.error('Error adding meal item:', error);
    throw new Error('Failed to add meal item');
  }
};

/**
 * Get meal items for a meal
 */
export const getMealItems = async (mealId: string): Promise<MealItem[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_items')
      .select('*')
      .eq('meal_id', mealId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as MealItem[];
  } catch (error) {
    console.error('Error getting meal items:', error);
    throw new Error('Failed to get meal items');
  }
};

/**
 * Delete a meal item
 */
export const deleteMealItem = async (itemId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('meal_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting meal item:', error);
    throw new Error('Failed to delete meal item');
  }
};

// DAILY NUTRITION SUMMARY

/**
 * Get daily nutrition summary for a specific date
 */
export const getDailyNutritionSummary = async (
  userId: string,
  date: string
): Promise<DailyNutritionSummary | null> => {
  try {
    const { data, error } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) {
      // If no summary exists, create default one
      if (error.code === 'PGRST116') {
        return createDefaultDailySummary(userId, date);
      }
      throw error;
    }

    return data as DailyNutritionSummary;
  } catch (error) {
    console.error('Error getting daily nutrition summary:', error);
    return null;
  }
};

/**
 * Create default daily nutrition summary
 */
const createDefaultDailySummary = async (
  userId: string,
  date: string
): Promise<DailyNutritionSummary | null> => {
  try {
    const { data, error } = await supabase
      .from('daily_nutrition_summary')
      .insert({
        user_id: userId,
        date: date,
        total_calories_consumed: 0,
        calories_target: 2000, // Default, should be from user profile
        calories_burned: 0,
        total_protein_grams: 0,
        total_carbs_grams: 0,
        total_fats_grams: 0,
        protein_target_grams: 150,
        carbs_target_grams: 200,
        fats_target_grams: 65,
        total_water_ml: 0,
        water_goal_ml: 2000,
        meals_logged: 0,
        breakfast_logged: false,
        lunch_logged: false,
        dinner_logged: false,
        snacks_count: 0,
        workout_duration_minutes: 0,
        workout_calories_burned: 0,
        goal_met: false,
        protein_goal_met: false,
        water_goal_met: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DailyNutritionSummary;
  } catch (error) {
    console.error('Error creating default summary:', error);
    return null;
  }
};

/**
 * Update calorie target based on workout
 */
export const adjustCaloriesForWorkout = async (
  userId: string,
  date: string,
  workoutDurationMinutes: number,
  caloriesBurned: number
): Promise<void> => {
  try {
    // Get current summary
    let summary = await getDailyNutritionSummary(userId, date);

    if (!summary) {
      summary = await createDefaultDailySummary(userId, date);
    }

    if (!summary) return;

    // Calculate new target
    const baseTarget = summary.calories_target - summary.workout_calories_burned; // Remove previous workout adjustment
    const newTarget = baseTarget + caloriesBurned;

    // Update summary
    const { error } = await supabase
      .from('daily_nutrition_summary')
      .update({
        workout_duration_minutes: workoutDurationMinutes,
        workout_calories_burned: caloriesBurned,
        calories_target: newTarget,
        calories_burned: caloriesBurned,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw error;
  } catch (error) {
    console.error('Error adjusting calories for workout:', error);
    throw new Error('Failed to adjust calories for workout');
  }
};

// WATER INTAKE

export interface WaterIntake {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  logged_at: string;
  daily_goal_ml: number;
  created_at: string;
}

/**
 * Add water intake
 */
export const addWaterIntake = async (
  userId: string,
  amountMl: number,
  date?: string
): Promise<WaterIntake> => {
  try {
    const today = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('water_intake')
      .insert({
        user_id: userId,
        date: today,
        amount_ml: amountMl,
        logged_at: new Date().toISOString(),
        daily_goal_ml: 2000, // Default goal
      })
      .select()
      .single();

    if (error) throw error;
    return data as WaterIntake;
  } catch (error) {
    console.error('Error adding water intake:', error);
    throw new Error('Failed to add water intake');
  }
};

/**
 * Get total water intake for a date
 */
export const getTotalWaterIntake = async (
  userId: string,
  date: string
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('water_intake')
      .select('amount_ml')
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw error;

    const total = data.reduce((sum, entry) => sum + entry.amount_ml, 0);
    return total;
  } catch (error) {
    console.error('Error getting water intake:', error);
    return 0;
  }
};

/**
 * Get water intake entries for a date
 */
export const getWaterIntakeEntries = async (
  userId: string,
  date: string
): Promise<WaterIntake[]> => {
  try {
    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('logged_at', { ascending: false });

    if (error) throw error;
    return data as WaterIntake[];
  } catch (error) {
    console.error('Error getting water intake entries:', error);
    return [];
  }
};

// UTILITY FUNCTIONS

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format time for display (HH:MM AM/PM)
 */
export const formatMealTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Calculate total nutrition from meal items
 */
export const calculateMealNutrition = (items: MealItem[]) => {
  return items.reduce(
    (totals, item) => ({
      calories: totals.calories + item.calories,
      protein: totals.protein + item.protein_grams,
      carbs: totals.carbs + item.carbs_grams,
      fats: totals.fats + item.fats_grams,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
};

export default {
  createMeal,
  getMealsByDate,
  getMealsByType,
  getMealById,
  updateMeal,
  deleteMeal,
  addMealItem,
  getMealItems,
  deleteMealItem,
  getDailyNutritionSummary,
  adjustCaloriesForWorkout,
  addWaterIntake,
  getTotalWaterIntake,
  getWaterIntakeEntries,
  getTodayDate,
  formatMealTime,
  calculateMealNutrition,
};
