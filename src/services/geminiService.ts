/**
 * google Gemini AI for Real Food Recognition
 * Uses Google gemini Vision API to identify food from photos
 * then queries USDA for accurate nutrition data
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import { env } from '@/config/env';

const GEMINI_API_KEY = env.geminiApiKey;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface RecognizedFood {
    foodName: string;
    confidence: number;
    servingSize?: string;
    ingredients?: string[];
}

interface NutritionData {
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium?: number;
    sugar?: number;
    source: 'gemini-usda' | 'gemini-estimate';
}


export async function analyzeFoodImage(imageUri: string): Promise<RecognizedFood[]> {
    try {

        // Convert image to base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
        });

        // Craft detailed prompt for food recognition
        const prompt = `Analyze this food photo and identify all food items visible. 
    
    For each food item, provide:
    1. Food name (be specific: "grilled chicken breast" not just "chicken")
    2. Estimated serving size (e.g., "200g", "1 cup", "1 medium")
    3. Confidence level (0-100)
    
    Return ONLY a JSON array in this exact format:
    [
      {
        "foodName": "grilled chicken breast",
        "servingSize": "200g",
        "confidence": 95
      }
    ]
    
    Be accurate and specific. If you can't identify the food clearly, set lower confidence.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64
                        }
                    }
                ]
            }]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;


        // Parse JSON response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Failed to parse Gemini response');
        }

        const recognizedFoods: RecognizedFood[] = JSON.parse(jsonMatch[0]);


        return recognizedFoods;

    } catch (error) {
        console.error(' Gemini AI Error:', error);
        throw error;
    }
}

/**
 * Get nutrition data from USDA for identified foods
 */
async function getNutritionFromUSDA(foodName: string, servingSize?: string): Promise<any> {
    try {
        const USDA_API_KEY = env.usdaApiKey;
        const query = encodeURIComponent(foodName);

        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${query}&pageSize=1`;


        const response = await fetch(url);
        const data = await response.json();

        if (!data.foods || data.foods.length === 0) {
            throw new Error(`No USDA data found for: ${foodName}`);
        }

        const food = data.foods[0];
        const nutrients = food.foodNutrients;

        // Map USDA nutrient codes
        const getNutrient = (nutrientId: number) => {
            const nutrient = nutrients.find((n: any) => n.nutrientId === nutrientId);
            return nutrient ? nutrient.value : 0;
        };

        return {
            foodName: food.description,
            calories: getNutrient(1008), // Energy
            protein: getNutrient(1003),  // Protein
            carbs: getNutrient(1005),    // Carbohydrates
            fat: getNutrient(1004),      // Total Fat
            fiber: getNutrient(1079),    // Fiber
            sodium: getNutrient(1093),   // Sodium
            sugar: getNutrient(2000),    // Sugars
        };
    } catch (error) {
        console.error(` USDA Error for ${foodName}:`, error);
        return null;
    }
}

/**
 * Photo → Gemini AI → USDA Nutrition
 * this is the main function 
 */
export async function analyzePhotoForNutrition(imageUri: string): Promise<NutritionData> {
    try {

        // Step 1: Identify food using Gemini AI
        const recognizedFoods = await analyzeFoodImage(imageUri);

        if (recognizedFoods.length === 0) {
            throw new Error('No food items identified in the image');
        }

        // Step 2: Get nutrition for the primary food (highest confidence)
        const primaryFood = recognizedFoods.sort((a, b) => b.confidence - a.confidence)[0];


        // Step 3: Query USDA for accurate nutrition data
        const usdaNutrition = await getNutritionFromUSDA(primaryFood.foodName, primaryFood.servingSize);

        if (usdaNutrition) {
            return {
                ...usdaNutrition,
                source: 'gemini-usda',
            };
        }

        // Fallback: If USDA fails, use Gemini to estimate

        const nutritionEstimate = await getGeminiNutritionEstimate(primaryFood.foodName, primaryFood.servingSize);

        return {
            ...nutritionEstimate,
            source: 'gemini-estimate',
        };

    } catch (error) {
        console.error(' Photo analysis failed:', error);
        throw error;
    }
}

/**
 * Ask Gemini to estimate nutrition if USDA data is not available
 */
async function getGeminiNutritionEstimate(foodName: string, servingSize?: string): Promise<NutritionData> {
    try {
        const prompt = `Provide accurate nutrition information for: ${foodName}${servingSize ? ` (${servingSize})` : ''}.
    
    Return ONLY a JSON object with this exact format:
    {
      "calories": 165,
      "protein": 31.0,
      "carbs": 0.0,
      "fat": 3.6,
      "fiber": 0.0,
      "sodium": 0.074,
      "sugar": 0.0
    }
    
    Base estimates on standard USDA data. Be realistic and accurate.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse nutrition estimate');
        }

        const nutrition = JSON.parse(jsonMatch[0]);

        return {
            foodName,
            calories: nutrition.calories || 0,
            protein: nutrition.protein || 0,
            carbs: nutrition.carbs || 0,
            fat: nutrition.fat || 0,
            fiber: nutrition.fiber || 0,
            sodium: nutrition.sodium || 0,
            sugar: nutrition.sugar || 0,
            source: 'gemini-estimate',
        };

    } catch (error) {
        console.error('Gemini nutrition estimate failed:', error);
        throw error;
    }
}

export default {
    analyzeFoodImage,
    analyzePhotoForNutrition,
};
