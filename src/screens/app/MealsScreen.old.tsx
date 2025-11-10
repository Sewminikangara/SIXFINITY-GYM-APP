import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ProgressCircle } from '@/components';
import { MealCard } from '@/components/MealCard';
import { palette, spacing, typography, radii } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import mealService, {
    Meal,
    DailyNutritionSummary,
    getTodayDate
} from '@/services/mealService';

interface MealsScreenProps {
    navigation: any;
}

export const MealsScreen: React.FC<MealsScreenProps> = ({ navigation }) => {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [todayDate] = useState(getTodayDate());

    // State
    const [dailySummary, setDailySummary] = useState<DailyNutritionSummary | null>(null);
    const [breakfastMeals, setBreakfastMeals] = useState<Meal[]>([]);
    const [lunchMeals, setLunchMeals] = useState<Meal[]>([]);
    const [dinnerMeals, setDinnerMeals] = useState<Meal[]>([]);
    const [snackMeals, setSnackMeals] = useState<Meal[]>([]);
    const [waterIntake, setWaterIntake] = useState(0);

    // Load data
    const loadData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);

            const summary = await mealService.getDailyNutritionSummary(user.id, todayDate);
            setDailySummary(summary);

            const [breakfast, lunch, dinner, snacks] = await Promise.all([
                mealService.getMealsByType(user.id, todayDate, 'breakfast'),
                mealService.getMealsByType(user.id, todayDate, 'lunch'),
                mealService.getMealsByType(user.id, todayDate, 'dinner'),
                mealService.getMealsByType(user.id, todayDate, 'snack'),
            ]);

            setBreakfastMeals(breakfast);
            setLunchMeals(lunch);
            setDinnerMeals(dinner);
            setSnackMeals(snacks);

            const water = await mealService.getTotalWaterIntake(user.id, todayDate);
            setWaterIntake(water);
        } catch (error) {
            console.error('Error loading meal data:', error);
        } finally {
            setLoading(false);
        }
    }, [user, todayDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleAddMeal = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
        navigation.navigate('AddMeal', { mealType });
    };

    const handleTakePhoto = () => {
        Alert.alert('Camera', 'Take a photo of your meal. Coming soon!');
    };

    const handleScanBarcode = () => {
        Alert.alert('Scan Barcode', 'Scan packaged food barcode. Coming soon!');
    };

    const handleAddWater = async (amount: number) => {
        if (!user) return;
        try {
            await mealService.addWaterIntake(user.id, amount);
            setWaterIntake(prev => prev + amount);
            const summary = await mealService.getDailyNutritionSummary(user.id, todayDate);
            setDailySummary(summary);
        } catch (error) {
            console.error('Error adding water:', error);
        }
    };

    const handleEditMeal = (meal: Meal) => {
        navigation.navigate('AddMeal', { meal, isEditing: true });
    };

    const handleDeleteMeal = async (mealId: string) => {
        if (!user) return;
        try {
            await mealService.deleteMeal(mealId);
            await loadData();
            Alert.alert('Success', 'Meal deleted successfully');
        } catch (error) {
            console.error('Error deleting meal:', error);
            Alert.alert('Error', 'Failed to delete meal');
        }
    };

    if (loading && !refreshing) {
        return (
            <Screen>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </Screen>
        );
    }

    const allMeals = [...breakfastMeals, ...lunchMeals, ...dinnerMeals, ...snackMeals];

    return (
        <Screen>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.neonGreen} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={palette.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Meal tab</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsRow}>
                    <TouchableOpacity style={styles.quickActionCard} onPress={handleTakePhoto}>
                        <View style={styles.quickActionIconBox}>
                            <Ionicons name="camera-outline" size={32} color={palette.neonGreen} />
                        </View>
                        <Text style={styles.quickActionLabel}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionCard} onPress={() => handleAddMeal('breakfast')}>
                        <View style={styles.quickActionIconBox}>
                            <Ionicons name="create-outline" size={32} color={palette.neonGreen} />
                        </View>
                        <Text style={styles.quickActionLabel}>Manual Entry</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionCard} onPress={handleScanBarcode}>
                        <View style={styles.quickActionIconBox}>
                            <Ionicons name="barcode-outline" size={32} color={palette.neonGreen} />
                        </View>
                        <Text style={styles.quickActionLabel}>Scan Barcode</Text>
                    </TouchableOpacity>
                </View>

                {/* Daily Calories Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Daily Calories Summary</Text>
                    <View style={styles.caloriesRow}>
                        {/* Circular Progress */}
                        <View style={styles.caloriesCircle}>
                            {dailySummary && (
                                <>
                                    <ProgressCircle
                                        progress={Math.min((dailySummary.total_calories_consumed / dailySummary.calories_target) * 100, 100)}
                                        size={100}
                                        strokeWidth={10}
                                        value={dailySummary.total_calories_consumed.toFixed(0)}
                                        unit=""
                                        showGlow={false}
                                    />
                                    <Text style={styles.caloriesUnit}>Kcal</Text>
                                    <Text style={styles.caloriesLabel}>Calories{'\n'}Consumed</Text>
                                </>
                            )}
                        </View>

                        {/* Macros Breakdown */}
                        <View style={styles.macrosBox}>
                            <Text style={styles.macrosBoxTitle}>Macros Breakdown</Text>
                            {dailySummary && (
                                <>
                                    <View style={styles.macroRow}>
                                        <Text style={styles.macroLabel}>Protein</Text>
                                        <Text style={styles.macroValue}>{dailySummary.total_protein_grams.toFixed(0)}g</Text>
                                    </View>
                                    <View style={styles.macroRow}>
                                        <Text style={styles.macroLabel}>Carbs</Text>
                                        <Text style={styles.macroValue}>{dailySummary.total_carbs_grams.toFixed(0)}g</Text>
                                    </View>
                                    <View style={styles.macroRow}>
                                        <Text style={styles.macroLabel}>Fats</Text>
                                        <Text style={styles.macroValue}>{dailySummary.total_fats_grams.toFixed(0)}g</Text>
                                    </View>
                                    <View style={styles.macroProgressBar}>
                                        <View style={[styles.macroProgressFill, { width: '70%' }]} />
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Water Intake */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Water Intake</Text>
                    <View style={styles.waterHeader}>
                        <Text style={styles.waterCompleted}>Completed</Text>
                        <Text style={styles.waterTotal}>Total{'\n'}8 L</Text>
                    </View>
                    <Text style={styles.waterAddress}>Warriors Point Unit No 12, Main Street, Colombo Sri Lanka</Text>

                    <View style={styles.waterBarsContainer}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
                            const completed = waterIntake >= (item * 1000);
                            return (
                                <TouchableOpacity
                                    key={item}
                                    style={styles.waterBarRow}
                                    onPress={() => handleAddWater(1000)}
                                >
                                    <View style={styles.waterBarBg}>
                                        <View style={[styles.waterBarFill, { width: completed ? '100%' : '0%' }]} />
                                    </View>
                                    <Text style={styles.waterBarLabel}>1 L</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Today's Meals */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Meals</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.mealsScroll}
                    >
                        {allMeals.length > 0 ? (
                            allMeals.map((meal) => (
                                <View key={meal.id} style={styles.mealCardHorizontal}>
                                    <Image
                                        source={{ uri: meal.photo_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
                                        style={styles.mealImage}
                                    />
                                    <Text style={styles.mealName}>{meal.meal_name || meal.meal_type}</Text>
                                    <Text style={styles.mealCalories}>{Math.round(meal.total_calories)} Kcal</Text>
                                    <TouchableOpacity style={styles.mealHeartIcon}>
                                        <Ionicons name="heart-outline" size={16} color={palette.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyMeals}>
                                <Text style={styles.emptyMealsText}>No meals logged today</Text>
                                <TouchableOpacity onPress={() => handleAddMeal('breakfast')}>
                                    <Text style={styles.emptyMealsAction}>+ Add meal</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* AI Meal Suggestions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AI Meal Suggestions</Text>
                    <View style={styles.aiCard}>
                        <View style={styles.aiCardContent}>
                            <Text style={styles.aiCardText}>Get personalized meal recommendations</Text>
                            <TouchableOpacity style={styles.aiAddButton}>
                                <Text style={styles.aiAddButtonText}>Add to Plan</Text>
                                <Ionicons name="add-circle" size={20} color={palette.neonGreen} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Meal Plans (Weekly) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Meal Plans (Weekly)</Text>
                    <View style={styles.weeklyCaloriesCard}>
                        <Text style={styles.weeklyCaloriesLabel}>Total calories per day</Text>
                        <Text style={styles.weeklyCaloriesValue}>1300 Kcal</Text>
                        <TouchableOpacity style={styles.weeklyArrow}>
                            <Ionicons name="chevron-forward" size={20} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.mealsScroll}
                    >
                        {[
                            { name: 'Breakfast', calories: 250, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200' },
                            { name: 'Lunch', calories: 350, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' },
                            { name: 'Dinner', calories: 250, image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200' },
                        ].map((meal, index) => (
                            <View key={index} style={styles.mealCardHorizontal}>
                                <Image source={{ uri: meal.image }} style={styles.mealImage} />
                                <Text style={styles.mealName}>{meal.name}</Text>
                                <Text style={styles.mealCalories}>{meal.calories} Kcal</Text>
                                <TouchableOpacity style={styles.mealHeartIcon}>
                                    <Ionicons name="heart-outline" size={16} color={palette.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Shopping List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shopping List</Text>
                    <Text style={styles.waterAddress}>Warriors Point Unit No 12, Main Street, Colombo Sri Lanka</Text>

                    <View style={styles.waterBarsContainer}>
                        {['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6', 'Item 7', 'Item 8'].map((item, index) => (
                            <View key={index} style={styles.waterBarRow}>
                                <View style={styles.waterBarBg}>
                                    <View style={[styles.waterBarFill, { width: index < 3 ? '100%' : '0%' }]} />
                                </View>
                                <Text style={styles.waterBarLabel}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.viewMoreButton}>
                        <Text style={styles.viewMoreText}>View More</Text>
                        <View style={styles.viewMoreIcon}>
                            <Ionicons name="chevron-down" size={16} color={palette.background} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Nutrition Reports */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nutrition Reports</Text>

                    {/* Monthly Summaries */}
                    <View style={styles.monthlySummariesCard}>
                        <Text style={styles.monthlySummariesTitle}>Monthly summaries</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Average calories & macros</Text>
                            <Text style={styles.summaryValue}>00</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Most frequent foods</Text>
                            <Text style={styles.summaryValue}>00</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Calorie trends vs. goals</Text>
                            <Text style={styles.summaryValue}>00</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Progress badges</Text>
                            <Text style={styles.summaryValueGood}>Good</Text>
                        </View>
                    </View>

                    {/* Daily Calories (Duplicate for Reports) */}
                    <View style={styles.caloriesRow}>
                        <View style={styles.caloriesCircle}>
                            {dailySummary && (
                                <>
                                    <ProgressCircle
                                        progress={Math.min((dailySummary.total_calories_consumed / dailySummary.calories_target) * 100, 100)}
                                        size={100}
                                        strokeWidth={10}
                                        value={dailySummary.total_calories_consumed.toFixed(0)}
                                        unit=""
                                        showGlow={false}
                                    />
                                    <Text style={styles.caloriesUnit}>Kcal</Text>
                                    <Text style={styles.caloriesLabel}>Calories{'\n'}Consumed</Text>
                                </>
                            )}
                        </View>

                        <View style={styles.macrosBox}>
                            <Text style={styles.macrosBoxTitle}>Macros Breakdown</Text>
                            {dailySummary && (
                                <>
                                    <View style={styles.macroRow}>
                                        <Text style={styles.macroLabel}>Protein</Text>
                                        <Text style={styles.macroValue}>{dailySummary.total_protein_grams.toFixed(0)}g</Text>
                                    </View>
                                    <View style={styles.macroRow}>
                                        <Text style={styles.macroLabel}>Carbs</Text>
                                        <Text style={styles.macroValue}>{dailySummary.total_carbs_grams.toFixed(0)}g</Text>
                                    </View>
                                    <View style={styles.macroRow}>
                                        <Text style={styles.macroLabel}>Fats</Text>
                                        <Text style={styles.macroValue}>{dailySummary.total_fats_grams.toFixed(0)}g</Text>
                                    </View>
                                    <View style={styles.macroProgressBar}>
                                        <View style={[styles.macroProgressFill, { width: '70%' }]} />
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Final Water Intake */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Water Intake</Text>
                    <View style={styles.waterHeader}>
                        <Text style={styles.waterCompleted}>Completed</Text>
                        <Text style={styles.waterTotal}>Total{'\n'}1000 ml</Text>
                    </View>
                    <View style={styles.finalWaterBar}>
                        <View style={[styles.waterBarFill, { width: `${(waterIntake / 8000) * 100}%` }]} />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    content: {
        paddingBottom: spacing.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    // Quick Actions
    quickActionsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionIconBox: {
        marginBottom: spacing.xs,
    },
    quickActionLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: palette.textPrimary,
        textAlign: 'center',
    },
    // Section
    section: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    // Daily Calories Summary
    caloriesRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    caloriesCircle: {
        alignItems: 'center',
    },
    caloriesUnit: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginTop: spacing.xs,
    },
    caloriesLabel: {
        fontSize: 12,
        color: palette.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 16,
    },
    macrosBox: {
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        padding: spacing.md,
    },
    macrosBoxTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    macroLabel: {
        fontSize: 12,
        color: palette.textSecondary,
    },
    macroValue: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    macroProgressBar: {
        height: 8,
        backgroundColor: palette.backgroundElevated,
        borderRadius: radii.sm,
        marginTop: spacing.sm,
        overflow: 'hidden',
    },
    macroProgressFill: {
        height: '100%',
        backgroundColor: palette.neonGreen,
        borderRadius: radii.sm,
    },
    // Water Intake
    waterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    waterCompleted: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    waterTotal: {
        fontSize: 12,
        color: palette.textSecondary,
        textAlign: 'right',
        lineHeight: 16,
    },
    waterAddress: {
        fontSize: 11,
        color: palette.textTertiary,
        marginBottom: spacing.md,
        lineHeight: 14,
    },
    waterBarsContainer: {
        gap: spacing.xs,
    },
    waterBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    waterBarBg: {
        flex: 1,
        height: 28,
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        overflow: 'hidden',
    },
    waterBarFill: {
        height: '100%',
        backgroundColor: palette.neonGreen,
        borderRadius: radii.md,
    },
    waterBarLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: palette.textPrimary,
        minWidth: 30,
    },
    // Today's Meals
    mealsScroll: {
        paddingRight: spacing.lg,
        gap: spacing.md,
    },
    mealCardHorizontal: {
        width: 120,
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.sm,
        position: 'relative',
    },
    mealImage: {
        width: '100%',
        height: 80,
        borderRadius: radii.md,
        marginBottom: spacing.xs,
    },
    mealName: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: 2,
    },
    mealCalories: {
        fontSize: 11,
        color: palette.textSecondary,
    },
    mealHeartIcon: {
        position: 'absolute',
        top: spacing.sm + 4,
        right: spacing.sm + 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyMeals: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyMealsText: {
        fontSize: 14,
        color: palette.textSecondary,
        marginBottom: spacing.sm,
    },
    emptyMealsAction: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.neonGreen,
    },
    // AI Suggestions
    aiCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
    },
    aiCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    aiCardText: {
        flex: 1,
        fontSize: 13,
        color: palette.textPrimary,
        marginRight: spacing.md,
    },
    aiAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    aiAddButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.neonGreen,
    },
    // Weekly Meal Plan
    weeklyCaloriesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.neonGreen,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        position: 'relative',
    },
    weeklyCaloriesLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: palette.background,
    },
    weeklyCaloriesValue: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.background,
        marginRight: spacing.sm,
    },
    weeklyArrow: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Shopping List
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        gap: spacing.xs,
    },
    viewMoreText: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    viewMoreIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: palette.neonGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Nutrition Reports
    monthlySummariesCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    monthlySummariesTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    summaryLabel: {
        fontSize: 13,
        color: palette.textSecondary,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    summaryValueGood: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.success,
    },
    // Final Water Bar
    finalWaterBar: {
        height: 12,
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        overflow: 'hidden',
    },
});
