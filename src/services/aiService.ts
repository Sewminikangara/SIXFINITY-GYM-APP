
// Body Analysis, Recipe Generation, Workout Plans, Meal Plans, Chatbot

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Models
const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // For image analysis
const textModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // For text generation

// 1. BODY IMAGE CLASSIFICATION

export interface BodyAnalysisResult {
    bodyType: 'ectomorph' | 'mesomorph' | 'endomorph' | 'mixed';
    bodyFatPercentage: number;
    muscleMass: 'low' | 'medium' | 'high';
    posture: 'good' | 'fair' | 'poor';
    recommendations: string[];
    targetAreas: string[];
    workoutRecommendations: string[];
    nutritionAdvice: string[];
    confidence: number;
}

export const analyzeBodyImage = async (imageUri: string): Promise<BodyAnalysisResult> => {
    try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
        });

        const prompt = `You are a professional fitness coach and body composition expert. Analyze this body image and provide detailed assessment.

Analyze:
1. Body Type (ectomorph/mesomorph/endomorph/mixed)
2. Estimated body fat percentage (realistic range)
3. Muscle mass level (low/medium/high)
4. Posture quality (good/fair/poor)
5. Target areas that need improvement
6. Specific workout recommendations
7. Nutrition advice
8. Confidence level of analysis (0-100%)

Format response as JSON:
{
  "bodyType": "mesomorph",
  "bodyFatPercentage": 18,
  "muscleMass": "medium",
  "posture": "good",
  "recommendations": ["Focus on core strength", "Increase protein intake"],
  "targetAreas": ["Lower abs", "Back"],
  "workoutRecommendations": ["3x weight training", "2x cardio"],
  "nutritionAdvice": ["Increase protein to 2g/kg", "Reduce refined carbs"],
  "confidence": 85
}`;

        const result = await visionModel.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64,
                },
            },
        ]);

        const response = result.response.text();
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return analysis;
        }

        throw new Error('Failed to parse AI response');
    } catch (error) {
        console.error('Body analysis error:', error);
        throw error;
    }
};

// 2. RECIPE GENERATOR


export interface Recipe {
    name: string;
    description: string;
    prepTime: number; // minutes
    cookTime: number; // minutes
    servings: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients: Array<{
        name: string;
        amount: string;
        unit: string;
    }>;
    instructions: string[];
    nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
    };
    tags: string[];
    tips: string[];
}

export const generateRecipe = async (params: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calorieTarget?: number;
    proteinTarget?: number;
    dietaryRestrictions?: string[];
    preferences?: string[];
    cuisine?: string;
}): Promise<Recipe> => {
    try {

        const prompt = `You are a professional nutritionist and chef. Create a healthy, delicious recipe.

Requirements:
- Meal Type: ${params.mealType}
- Calorie Target: ${params.calorieTarget || 'balanced'}
- Protein Target: ${params.proteinTarget || 'high protein'}
- Dietary Restrictions: ${params.dietaryRestrictions?.join(', ') || 'none'}
- Preferences: ${params.preferences?.join(', ') || 'balanced'}
- Cuisine: ${params.cuisine || 'any'}

Create a complete recipe with:
1. Creative, appealing name
2. Detailed description
3. Prep and cook time
4. Complete ingredients list with measurements
5. Step-by-step instructions
6. Accurate nutrition information
7. Helpful cooking tips
8. Relevant tags

Format as JSON:
{
  "name": "Protein-Packed Breakfast Bowl",
  "description": "Delicious high-protein breakfast...",
  "prepTime": 10,
  "cookTime": 15,
  "servings": 2,
  "difficulty": "easy",
  "ingredients": [
    {"name": "Eggs", "amount": "4", "unit": "whole"},
    {"name": "Spinach", "amount": "2", "unit": "cups"}
  ],
  "instructions": [
    "Step 1: Wash and chop spinach",
    "Step 2: Heat pan with olive oil"
  ],
  "nutrition": {
    "calories": 450,
    "protein": 35,
    "carbs": 25,
    "fat": 20,
    "fiber": 5
  },
  "tags": ["high-protein", "breakfast", "quick"],
  "tips": ["Use fresh organic eggs", "Don't overcook"]
}`;

        const result = await textModel.generateContent(prompt);
        const response = result.response.text();
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const recipe = JSON.parse(jsonMatch[0]);
            return recipe;
        }

        throw new Error('Failed to parse recipe');
    } catch (error) {
        console.error(' Recipe generation error:', error);
        throw error;
    }
};

