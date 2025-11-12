

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
        console.log('Analyzing photo with REAL AI (Google Gemini)...');
        const nutrition = await geminiService.analyzePhotoForNutrition(imageUri);
        console.log(` AI identified: ${nutrition.foodName} (${nutrition.source})`);

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

export const analyzeManualEntry = async (foodText: string): Promise<UnifiedNutritionData> => {
    try {
        console.log(' Searching for:', foodText);
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
    console.log('Barcode scanning not yet implemented. Barcode:', barcode);
    return getMockNutritionData('Scanned Product');
};

const getMockNutritionData = (foodName: string): UnifiedNutritionData => {
    console.log(`Using mock data for: ${foodName}`);
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
