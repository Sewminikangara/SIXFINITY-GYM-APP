/**
 * Nutritionix API Service - Photo Recognition & Food Analysis
 */

interface NutritionixConfig {
    appId: string;
    appKey: string;
    baseUrl: string;
}

interface NutritionData {
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar: number;
    servingSize: string;
}

const config: NutritionixConfig = {
    appId: process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID || '',
    appKey: process.env.EXPO_PUBLIC_NUTRITIONIX_APP_KEY || '',
    baseUrl: 'https://trackapi.nutritionix.com/v2',
};

console.log('Nutritionix Config:', {
    hasAppId: !!config.appId,
    hasAppKey: !!config.appKey,
    appId: config.appId,
});

export const analyzePhotoWithNutritionix = async (
    imageUri: string
): Promise<NutritionData> => {
    try {
        const foodQuery = 'mixed meal with protein and vegetables';

        const response = await fetch(`${config.baseUrl}/natural/nutrients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': config.appId,
                'x-app-key': config.appKey,
                'x-remote-user-id': '0',
            },
            body: JSON.stringify({
                query: foodQuery,
            }),
        });

        if (!response.ok) {
            throw new Error(`Nutritionix API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract nutrition from first food item
        const food = data.foods[0];

        return {
            foodName: food.food_name || 'Unknown Food',
            calories: Math.round(food.nf_calories || 0),
            protein: Math.round(food.nf_protein || 0),
            carbs: Math.round(food.nf_total_carbohydrate || 0),
            fat: Math.round(food.nf_total_fat || 0),
            fiber: Math.round(food.nf_dietary_fiber || 0),
            sodium: Math.round(food.nf_sodium || 0),
            sugar: Math.round(food.nf_sugars || 0),
            servingSize: `${food.serving_qty} ${food.serving_unit}`,
        };
    } catch (error) {
        console.error('Nutritionix API error:', error);
        throw error;
    }
};

/**
 * Search for food by name (for autocomplete/suggestions)
 */
export const searchFood = async (query: string): Promise<any[]> => {
    try {
        const response = await fetch(
            `${config.baseUrl}/search/instant?query=${encodeURIComponent(query)}`,
            {
                headers: {
                    'x-app-id': config.appId,
                    'x-app-key': config.appKey,
                    'x-remote-user-id': '0',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Nutritionix search error: ${response.status}`);
        }

        const data = await response.json();
        return data.common || [];
    } catch (error) {
        console.error('Nutritionix search error:', error);
        throw error;
    }
};

/**
 * Get detailed nutrition for specific food item
 */
export const getFoodNutrition = async (foodName: string): Promise<NutritionData> => {
    try {
        const response = await fetch(`${config.baseUrl}/natural/nutrients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': config.appId,
                'x-app-key': config.appKey,
                'x-remote-user-id': '0',
            },
            body: JSON.stringify({
                query: foodName,
            }),
        });

        if (!response.ok) {
            throw new Error(`Nutritionix API error: ${response.status}`);
        }

        const data = await response.json();
        const food = data.foods[0];

        return {
            foodName: food.food_name || foodName,
            calories: Math.round(food.nf_calories || 0),
            protein: Math.round(food.nf_protein || 0),
            carbs: Math.round(food.nf_total_carbohydrate || 0),
            fat: Math.round(food.nf_total_fat || 0),
            fiber: Math.round(food.nf_dietary_fiber || 0),
            sodium: Math.round(food.nf_sodium || 0),
            sugar: Math.round(food.nf_sugars || 0),
            servingSize: `${food.serving_qty} ${food.serving_unit}`,
        };
    } catch (error) {
        console.error('Nutritionix nutrition error:', error);
        throw error;
    }
};

export default {
    analyzePhotoWithNutritionix,
    searchFood,
    getFoodNutrition,
};