// 3. COMPLETE WORKOUT GENERATOR

export interface WorkoutPlan {
    name: string;
    description: string;
    duration: number; // weeks
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    goal: string;
    daysPerWeek: number;
    workouts: Array<{
        day: string;
        focus: string;
        duration: number; // minutes
        exercises: Array<{
            name: string;
            sets: number;
            reps: string;
            rest: number; // seconds
            instructions: string;
            tips: string[];
            musclesTargeted: string[];
        }>;
    }>;
    nutrition: {
        calorieTarget: number;
        proteinGrams: number;
        carbsGrams: number;
        fatGrams: number;
    };
    tips: string[];
}

export const generateWorkoutPlan = async (params: {
    goal: 'muscle_gain' | 'fat_loss' | 'strength' | 'endurance' | 'general_fitness';
    level: 'beginner' | 'intermediate' | 'advanced';
    daysPerWeek: number;
    duration: number; // weeks
    equipment?: string[];
    injuries?: string[];
    age?: number;
    gender?: 'male' | 'female';
}): Promise<WorkoutPlan> => {
    try {

        const prompt = `You are a certified personal trainer with 10+ years experience. Create a comprehensive workout plan.

Client Profile:
- Goal: ${params.goal.replace('_', ' ')}
- Fitness Level: ${params.level}
- Training Days: ${params.daysPerWeek} per week
- Duration: ${params.duration} weeks
- Available Equipment: ${params.equipment?.join(', ') || 'full gym'}
- Injuries/Limitations: ${params.injuries?.join(', ') || 'none'}
- Age: ${params.age || 'adult'}
- Gender: ${params.gender || 'any'}

Create a detailed, progressive workout plan with:
1. Creative plan name and description
2. ${params.daysPerWeek} workout days with specific focus
3. 6-10 exercises per workout
4. Sets, reps, rest periods for each exercise
5. Clear instructions and form tips
6. Muscle groups targeted
7. Nutrition recommendations (macros)
8. General training tips

Format as JSON with complete workout structure.`;

        const result = await textModel.generateContent(prompt);
        const response = result.response.text();
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const plan = JSON.parse(jsonMatch[0]);
            return plan;
        }

        throw new Error('Failed to parse workout plan');
    } catch (error) {
        console.error(' Workout plan generation error:', error);
        throw error;
    }
};

// 4. COMPLETE MEAL PLAN GENERATOR

export interface MealPlan {
    name: string;
    description: string;
    duration: number; // days
    goal: string;
    dailyCalories: number;
    dailyMacros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    days: Array<{
        day: number;
        meals: Array<{
            type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
            name: string;
            description: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            ingredients: string[];
            prepTime: number;
        }>;
        totalCalories: number;
        totalProtein: number;
        totalCarbs: number;
        totalFat: number;
    }>;
    shoppingList: Array<{
        category: string;
        items: Array<{
            name: string;
            quantity: string;
        }>;
    }>;
    tips: string[];
}

