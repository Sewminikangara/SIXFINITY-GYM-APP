import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen, DailyCaloriesCard, AIMealSuggestionCard, WeeklyMealPlans, ProgressCircle } from '@/components';
import { MealCard } from '@/components/MealCard';
import { palette, spacing, typography, radii, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import mealService, {
  Meal,
  DailyNutritionSummary,
  getTodayDate
} from '@/services/mealService';

const { width } = Dimensions.get('window');

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

  // Mock AI Suggestions (TODO: Replace with real AI recommendations)
  const aiSuggestions = [
    {
      id: '1',
      name: 'Grilled Chicken & Quinoa Bowl',
      description: 'High-protein meal perfect for post-workout recovery with complete amino acids',
      calories: 450,
      protein: 45,
      carbs: 38,
      fats: 12,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      reason: 'Matches your muscle gain goal & fits your budget',
      matchScore: 95,
      tags: ['High-protein', 'Budget-friendly', 'Quick prep'],
    },
    {
      id: '2',
      name: 'Salmon & Sweet Potato',
      description: 'Omega-3 rich meal with complex carbs for sustained energy',
      calories: 520,
      protein: 35,
      carbs: 45,
      fats: 18,
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
      reason: 'Rich in healthy fats for your heart health',
      matchScore: 88,
      tags: ['Heart-healthy', 'Omega-3', 'Balanced'],
    },
    {
      id: '3',
      name: 'Vegan Buddha Bowl',
      description: 'Plant-based complete meal with chickpeas, avocado, and mixed vegetables',
      calories: 380,
      protein: 18,
      carbs: 52,
      fats: 14,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      reason: 'Low-calorie option for your cutting phase',
      matchScore: 82,
      tags: ['Vegan', 'Low-cal', 'Fiber-rich'],
    },
  ];

  // Mock Weekly Meal Plan (TODO: Replace with real AI-generated plans)
  const weeklyPlan = [
    {
      date: 'Nov 6',
      dayName: 'Monday',
      breakfast: { name: 'Oatmeal & Berries', calories: 320 },
      lunch: { name: 'Grilled Chicken Salad', calories: 450 },
      dinner: { name: 'Salmon & Quinoa', calories: 520 },
      snacks: { name: 'Protein Shake', calories: 180 },
      totalCalories: 1470,
    },
    {
      date: 'Nov 7',
      dayName: 'Tuesday',
      breakfast: { name: 'Greek Yogurt Bowl', calories: 280 },
      lunch: { name: 'Turkey Wrap', calories: 420 },
      dinner: { name: 'Beef Stir-fry', calories: 580 },
      snacks: { name: 'Almonds', calories: 160 },
      totalCalories: 1440,
    },
    {
      date: 'Nov 8',
      dayName: 'Wednesday',
      breakfast: { name: 'Protein Pancakes', calories: 350 },
      lunch: { name: 'Tuna Poke Bowl', calories: 480 },
      dinner: { name: 'Chicken Curry', calories: 550 },
      snacks: { name: 'Apple & PB', calories: 200 },
      totalCalories: 1580,
    },
    {
      date: 'Nov 9',
      dayName: 'Thursday',
      breakfast: { name: 'Avocado Toast', calories: 300 },
      lunch: { name: 'Buddha Bowl', calories: 460 },
      dinner: { name: 'Grilled Steak', calories: 600 },
      snacks: { name: 'Fruit Salad', calories: 120 },
      totalCalories: 1480,
    },
    {
      date: 'Nov 10',
      dayName: 'Friday',
      breakfast: { name: 'Smoothie Bowl', calories: 340 },
      lunch: { name: 'Pasta Salad', calories: 490 },
      dinner: { name: 'Fish Tacos', calories: 520 },
      snacks: { name: 'Dark Chocolate', calories: 150 },
      totalCalories: 1500,
    },
    {
      date: 'Nov 11',
      dayName: 'Saturday',
      breakfast: { name: 'French Toast', calories: 380 },
      lunch: { name: 'Veggie Burger', calories: 450 },
      dinner: { name: 'Pizza (2 slices)', calories: 560 },
      snacks: { name: 'Popcorn', calories: 100 },
      totalCalories: 1490,
    },
    {
      date: 'Nov 12',
      dayName: 'Sunday',
      breakfast: { name: 'Eggs Benedict', calories: 400 },
      lunch: { name: 'Sushi Platter', calories: 480 },
      dinner: { name: 'Roast Chicken', calories: 540 },
      snacks: { name: 'Yogurt', calories: 120 },
      totalCalories: 1540,
    },
  ];

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load daily summary
      const summary = await mealService.getDailyNutritionSummary(user.id, todayDate);
      setDailySummary(summary);

      // Load meals by type
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

      // Load water intake
      const water = await mealService.getTotalWaterIntake(user.id, todayDate);
      setWaterIntake(water);
    } catch (error) {
      console.error('Error loading meal data:', error);
      Alert.alert('Error', 'Failed to load meal data');
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
    // TODO: Navigate to FoodPhotoScreen
    Alert.alert('MealSnap AI', 'Take a photo of your food and AI will detect it automatically. Coming soon!');
  };

  const handleScanBarcode = () => {
    // TODO: Navigate to BarcodeScannerScreen
    Alert.alert('Scan Barcode', 'Scan packaged food barcodes to instantly log nutrition. Coming soon!');
  };

  const handleAddWater = async (amount: number) => {
    if (!user) return;

    try {
      await mealService.addWaterIntake(user.id, amount);
      setWaterIntake(prev => prev + amount);

      // Refresh summary to update water tracking
      const summary = await mealService.getDailyNutritionSummary(user.id, todayDate);
      setDailySummary(summary);
    } catch (error) {
      console.error('Error adding water:', error);
      Alert.alert('Error', 'Failed to log water intake');
    }
  };

  const handleEditMeal = (meal: Meal) => {
    navigation.navigate('AddMeal', { meal, isEditing: true });
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;

    try {
      await mealService.deleteMeal(mealId);
      await loadData(); // Refresh data
      Alert.alert('Success', 'Meal deleted successfully');
    } catch (error) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal');
    }
  };

  const renderMealSection = (
    title: string,
    icon: string,
    meals: Meal[],
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => (
    <View style={styles.mealSection}>
      <View style={styles.mealSectionHeader}>
        <View style={styles.mealSectionTitle}>
          <Ionicons name={icon as any} size={20} color={palette.neonGreen} />
          <Text style={styles.mealSectionText}>{title}</Text>
          <View style={styles.mealCount}>
            <Text style={styles.mealCountText}>{meals.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleAddMeal(mealType)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={20} color={palette.neonGreen} />
        </TouchableOpacity>
      </View>

      {meals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={32} color={palette.textTertiary} />
          <Text style={styles.emptyText}>No {title.toLowerCase()} logged yet</Text>
          <TouchableOpacity onPress={() => handleAddMeal(mealType)}>
            <Text style={styles.emptyAction}>Tap + to add</Text>
          </TouchableOpacity>
        </View>
      ) : (
        meals.map(meal => (
          <MealCard
            key={meal.id}
            meal={meal}
            onEdit={handleEditMeal}
            onDelete={handleDeleteMeal}
          />
        ))
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading meals...</Text>
        </View>
      </Screen>
    );
  }

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
        {/* Simple Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={palette.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal tab</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Quick Actions - Dark Cards */}
        <View style={styles.quickActionsSection}>
          <TouchableOpacity
            style={styles.quickActionDarkCard}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconBox}>
              <Ionicons name="camera-outline" size={28} color={palette.neonGreen} />
            </View>
            <Text style={styles.quickActionLabel}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionDarkCard}
            onPress={() => handleAddMeal('breakfast')}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconBox}>
              <Ionicons name="create-outline" size={28} color={palette.neonGreen} />
            </View>
            <Text style={styles.quickActionLabel}>Manual Entry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionDarkCard}
            onPress={handleScanBarcode}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconBox}>
              <Ionicons name="barcode-outline" size={28} color={palette.neonGreen} />
            </View>
            <Text style={styles.quickActionLabel}>Scan Barcode</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Calories Summary */}
        <View style={styles.dailyCaloriesSection}>
          <Text style={styles.sectionTitle}>Daily Calories Summary</Text>
          <View style={styles.caloriesRow}>
            {/* Circular Progress */}
            <View style={styles.caloriesCircle}>
              {dailySummary && (
                <ProgressCircle
                  progress={Math.min((dailySummary.total_calories_consumed / dailySummary.calories_target) * 100, 100)}
                  size={100}
                  strokeWidth={10}
                  value={dailySummary.total_calories_consumed.toFixed(0)}
                  unit="Kcal"
                  showGlow={false}
                />
              )}
              <Text style={styles.caloriesLabel}>Calories{'\n'}Consumed</Text>
            </View>

            {/* Macros Breakdown */}
            <View style={styles.macrosBox}>
              <Text style={styles.macrosBoxTitle}>Macros Breakdown</Text>
              {dailySummary && (
                <>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Protein</Text>
                    <Text style={styles.macroValue}>{dailySummary.total_protein_grams.toFixed(0)}g</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Carbs</Text>
                    <Text style={styles.macroValue}>{dailySummary.total_carbs_grams.toFixed(0)}g</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Fats</Text>
                    <Text style={styles.macroValue}>{dailySummary.total_fats_grams.toFixed(0)}g</Text>
                  </View>
                  <View style={styles.macroProgressBar}>
                    <View style={[styles.macroProgressFill, { width: '80%' }]} />
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Water Intake */}
        <View style={styles.waterIntakeSection}>
          <Text style={styles.sectionTitle}>Water Intake</Text>
          <View style={styles.waterHeader}>
            <Text style={styles.waterCompleted}>Completed</Text>
            <Text style={styles.waterTotal}>Total{'\n'}8 L</Text>
          </View>
          <Text style={styles.waterAddress}>Warriors Point Unit No 12, Main Street, Colombo Sri Lanka</Text>

          {/* Water Progress Bars */}
          <View style={styles.waterBarsContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <View key={item} style={styles.waterBarRow}>
                <View style={styles.waterBarBg}>
                  <View style={[styles.waterBarFill, { width: item <= 3 ? '100%' : '0%' }]} />
                </View>
                <Text style={styles.waterBarLabel}>1 L</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Daily Calories Card */}
        {dailySummary && (
          <DailyCaloriesCard
            consumed={dailySummary.total_calories_consumed}
            target={dailySummary.calories_target}
            protein={dailySummary.total_protein_grams}
            carbs={dailySummary.total_carbs_grams}
            fats={dailySummary.total_fats_grams}
            proteinTarget={dailySummary.protein_target_grams || 150}
            carbsTarget={dailySummary.carbs_target_grams || 200}
            fatsTarget={dailySummary.fats_target_grams || 65}
            waterMl={waterIntake}
            waterGoalMl={dailySummary.water_goal_ml}
            workoutMinutes={dailySummary.workout_duration_minutes}
            workoutTarget={40}
            caloriesBurned={dailySummary.workout_calories_burned}
          />
        )}

        {/* Water Quick Add */}
        <View style={styles.waterQuickAdd}>
          <Text style={styles.waterQuickAddTitle}>Quick Add Water</Text>
          <View style={styles.waterButtons}>
            <TouchableOpacity
              style={styles.waterButton}
              onPress={() => handleAddWater(250)}
            >
              <Text style={styles.waterButtonText}>250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.waterButton}
              onPress={() => handleAddWater(500)}
            >
              <Text style={styles.waterButtonText}>500ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.waterButton}
              onPress={() => handleAddWater(1000)}
            >
              <Text style={styles.waterButtonText}>1L</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Meal Suggestions */}
        <View style={styles.aiSuggestionsSection}>
          <View style={styles.aiSuggestionsHeader}>
            <View style={styles.aiSuggestionsTitle}>
              <Ionicons name="sparkles" size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>AI Meal Suggestions</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.aiSuggestionsScroll}
          >
            {aiSuggestions.map((suggestion) => (
              <AIMealSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAddToPlan={(s) => {
                  Alert.alert('Add to Plan', `Adding "${s.name}" to your meal plan!`);
                }}
                onViewRecipe={(s) => {
                  Alert.alert('View Recipe', `Recipe for "${s.name}" coming soon!`);
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Weekly Meal Plans */}
        <WeeklyMealPlans
          weekPlan={weeklyPlan}
          onSwapMeal={(day, mealType) => {
            Alert.alert('Swap Meal', `Swap ${mealType} on ${day}? Coming soon!`);
          }}
          onRegeneratePlan={() => {
            Alert.alert('Regenerate Plan', 'AI will create a new meal plan. Coming soon!');
          }}
          onGenerateShoppingList={() => {
            Alert.alert('Shopping List', 'Generate shopping list from meal plan. Coming soon!');
          }}
        />

        {/* Today's Meals */}
        <View style={styles.todaysMeals}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>

          {renderMealSection('Breakfast', 'sunny', breakfastMeals, 'breakfast')}
          {renderMealSection('Lunch', 'restaurant', lunchMeals, 'lunch')}
          {renderMealSection('Dinner', 'moon', dinnerMeals, 'dinner')}
          {renderMealSection('Snacks', 'fast-food', snackMeals, 'snack')}
        </View>
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
  // Premium Header with Gradient
  headerGradient: {
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2A2A',
    marginTop: spacing.xs,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C5FF4A',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  // Quick Actions - Premium Glass Cards
  quickActionsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading2,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    fontSize: 20,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  quickActionGradient: {
    padding: spacing.lg,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: spacing.xs,
  },
  aiPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
    textTransform: 'uppercase',
  },
  photoCard: {},
  manualCard: {},
  barcodeCard: {},
  // Water Quick Add
  waterQuickAdd: {
    backgroundColor: palette.cardBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  waterQuickAddTitle: {
    ...typography.subtitle,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },
  waterButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  waterButton: {
    flex: 1,
    backgroundColor: palette.surface,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.accentBlue,
  },
  waterButtonText: {
    ...typography.bodyBold,
    color: palette.accentBlue,
  },
  // Today's Meals
  todaysMeals: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  mealSection: {
    marginBottom: spacing.xl,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealSectionText: {
    ...typography.subtitle,
    color: palette.textPrimary,
  },
  mealCount: {
    backgroundColor: palette.surface,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCountText: {
    ...typography.footnote,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.neonGreen,
  },
  emptyState: {
    backgroundColor: palette.cardBackground,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.body,
    color: palette.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyAction: {
    ...typography.bodyBold,
    color: palette.neonGreen,
  },
  // AI Suggestions Section
  aiSuggestionsSection: {
    marginBottom: spacing.xl,
  },
  aiSuggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  aiSuggestionsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.neonGreen,
  },
  aiSuggestionsScroll: {
    paddingHorizontal: spacing.lg,
  },
});
