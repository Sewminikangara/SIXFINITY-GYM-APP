/**
 * CalorieNinjas API Service
 * FREE: 10,000 requests/month (much more than Clarifai!)
 * Simple API, no complex authentication
 * Works with food names (we'll use it after user confirms what they see in photo)
 */

export interface CalorieNinjasNutrition {
    name: string;
    calories: number;
    serving_size_g: number;
    fat_total_g: number;
    fat_saturated_g: number;
    protein_g: number;
    sodium_mg: number;
    potassium_mg: number;
    cholesterol_mg: number;
    carbohydrates_total_g: number;
    fiber_g: number;
    sugar_g: number;
}

interface CalorieNinjasResponse {
    items: CalorieNinjasNutrition[];
}

const CALORIENINJAS_API_KEY = process.env.EXPO_PUBLIC_CALORIENINJAS_API_KEY || 'YOUR_API_KEY';
const CALORIENINJAS_API_URL = 'https://api.calorieninjas.com/v1/nutrition';

/**
 * Get nutrition data from food name/description
 * Works better than Clarifai - we skip the image recognition and use USDA for now
 */
export async function getNutritionFromFoodName(foodQuery: string): Promise<CalorieNinjasNutrition> {
    try {
        console.log('🔍 Searching CalorieNinjas for:', foodQuery);
        console.log('🔑 API Key:', CALORIENINJAS_API_KEY.substring(0, 10) + '...');

        const response = await fetch(
            `${CALORIENINJAS_API_URL}?query=${encodeURIComponent(foodQuery)}`,
            {
                method: 'GET',
                headers: {
                    'X-Api-Key': CALORIENINJAS_API_KEY,
                },
            }
        );

        const responseText = await response.text();
        console.log('📡 CalorieNinjas response status:', response.status);

        if (!response.ok) {
            console.error('❌ CalorieNinjas error response:', responseText);
            throw new Error(`CalorieNinjas API error: ${response.status}`);
        }

        const data: CalorieNinjasResponse = JSON.parse(responseText);

        if (!data.items || data.items.length === 0) {
            throw new Error('No nutrition data found for: ' + foodQuery);
        }

        const nutrition = data.items[0];
        console.log('✅ CalorieNinjas nutrition:', nutrition);

        return nutrition;
    } catch (error) {
        console.error('CalorieNinjas error:', error);
        throw error;
    }
}

/**
 * Simple food recognition from image
 * Since Clarifai is having issues, we'll use a simpler approach:
 * 1. Take photo
 * 2. Show user a text input "What food is this?"
 * 3. User types "chicken rice" or similar
 * 4. We get nutrition from CalorieNinjas
 * 
 * This is actually MORE accurate than AI recognition!
 */
export async function analyzePhotoWithUserInput(
    imageUri: string,
    userDescription: string
): Promise<{
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar: number;
}> {
    try {
        const nutrition = await getNutritionFromFoodName(userDescription);

        return {
            foodName: nutrition.name || userDescription,
            calories: nutrition.calories,
            protein: nutrition.protein_g,
            carbs: nutrition.carbohydrates_total_g,
            fat: nutrition.fat_total_g,
            fiber: nutrition.fiber_g,
            sodium: nutrition.sodium_mg / 1000, // Convert mg to g
            sugar: nutrition.sugar_g,
        };
    } catch (error) {
        console.error('Photo analysis with user input error:', error);
        throw error;
    }
}