export const generateMealPlan = async (params: {
    goal: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'performance';
    calorieTarget: number;
    proteinTarget: number;
    duration: number; // days (7, 14, 30)
    dietType?: 'balanced' | 'keto' | 'paleo' | 'vegetarian' | 'vegan';
    allergies?: string[];
    dislikes?: string[];
    mealsPerDay: number;
}): Promise<MealPlan> => {
    try {

        const prompt = `You are a registered dietitian and nutrition expert. Create a comprehensive meal plan.

Client Requirements:
- Goal: ${params.goal.replace('_', ' ')}
- Daily Calories: ${params.calorieTarget}
- Daily Protein: ${params.proteinTarget}g
- Duration: ${params.duration} days
- Diet Type: ${params.dietType || 'balanced'}
- Allergies: ${params.allergies?.join(', ') || 'none'}
- Dislikes: ${params.dislikes?.join(', ') || 'none'}
- Meals Per Day: ${params.mealsPerDay}

Create a complete ${params.duration}-day meal plan with:
1. Creative plan name and description
2. Daily meal breakdown (${params.mealsPerDay} meals/day)
3. Complete nutrition info for each meal
4. Variety across days (no repetition)
5. Organized shopping list by category
6. Meal prep tips
7. Ensure daily totals match calorie and protein targets

Format as JSON with full meal plan structure.`;

        const result = await textModel.generateContent(prompt);
        const response = result.response.text();
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const plan = JSON.parse(jsonMatch[0]);
            return plan;
        }

        throw new Error('Failed to parse meal plan');
    } catch (error) {
        console.error(' Meal plan generation error:', error);
        throw error;
    }
};

// 5. AI FITNESS CHATBOT

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface ChatContext {
    userProfile?: {
        age?: number;
        gender?: string;
        weight?: number;
        height?: number;
        goal?: string;
        level?: string;
    };
    conversationHistory: ChatMessage[];
}

export const chatWithAI = async (
    message: string,
    context: ChatContext
): Promise<string> => {
    try {

        const systemPrompt = `You are FitBot, an expert fitness and nutrition AI assistant. You have extensive knowledge in:
- Exercise science and training programs
- Nutrition and meal planning
- Body composition and weight management
- Injury prevention and recovery
- Motivation and goal setting

User Profile:
${context.userProfile ? `
- Age: ${context.userProfile.age || 'unknown'}
- Gender: ${context.userProfile.gender || 'unknown'}
- Weight: ${context.userProfile.weight || 'unknown'}kg
- Height: ${context.userProfile.height || 'unknown'}cm
- Goal: ${context.userProfile.goal || 'general fitness'}
- Level: ${context.userProfile.level || 'intermediate'}
` : 'No profile data available'}

Conversation History:
${context.conversationHistory.slice(-5).map(msg =>
            `${msg.role === 'user' ? 'User' : 'FitBot'}: ${msg.content}`
        ).join('\n')}

Provide helpful, accurate, personalized advice. Be friendly, motivating, and specific. If asked about medical issues, advise consulting a doctor.

User: ${message}
FitBot:`;

        const result = await textModel.generateContent(systemPrompt);
        const response = result.response.text();

        return response.trim();
    } catch (error) {
        console.error(' Chatbot error:', error);
        throw error;
    }
};

// 6. QUICK AI SUGGESTIONS

export const getQuickWorkoutSuggestion = async (
    muscleGroup: string,
    equipment: string[]
): Promise<string[]> => {
    try {
        const prompt = `Suggest 5 effective ${muscleGroup} exercises using: ${equipment.join(', ')}. 
Format: Exercise Name - Sets x Reps - Brief tip. Be concise.`;

        const result = await textModel.generateContent(prompt);
        const response = result.response.text();

        return response.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
        console.error(' Quick suggestion error:', error);
        return [];
    }
};

export const getMealSuggestion = async (
    calories: number,
    protein: number,
    mealType: string
): Promise<string> => {
    try {
        const prompt = `Suggest a quick ${mealType} with ~${calories} calories and ${protein}g protein. 
Format: Meal name - Brief ingredients - Prep tip. One paragraph.`;

        const result = await textModel.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error(' Meal suggestion error:', error);
        return 'Unable to generate suggestion';
    }
};

// Export all functions
export default {
    analyzeBodyImage,
    generateRecipe,
    generateWorkoutPlan,
    generateMealPlan,
    chatWithAI,
    getQuickWorkoutSuggestion,
    getMealSuggestion,
};
