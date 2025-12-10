

//import { getNutritionFromUSDA } from './clarifaiService';
//import { getNutritionFromFoodName } from './calorieNinjasService';
import geminiService from './geminiService';

export interface UnifiedNutritionData {
    foodName: string;
    brandName?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar?: number;
    servingSize: string;
    source: 'gemini-usda' | 'gemini-estimate' | 'usda' | 'calorieninjas' | 'mock';
}


export async function analyzePhotoNutrition(imageUri: string): Promise<UnifiedNutritionData> {
    try {
        const nutrition = await geminiService.analyzePhotoForNutrition(imageUri);

        return {
            foodName: nutrition.foodName,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            fiber: nutrition.fiber,
            sodium: nutrition.sodium || 0,
            sugar: nutrition.sugar,
            servingSize: '1 serving',
            source: nutrition.source,
        };
    } catch (error) {
        console.error(' AI photo analysis error:', error);
        return getMockNutritionData('Photo Meal');
    }
}

// Helper function to get nutrition from USDA API
const getNutritionFromUSDA = async (foodText: string): Promise<any> => {
    // This is a placeholder - you can integrate with USDA API later
    return getMockNutritionData(foodText);
};

export const analyzeManualEntry = async (foodText: string): Promise<UnifiedNutritionData> => {
    try {
        const nutrition = await getNutritionFromUSDA(foodText);
        return {
            foodName: nutrition.foodName,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            fiber: nutrition.fiber,
            sodium: nutrition.sodium,
            sugar: nutrition.sugar,
            servingSize: '1 serving (100g)',
            source: 'usda',
        };
    } catch (error) {
        console.error('Manual entry analysis error:', error);
        return getMockNutritionData(foodText);
    }
};

export const analyzeBarcodeNutrition = async (barcode: string): Promise<UnifiedNutritionData> => {
    return getMockNutritionData('Scanned Product');
};

const getMockNutritionData = (foodName: string): UnifiedNutritionData => {
    return {
        foodName: foodName,
        calories: 420,
        protein: 25,
        carbs: 45,
        fat: 15,
        fiber: 8,
        sodium: 500,
        sugar: 5,
        servingSize: '1 serving',
        source: 'mock',
    };
};
