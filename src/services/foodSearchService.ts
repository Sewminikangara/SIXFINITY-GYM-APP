/**
 * Food Search Service
 */

import { env } from '@/config/env';

export interface FoodSearchResult {
    id: string;
    name: string;
    brand?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    serving: string;
}

const USDA_API_KEY = env.usdaApiKey;
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';
const GEMINI_API_KEY = env.geminiApiKey;

// Cache to prevent hitting rate limits
const searchCache = new Map<string, { results: FoodSearchResult[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Use Gemini AI to improve search query and find best USDA matches
 */
async function getAIEnhancedSearchTerms(query: string): Promise<string[]> {
    try {
        const prompt = `User is searching for food: "${query}"

Generate 2-3 BEST search terms to find this food in a nutrition database.
Include variations, common names, and specific terms.

Return ONLY a JSON array of search terms:
["term1", "term2"]

Be specific and accurate for nutrition database searching.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
        });

        if (!response.ok) {
            console.log(' AI search enhancement unavailable, using original query');
            return [query];
        }

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\[[\s\S]*?\]/);

        if (jsonMatch) {
            const terms = JSON.parse(jsonMatch[0]);
            console.log('🤖 AI enhanced search terms:', terms);
            return terms;
        }

        return [query];
    } catch (error) {
        console.error('AI search enhancement error:', error);
        return [query];
    }
}

/**
 * Search for foods by name 
 */
export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
    if (!query || query.length < 2) {
        return [];
    }

    try {
        // Check cache first
        const cached = searchCache.get(query.toLowerCase());
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log(' Returning cached results for:', query);
            return cached.results;
        }

        console.log(' AI-powered search for:', query);

        // Get AI-enhanced search terms
        const searchTerms = await getAIEnhancedSearchTerms(query);

        // Search USDA with AI-enhanced terms
        const allResults: FoodSearchResult[] = [];
        const seenIds = new Set<string>();

        // Use only top 2 terms to avoid rate limits
        for (const term of searchTerms.slice(0, 2)) {
            console.log(`🔎 Searching USDA for term: "${term}"`);
            const response = await fetch(
                `${USDA_API_URL}/foods/search?query=${encodeURIComponent(term)}&pageSize=5&api_key=${USDA_API_KEY}`
            );

            if (!response.ok) {
                console.error(` USDA API error for "${term}": ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error('USDA error details:', errorText);
                continue;
            }

            const data = await response.json();
            console.log(` USDA returned ${data.foods?.length || 0} foods for "${term}"`);

            if (!data.foods || data.foods.length === 0) continue;

            // Map USDA results to our format
            data.foods.forEach((food: any) => {
                const foodId = food.fdcId.toString();
                if (seenIds.has(foodId)) return; // Skip duplicates
                seenIds.add(foodId);

                const nutrients = food.foodNutrients || [];
                const getNutrient = (nutrientId: number) => {
                    const nutrient = nutrients.find((n: any) => n.nutrientId === nutrientId);
                    return nutrient ? nutrient.value : 0;
                };

                allResults.push({
                    id: foodId,
                    name: food.description || food.lowercaseDescription || 'Unknown food',
                    brand: food.brandOwner || undefined,
                    calories: getNutrient(1008) || 0, // Energy (kcal)
                    protein: getNutrient(1003) || 0, // Protein
                    carbs: getNutrient(1005) || 0, // Carbs
                    fat: getNutrient(1004) || 0, // Fat
                    fiber: getNutrient(1079) || 0, // Fiber
                    serving: food.servingSize ? `${food.servingSize}${food.servingUnit}` : '100g',
                });
            });
        }

        const finalResults = allResults.slice(0, 10);

        // Cache the results
        searchCache.set(query.toLowerCase(), {
            results: finalResults,
            timestamp: Date.now()
        });

        console.log(` AI-powered search found ${finalResults.length} unique foods`);
        return finalResults;
    } catch (error) {
        console.error('Food search error:', error);
        return [];
    }
}

/**
 * Get detailed food info by ID
 */
export async function getFoodById(foodId: string): Promise<FoodSearchResult | null> {
    try {
        const response = await fetch(
            `${USDA_API_URL}/food/${foodId}?api_key=${USDA_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`USDA food detail error: ${response.status}`);
        }

        const food = await response.json();
        const nutrients = food.foodNutrients || [];

        const getNutrient = (nutrientId: number) => {
            const nutrient = nutrients.find((n: any) => n.nutrient.id === nutrientId);
            return nutrient ? nutrient.amount : 0;
        };

        return {
            id: food.fdcId.toString(),
            name: food.description,
            brand: food.brandOwner,
            calories: getNutrient(1008),
            protein: getNutrient(1003),
            carbs: getNutrient(1005),
            fat: getNutrient(1004),
            fiber: getNutrient(1079),
            serving: food.servingSize ? `${food.servingSize}${food.servingUnit}` : '100g',
        };
    } catch (error) {
        console.error('Get food by ID error:', error);
        return null;
    }
}

export default {
    searchFoods,
    getFoodById,
};
