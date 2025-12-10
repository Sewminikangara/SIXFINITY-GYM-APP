export interface NutritionInsights {
    weeklyCalories: number[];
    weeklyTargets: number[];
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFats: number;
    calorieTrend: 'increasing' | 'decreasing' | 'stable';
    proteinGoalsMet: number;
    waterGoalsMet: number;
    mealAdherence: number;
    calorieDeficit: number;
    calorieSurplus: number;
    topFoods: { name: string; count: number; calories: number }[];
    badges: string[];
}

export interface MacroRatio {
    protein: number;
    carbs: number;
    fats: number;
}

export interface WorkoutCorrelation {
    date: string;
    caloriesConsumed: number;
    caloriesBurned: number;
    workoutDuration: number;
}

// Get weekly nutrition insights
export async function getWeeklyInsights(userId: string): Promise<NutritionInsights> {
    // Mock data - replace with actual database queries
    const weeklyCalories = [2100, 2300, 1950, 2400, 2200, 2150, 2050];
    const weeklyTargets = [2200, 2200, 2200, 2200, 2200, 2200, 2200];

    const avgCalories = weeklyCalories.reduce((a, b) => a + b, 0) / weeklyCalories.length;
    const avgTarget = weeklyTargets.reduce((a, b) => a + b, 0) / weeklyTargets.length;
    const deficit = avgTarget - avgCalories;

    return {
        weeklyCalories,
        weeklyTargets,
        averageCalories: Math.round(avgCalories),
        averageProtein: 145,
        averageCarbs: 220,
        averageFats: 65,
        calorieTrend: avgCalories > 2200 ? 'increasing' : avgCalories < 2100 ? 'decreasing' : 'stable',
        proteinGoalsMet: 5,
        waterGoalsMet: 4,
        mealAdherence: 85,
        calorieDeficit: deficit > 0 ? Math.round(deficit) : 0,
        calorieSurplus: deficit < 0 ? Math.round(Math.abs(deficit)) : 0,
        topFoods: [
            { name: 'Chicken Breast', count: 12, calories: 1980 },
            { name: 'Brown Rice', count: 10, calories: 1150 },
            { name: 'Broccoli', count: 8, calories: 280 },
            { name: 'Eggs', count: 14, calories: 980 },
            { name: 'Sweet Potato', count: 7, calories: 602 },
        ],
        badges: [
            'Met protein target 5 days in a row',
            'Consistent water intake streak',
            'Logged meals 7 days straight',
        ],
    };
}

// Get macro ratio for the week
export async function getWeeklyMacroRatio(userId: string): Promise<MacroRatio> {
    return {
        protein: 30,
        carbs: 45,
        fats: 25,
    };
}

// Get workout correlation data
export async function getWorkoutCorrelation(userId: string, days: number = 7): Promise<WorkoutCorrelation[]> {
    const data: WorkoutCorrelation[] = [];

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));

        data.push({
            date: date.toISOString().split('T')[0],
            caloriesConsumed: 2000 + Math.floor(Math.random() * 400),
            caloriesBurned: 300 + Math.floor(Math.random() * 200),
            workoutDuration: 30 + Math.floor(Math.random() * 30),
        });
    }

    return data;
}

// Get AI recommendations based on insights
export async function getAIRecommendations(userId: string): Promise<string[]> {
    return [
        'Increase protein intake by 10% for better muscle recovery',
        'Try adding more leafy greens to boost micronutrient intake',
        'Your water intake is below target - aim for 2L daily',
        'Great consistency! Keep logging meals daily',
        'Consider a refeed day this week to boost metabolism',
    ];
}

// Get hydration insights
export async function getHydrationInsights(userId: string): Promise<{
    percentage: number;
    averageDaily: number;
    goalDaily: number;
}> {
    return {
        percentage: 70,
        averageDaily: 1.8,
        goalDaily: 2.5,
    };
}

export default {
    getWeeklyInsights,
    getWeeklyMacroRatio,
    getWorkoutCorrelation,
    getAIRecommendations,
    getHydrationInsights,
};
