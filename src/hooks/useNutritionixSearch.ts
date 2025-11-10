import { useState, useEffect } from 'react';
import { nutritionixApi, NutritionixFood, NutritionixSearchResult } from '../config/nutritionix';

export const useNutritionixSearch = (query: string) => {
  const [results, setResults] = useState<NutritionixFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchFoods = async () => {
      setLoading(true);
      setError(null);

      try {
        // Instant Search API - searches 850,000+ foods
        const response = await fetch(
          `${nutritionixApi.baseUrl}/search/instant?query=${encodeURIComponent(query)}`,
          {
            headers: nutritionixApi.headers,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to search foods');
        }

        const data: NutritionixSearchResult = await response.json();

        // Combine common foods + branded foods (common first)
        const combined = [
          ...data.common.slice(0, 10), // First 10 common foods
          ...data.branded.slice(0, 10), // First 10 branded foods
        ];

        setResults(combined);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search (wait 500ms after user stops typing)
    const timeoutId = setTimeout(searchFoods, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return { results, loading, error };
};

// Get detailed nutrition for a specific food
export const getNutritionDetails = async (foodName: string): Promise<NutritionixFood | null> => {
  try {
    const response = await fetch(`${nutritionixApi.baseUrl}/natural/nutrients`, {
      method: 'POST',
      headers: nutritionixApi.headers,
      body: JSON.stringify({
        query: foodName, // Natural language: "1 apple" or "2 slices pizza"
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get nutrition details');
    }

    const data = await response.json();
    return data.foods[0] || null;
  } catch (error) {
    console.error('Nutrition details error:', error);
    return null;
  }
};

// Search by barcode (for future barcode scanner feature)
export const searchByBarcode = async (barcode: string): Promise<NutritionixFood | null> => {
  try {
    const response = await fetch(
      `${nutritionixApi.baseUrl}/search/item?upc=${barcode}`,
      {
        headers: nutritionixApi.headers,
      }
    );

    if (!response.ok) {
      throw new Error('Barcode not found');
    }

    const data = await response.json();
    return data.foods[0] || null;
  } catch (error) {
    console.error('Barcode search error:', error);
    return null;
  }
};
