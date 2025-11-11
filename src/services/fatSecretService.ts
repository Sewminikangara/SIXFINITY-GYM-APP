/**
 * FatSecret Platform API - Barcode Scanning
 */

interface FatSecretConfig {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    oauthUrl: string;
}

interface BarcodeNutritionData {
    foodName: string;
    brandName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar: number;
    servingSize: string;
    barcode: string;
}

const config: FatSecretConfig = {
    clientId: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID || '',
    clientSecret: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET || '',
    baseUrl: 'https://platform.fatsecret.com/rest/server.api',
    oauthUrl: 'https://oauth.fatsecret.com/connect/token',
};

let accessToken: string | null = null;
let tokenExpiry: number = 0;

const getAccessToken = async (): Promise<string> => {
    try {
        // Return cached token if still valid
        if (accessToken && Date.now() < tokenExpiry) {
            return accessToken;
        }

        const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

        const response = await fetch(config.oauthUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: 'grant_type=client_credentials&scope=basic',
        });

        if (!response.ok) {
            throw new Error(`FatSecret OAuth error: ${response.status}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min before expiry

        return accessToken;
    } catch (error) {
        console.error('FatSecret OAuth error:', error);
        throw error;
    }
};

/**
 * Search food by barcode
 */
export const searchFoodByBarcode = async (
    barcode: string
): Promise<BarcodeNutritionData> => {
    try {
        const token = await getAccessToken();

        const params = new URLSearchParams({
            method: 'food.find_id_for_barcode',
            format: 'json',
            barcode: barcode,
        });

        const response = await fetch(`${config.baseUrl}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`FatSecret barcode search error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.food_id || !data.food_id.value) {
            throw new Error('Barcode not found in database');
        }

        // Get detailed nutrition info
        const foodId = data.food_id.value;
        return await getFoodById(foodId, barcode);
    } catch (error) {
        console.error('FatSecret barcode error:', error);
        throw error;
    }
};

/**
 * Get detailed food information by ID
 */
const getFoodById = async (
    foodId: string,
    barcode: string
): Promise<BarcodeNutritionData> => {
    try {
        const token = await getAccessToken();

        const params = new URLSearchParams({
            method: 'food.get.v2',
            format: 'json',
            food_id: foodId,
        });

        const response = await fetch(`${config.baseUrl}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`FatSecret food details error: ${response.status}`);
        }

        const data = await response.json();
        const food = data.food;
        const serving = food.servings.serving[0]; // Get first serving

        return {
            foodName: food.food_name || 'Unknown Product',
            brandName: food.brand_name || '',
            calories: parseFloat(serving.calories || 0),
            protein: parseFloat(serving.protein || 0),
            carbs: parseFloat(serving.carbohydrate || 0),
            fat: parseFloat(serving.fat || 0),
            fiber: parseFloat(serving.fiber || 0),
            sodium: parseFloat(serving.sodium || 0),
            sugar: parseFloat(serving.sugar || 0),
            servingSize: `${serving.serving_description || '1 serving'}`,
            barcode: barcode,
        };
    } catch (error) {
        console.error('FatSecret food details error:', error);
        throw error;
    }
};

/**
 * Search foods by name (for autocomplete)
 */
export const searchFoodByName = async (query: string): Promise<any[]> => {
    try {
        const token = await getAccessToken();

        const params = new URLSearchParams({
            method: 'foods.search',
            format: 'json',
            search_expression: query,
            max_results: '20',
        });

        const response = await fetch(`${config.baseUrl}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`FatSecret search error: ${response.status}`);
        }

        const data = await response.json();
        return data.foods?.food || [];
    } catch (error) {
        console.error('FatSecret search error:', error);
        throw error;
    }
};

export default {
    searchFoodByBarcode,
    searchFoodByName,
    getFoodById,
};
