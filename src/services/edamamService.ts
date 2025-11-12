/**
 * Edamam Nutrition Analysis API - Manual Food Entry
 * 
 */

interface EdamamConfig {
    appId: string;
    appKey: string;
    baseUrl: string;
}

interface EdamamNutritionData {
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar: number;
    servingSize: string;
    weight: number;
}

// Configuration - Add your API keys to .env file
const config: EdamamConfig = {
    appId: process.env.EXPO_PUBLIC_EDAMAM_APP_ID || '',
    appKey: process.env.EXPO_PUBLIC_EDAMAM_APP_KEY || '',
    baseUrl: 'https://api.edamam.com/api/nutrition-data',
};

/**
 * Analyze nutrition from food description
 * Example: "1 cup rice and 3 oz chicken breast"
 */
export const analyzeNutritionFromText = async (
    foodText: string
): Promise<EdamamNutritionData> => {
    try {
        const url = `${config.baseUrl}?app_id=${config.appId}&app_key=${config.appKey}&nutrition-type=cooking&ingr=${encodeURIComponent(foodText)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Edamam API error: ${response.status}`);
        }

        const data = await response.json();

        // Check if we got valid nutrition data
        if (!data.totalNutrients || data.calories === 0) {
            throw new Error('No nutrition data found for this food');
        }

        return {
            foodName: foodText,
            calories: Math.round(data.calories || 0),
            protein: Math.round(data.totalNutrients?.PROCNT?.quantity || 0),
            carbs: Math.round(data.totalNutrients?.CHOCDF?.quantity || 0),
            fat: Math.round(data.totalNutrients?.FAT?.quantity || 0),
            fiber: Math.round(data.totalNutrients?.FIBTG?.quantity || 0),
            sodium: Math.round(data.totalNutrients?.NA?.quantity || 0),
            sugar: Math.round(data.totalNutrients?.SUGAR?.quantity || 0),
            servingSize: '1 serving',
            weight: Math.round(data.totalWeight || 0),
        };
    } catch (error) {
        console.error('Edamam API error:', error);
        throw error;
    }
};

/**
 * Analyze nutrition for recipe (multiple ingredients)
 */
export const analyzeRecipe = async (
    ingredients: string[]
): Promise<EdamamNutritionData> => {
    try {
        const response = await fetch('https://api.edamam.com/api/nutrition-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                app_id: config.appId,
                app_key: config.appKey,
                title: 'Custom Recipe',
                ingr: ingredients,
            }),
        });

        if (!response.ok) {
            throw new Error(`Edamam recipe API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            foodName: 'Custom Recipe',
            calories: Math.round(data.calories || 0),
            protein: Math.round(data.totalNutrients?.PROCNT?.quantity || 0),
            carbs: Math.round(data.totalNutrients?.CHOCDF?.quantity || 0),
            fat: Math.round(data.totalNutrients?.FAT?.quantity || 0),
            fiber: Math.round(data.totalNutrients?.FIBTG?.quantity || 0),
            sodium: Math.round(data.totalNutrients?.NA?.quantity || 0),
            sugar: Math.round(data.totalNutrients?.SUGAR?.quantity || 0),
            servingSize: `${ingredients.length} ingredients`,
            weight: Math.round(data.totalWeight || 0),
        };
    } catch (error) {
        console.error('Edamam recipe API error:', error);
        throw error;
    }
};

/**
 * Parse food text into structured format
 */
export const parseFood = async (foodText: string): Promise<any> => {
    try {
        const response = await fetch(
            `https://api.edamam.com/auto-complete?app_id=${config.appId}&app_key=${config.appKey}&q=${encodeURIComponent(foodText)}`,
            {
                method: 'GET',
            }
        );

        if (!response.ok) {
            throw new Error(`Edamam parse error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Edamam parse error:', error);
        throw error;
    }
};

export default {
    analyzeNutritionFromText,
    analyzeRecipe,
    parseFood,
};
