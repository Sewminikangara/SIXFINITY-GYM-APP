
const NUTRITIONIX_APP_ID = 'YOUR_APP_ID';
const NUTRITIONIX_APP_KEY = 'YOUR_APP_KEY'; // Get from dashboard

export const nutritionixApi = {
  baseUrl: 'https://trackapi.nutritionix.com/v2',
  headers: {
    'x-app-id': NUTRITIONIX_APP_ID,
    'x-app-key': NUTRITIONIX_APP_KEY,
    'Content-Type': 'application/json',
  },
};

export interface NutritionixFood {
  food_name: string;
  brand_name?: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams: number;
  nf_calories: number;
  nf_total_fat: number;
  nf_saturated_fat: number;
  nf_cholesterol: number;
  nf_sodium: number;
  nf_total_carbohydrate: number;
  nf_dietary_fiber: number;
  nf_sugars: number;
  nf_protein: number;
  nf_potassium: number;
  photo?: {
    thumb: string;
    highres: string;
  };
}

export interface NutritionixSearchResult {
  common: NutritionixFood[]; // Generic foods (apple, banana, etc.)
  branded: NutritionixFood[]; // Brand-specific (Lay's chips, etc.)
}
