import { supabase } from '@/config/supabaseClient';

export interface MealPlan {
    id: string;
    user_id: string;
    week_start_date: string;
    week_end_date: string;
    total_weekly_calories: number;
    is_ai_generated: boolean;
    created_at: string;
    updated_at: string;
}

export interface DailyMealPlan {
    id: string;
    meal_plan_id: string;
    date: string;
    day_of_week: string;
    breakfast_meal_id?: string;
    lunch_meal_id?: string;
    dinner_meal_id?: string;
    snack_meal_ids?: string[];
    total_calories: number;
    total_protein_grams: number;
    total_carbs_grams: number;
    total_fats_grams: number;
    is_completed: boolean;
    adherence_percentage: number;
}

export interface ShoppingListItem {
    id: string;
    user_id: string;
    meal_plan_id?: string;
    ingredient_name: string;
    quantity: string;
    unit: string;
    is_purchased: boolean;
    category: 'protein' | 'carbs' | 'vegetables' | 'fruits' | 'dairy' | 'other';
    created_at: string;
}

export interface MealCategory {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
}

// Get meal categories
export async function getMealCategories(): Promise<MealCategory[]> {
    return [
        { id: '1', name: 'Vegetarian', description: 'Plant-based meals', color: '#00ff7f', icon: 'leaf' },
        { id: '2', name: 'High Protein', description: 'Muscle building meals', color: '#ff6b6b', icon: 'fitness' },
        { id: '3', name: 'High Carb', description: 'Energy-rich meals', color: '#feca57', icon: 'flash' },
        { id: '4', name: 'Low Carb', description: 'Keto-friendly meals', color: '#48dbfb', icon: 'snow' },
        { id: '5', name: 'Balanced', description: 'Well-rounded nutrition', color: '#ff9ff3', icon: 'nutrition' },
    ];
}

// Generate AI meal plan for the week
export async function generateWeeklyMealPlan(
    userId: string,
    goalType: 'muscle_gain' | 'fat_loss' | 'maintenance',
    budget: 'low' | 'medium' | 'high',
    dietaryRestrictions: string[]
): Promise<MealPlan> {
    // For now, return mock data
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const mockPlan: MealPlan = {
        id: `plan-${Date.now()}`,
        user_id: userId,
        week_start_date: weekStart.toISOString().split('T')[0],
        week_end_date: weekEnd.toISOString().split('T')[0],
        total_weekly_calories: goalType === 'muscle_gain' ? 17500 : goalType === 'fat_loss' ? 14000 : 16000,
        is_ai_generated: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    return mockPlan;
}

// Get shopping list for meal plan
export async function getShoppingList(userId: string, mealPlanId?: string): Promise<ShoppingListItem[]> {
    // Mock shopping list
    return [
        {
            id: '1',
            user_id: userId,
            meal_plan_id: mealPlanId,
            ingredient_name: 'Chicken Breast',
            quantity: '1',
            unit: 'kg',
            is_purchased: false,
            category: 'protein',
            created_at: new Date().toISOString(),
        },
        {
            id: '2',
            user_id: userId,
            meal_plan_id: mealPlanId,
            ingredient_name: 'Brown Rice',
            quantity: '500',
            unit: 'g',
            is_purchased: true,
            category: 'carbs',
            created_at: new Date().toISOString(),
        },
        {
            id: '3',
            user_id: userId,
            meal_plan_id: mealPlanId,
            ingredient_name: 'Broccoli',
            quantity: '300',
            unit: 'g',
            is_purchased: true,
            category: 'vegetables',
            created_at: new Date().toISOString(),
        },
        {
            id: '4',
            user_id: userId,
            meal_plan_id: mealPlanId,
            ingredient_name: 'Sweet Potato',
            quantity: '2',
            unit: 'pieces',
            is_purchased: false,
            category: 'carbs',
            created_at: new Date().toISOString(),
        },
        {
            id: '5',
            user_id: userId,
            meal_plan_id: mealPlanId,
            ingredient_name: 'Salmon Fillet',
            quantity: '500',
            unit: 'g',
            is_purchased: false,
            category: 'protein',
            created_at: new Date().toISOString(),
        },
        {
            id: '6',
            user_id: userId,
            meal_plan_id: mealPlanId,
            ingredient_name: 'Eggs',
            quantity: '12',
            unit: 'pieces',
            is_purchased: false,
            category: 'protein',
            created_at: new Date().toISOString(),
        },
    ];
}

// Toggle shopping list item purchased status
export async function toggleShoppingItemPurchased(itemId: string, isPurchased: boolean): Promise<void> {
    console.log(`Toggle item ${itemId} purchased: ${isPurchased}`);
}

// Add item to shopping list
export async function addShoppingListItem(
    userId: string,
    ingredient: string,
    quantity: string,
    unit: string,
    category: ShoppingListItem['category']
): Promise<ShoppingListItem> {
    const newItem: ShoppingListItem = {
        id: `item-${Date.now()}`,
        user_id: userId,
        ingredient_name: ingredient,
        quantity,
        unit,
        is_purchased: false,
        category,
        created_at: new Date().toISOString(),
    };

    return newItem;
}

// Get daily meal plans for the week
export async function getWeeklyDailyPlans(mealPlanId: string): Promise<DailyMealPlan[]> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mockPlans: DailyMealPlan[] = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - date.getDay() + i);

        mockPlans.push({
            id: `daily-${i}`,
            meal_plan_id: mealPlanId,
            date: date.toISOString().split('T')[0],
            day_of_week: days[i],
            total_calories: 2200 + Math.floor(Math.random() * 400),
            total_protein_grams: 150 + Math.floor(Math.random() * 50),
            total_carbs_grams: 200 + Math.floor(Math.random() * 100),
            total_fats_grams: 60 + Math.floor(Math.random() * 20),
            is_completed: i < date.getDay(),
            adherence_percentage: i < date.getDay() ? 80 + Math.floor(Math.random() * 20) : 0,
        });
    }

    return mockPlans;
}

export default {
    getMealCategories,
    generateWeeklyMealPlan,
    getShoppingList,
    toggleShoppingItemPurchased,
    addShoppingListItem,
    getWeeklyDailyPlans,
};
