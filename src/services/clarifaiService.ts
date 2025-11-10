/**
 * Clarifai Food Recognition Service
 * FREE: 1,000 operations/month
 * Excellent food image recognition from photos
 */

interface ClarifaiFoodConcept {
    id: string;
    name: string;
    value: number; // confidence score 0-1
    app_id: string;
}

interface ClarifaiResponse {
    status: {
        code: number;
        description: string;
    };
    outputs: Array<{
        data: {
            concepts: ClarifaiFoodConcept[];
        };
    }>;
}

interface FoodRecognitionResult {
    foods: string[]; // List of detected food items
    confidence: number; // Average confidence
    topFood: string; // Most confident food
}

const CLARIFAI_API_KEY = process.env.EXPO_PUBLIC_CLARIFAI_API_KEY || 'YOUR_CLARIFAI_API_KEY';
const CLARIFAI_USER_ID = 'clarifai';
const CLARIFAI_APP_ID = 'main';
const CLARIFAI_MODEL_ID = 'food-item-recognition';
const CLARIFAI_API_URL = `https://api.clarifai.com/v2/users/${CLARIFAI_USER_ID}/apps/${CLARIFAI_APP_ID}/models/${CLARIFAI_MODEL_ID}/outputs`;

const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Recognize food items from image using Clarifai
 */
export async function recognizeFoodFromImage(imageUri: string): Promise<FoodRecognitionResult> {
    try {
        console.log('📸 Converting image to base64...');
        const base64Image = await convertImageToBase64(imageUri);

        console.log('🔑 Using Clarifai API key:', CLARIFAI_API_KEY.substring(0, 10) + '...');
        console.log('🌐 Calling Clarifai API...');

        const response = await fetch(CLARIFAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${CLARIFAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_app_id: {
                    user_id: CLARIFAI_USER_ID,
                    app_id: CLARIFAI_APP_ID,
                },
                inputs: [
                    {
                        data: {
                            image: {
                                base64: base64Image,
                            },
                        },
                    },
                ],
            }),
        });

        const responseText = await response.text();
        console.log('📡 Clarifai response status:', response.status);

        if (!response.ok) {
            console.error('❌ Clarifai error response:', responseText);
            throw new Error(`Clarifai API error: ${response.status}`);
        }

        const data: ClarifaiResponse = JSON.parse(responseText);

        if (data.status.code !== 10000) {
            console.error('❌ Clarifai status error:', data.status);
            throw new Error(`Clarifai error: ${data.status.description}`);
        }

        const concepts = data.outputs[0]?.data?.concepts || [];
        console.log('🎯 Detected concepts:', concepts.slice(0, 5));

        // Filter out low confidence predictions (< 0.7)
        const highConfidenceFoods = concepts.filter(c => c.value >= 0.7);

        if (highConfidenceFoods.length === 0) {
            // If no high confidence, take top 3 anyway
            const topFoods = concepts.slice(0, 3);
            if (topFoods.length === 0) {
                throw new Error('No food items detected');
            }
            const foods = topFoods.map(c => c.name);
            const avgConfidence = topFoods.reduce((sum, c) => sum + c.value, 0) / topFoods.length;

            console.log('⚠️ Using lower confidence foods:', foods);

            return {
                foods,
                confidence: avgConfidence,
                topFood: topFoods[0].name,
            };
        }

        const foods = highConfidenceFoods.map(c => c.name);
        const avgConfidence = highConfidenceFoods.reduce((sum, c) => sum + c.value, 0) / highConfidenceFoods.length;
        const topFood = highConfidenceFoods[0].name;

        console.log('✅ Clarifai recognized foods:', foods);
        console.log('🎯 Top food:', topFood, '(confidence:', (avgConfidence * 100).toFixed(0) + '%)');

        return {
            foods,
            confidence: avgConfidence,
            topFood,
        };
    } catch (error) {
        console.error('Clarifai food recognition error:', error);
        throw error;
    }
}

/**
 * Convert image URI to base64
 */
async function convertImageToBase64(imageUri: string): Promise<string> {
    try {
        // For file:// URIs, read as base64
        if (imageUri.startsWith('file://')) {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        // For other URIs
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Image conversion error:', error);
        throw error;
    }
}

/**
 * Get nutrition data from USDA FoodData Central (100% FREE, unlimited)
 * After we recognize the food with Clarifai, we get nutrition from USDA
 */
export interface USDANutritionData {
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar: number;
}

/**
 * Search USDA database for food and get nutrition
 */
export async function getNutritionFromUSDA(foodName: string): Promise<USDANutritionData> {
    try {
        console.log('Searching USDA for:', foodName);

        // Search for the food
        const searchResponse = await fetch(
            `${USDA_API_URL}/foods/search?query=${encodeURIComponent(foodName)}&pageSize=1&api_key=${USDA_API_KEY}`
        );

        if (!searchResponse.ok) {
            throw new Error(`USDA search error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();

        if (!searchData.foods || searchData.foods.length === 0) {
            throw new Error('Food not found in USDA database');
        }

        const food = searchData.foods[0];
        const nutrients = food.foodNutrients || [];

        // Extract key nutrients
        const getnutrient = (nutrientName: string) => {
            const nutrient = nutrients.find((n: any) => n.nutrientName.toLowerCase().includes(nutrientName.toLowerCase()));
            return nutrient ? nutrient.value : 0;
        };

        const nutritionData: USDANutritionData = {
            foodName: food.description || foodName,
            calories: getnutrient('Energy') || getnutrient('Calories'),
            protein: getnutrient('Protein'),
            carbs: getnutrient('Carbohydrate'),
            fat: getnutrient('Total lipid') || getnutrient('Fat'),
            fiber: getnutrient('Fiber'),
            sodium: getnutrient('Sodium') / 1000, // Convert mg to g
            sugar: getnutrient('Sugars'),
        };

        console.log('USDA nutrition data:', nutritionData);

        return nutritionData;
    } catch (error) {
        console.error('USDA nutrition error:', error);
        throw error;
    }
}
