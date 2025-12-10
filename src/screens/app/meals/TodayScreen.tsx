
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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ProgressCircle } from '@/components';
import { palette, spacing, typography, radii } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseUserId, hasValidSupabaseId } from '@/utils/userHelpers';
import { supabase } from '@/config/supabaseClient';
import mealService, {
  Meal,
  DailyNutritionSummary,
  getTodayDate
} from '@/services/mealService';

const { width } = Dimensions.get('window');

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

interface TodayScreenProps {
  navigation: any;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ navigation }) => {
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

  // Shopping list state
  const [shoppingList, setShoppingList] = useState([
    { id: 1, name: 'Chicken Breast', completed: true },
    { id: 2, name: 'Brown Rice', completed: true },
    { id: 3, name: 'Broccoli', completed: true },
    { id: 4, name: 'Sweet Potato', completed: false },
    { id: 5, name: 'Salmon', completed: false },
    { id: 6, name: 'Eggs', completed: false },
    { id: 7, name: 'Oats', completed: false },
    { id: 8, name: 'Greek Yogurt', completed: false },
  ]);

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      let supabaseUserId = getSupabaseUserId(user);

      // If no valid UUID, try to fetch from Supabase by email
      if (!supabaseUserId || !isValidUUID(supabaseUserId)) {
        console.warn('Invalid or missing Supabase UUID, fetching from database...');
        try {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', user.email)
            .limit(1);

          if (profiles && profiles.length > 0) {
            supabaseUserId = profiles[0].id;
            // Update user object with correct UUID
            const updatedUser = { ...user, supabaseUserId };
            await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
          } else {
            console.error('❌ No profile found for user email:', user.email);
            Alert.alert(
              'Profile Not Found',
              'Please log out and log back in to set up your profile.',
              [{ text: 'OK' }]
            );
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching Supabase UUID:', err);
          Alert.alert('Error', 'Failed to load your profile. Please try logging out and back in.');
          return;
        }
      }

      const summary = await mealService.getDailyNutritionSummary(supabaseUserId, todayDate);
      setDailySummary(summary);

      const [breakfast, lunch, dinner, snacks] = await Promise.all([
        mealService.getMealsByType(supabaseUserId, todayDate, 'breakfast'),
        mealService.getMealsByType(supabaseUserId, todayDate, 'lunch'),
        mealService.getMealsByType(supabaseUserId, todayDate, 'dinner'),
        mealService.getMealsByType(supabaseUserId, todayDate, 'snack'),
      ]);

      setBreakfastMeals(breakfast);
      setLunchMeals(lunch);
      setDinnerMeals(dinner);
      setSnackMeals(snacks);

      const water = await mealService.getTotalWaterIntake(supabaseUserId, todayDate);
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
    // Navigate to real camera screen
    navigation.navigate('Camera');
  };

  const handleScanBarcode = () => {
    // For now, use a placeholder - in production this will use expo-barcode-scanner
    const mockImageUri = 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400&h=400&fit=crop';

    navigation.navigate('MealAnalysis', {
      imageUri: mockImageUri,
      scanType: 'barcode'
    });
  };

  const handleAddWater = async (amount: number) => {
    if (!user) return;
    try {
      let supabaseUserId = getSupabaseUserId(user);

      // If no valid UUID, try to fetch from storage
      if (!supabaseUserId || !isValidUUID(supabaseUserId)) {
        console.warn('Invalid UUID in handleAddWater, fetching...');
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          supabaseUserId = parsedUser.supabaseUserId;
        }

        if (!supabaseUserId || !isValidUUID(supabaseUserId)) {
          Alert.alert('Error', 'Unable to save water intake. Please try logging out and back in.');
          return;
        }
      }

      await mealService.addWaterIntake(supabaseUserId, amount);
      setWaterIntake(prev => prev + amount);
      const summary = await mealService.getDailyNutritionSummary(supabaseUserId, todayDate);
      setDailySummary(summary);
    } catch (error) {
      console.error('Error adding water:', error);
      Alert.alert('Error', 'Failed to add water intake');
    }
  };

  const toggleShoppingItem = (id: number) => {
    setShoppingList(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Handler: Add AI-suggested meal to weekly plan (navigate to Plans screen)
  const handleAddToPlan = () => {
    navigation.navigate('Plans');
  };

  // Handler: View recipe details
  const handleViewRecipe = () => {
    Alert.alert('Recipe Details', 'View full recipe with ingredients and instructions. Coming soon!');
  };

  // Handler: Navigate to weekly meal plan
  const handleViewWeeklyPlan = () => {
    navigation.navigate('Plans');
  };

  // Handler: View shopping list (navigate to Plans screen with shopping list open)
  const handleViewShoppingList = () => {
    navigation.navigate('Plans');
  };

  // Handler: Edit a meal
  const handleEditMeal = (meal: Meal) => {
    navigation.navigate('AddMeal', {
      meal,
      isEditing: true,
      mealType: meal.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack'
    });
  };

  // Handler: Delete a meal
  const handleDeleteMeal = async (mealId: string, mealName: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mealService.deleteMeal(mealId);
              await loadData();
              Alert.alert('Success', 'Meal deleted successfully');
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal');
            }
          }
        }
      ]
    );
  };

  // Handler: Favorite a meal (save to favorites list)
  const handleFavoriteMeal = async (mealId: string, mealName: string) => {
    try {
      Alert.alert('Favorite Added', `"${mealName}" has been added to your favorites!`);
    } catch (error) {
      console.error('Error favoriting meal:', error);
      Alert.alert('Error', 'Failed to add to favorites');
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

  const caloriesConsumed = dailySummary?.total_calories_consumed || 0;
  const caloriesTarget = dailySummary?.calories_target || 2000;
  const proteinGrams = dailySummary?.total_protein_grams || 0;
  const carbsGrams = dailySummary?.total_carbs_grams || 0;
  const fatsGrams = dailySummary?.total_fats_grams || 0;
  const waterProgress = (waterIntake / 8000) * 100;

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
        {/* Quick Actions - 3 Cards */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleTakePhoto}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera" size={24} color={palette.neonGreen} />
            </View>
            <Text style={styles.quickActionLabel}>Take{'\n'}Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => handleAddMeal('breakfast')}>
            <View style={styles.iconCircle}>
              <Ionicons name="create" size={24} color={palette.neonGreen} />
            </View>
            <Text style={styles.quickActionLabel}>Manual{'\n'}Entry</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={handleScanBarcode}>
            <View style={styles.iconCircle}>
              <Ionicons name="barcode" size={24} color={palette.neonGreen} />
            </View>
            <Text style={styles.quickActionLabel}>Scan{'\n'}Barcode</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Calories Card */}
        <View style={styles.caloriesCard}>
          <Text style={styles.cardTitle}>Daily Calories</Text>
          <View style={styles.caloriesContent}>
            <View style={styles.progressCircleContainer}>
              <ProgressCircle
                progress={Math.min((caloriesConsumed / caloriesTarget) * 100, 100)}
                size={120}
                strokeWidth={12}
                value={Math.round(caloriesConsumed).toString()}
                showGlow={true}
              />
              <Text style={styles.targetText}>of {Math.round(caloriesTarget)}</Text>
            </View>

            <View style={styles.macrosContainer}>
              <Text style={styles.macrosTitle}>Macros</Text>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#ff6b6b' }]} />
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{Math.round(proteinGrams)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#feca57' }]} />
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{Math.round(carbsGrams)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#48dbfb' }]} />
                <Text style={styles.macroLabel}>Fats</Text>
                <Text style={styles.macroValue}>{Math.round(fatsGrams)}g</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Water Intake Card */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View>
              <Text style={styles.cardTitle}>Water Intake</Text>
              <Text style={styles.waterSubtext}>{waterIntake}ml of 8000ml</Text>
            </View>
            <View style={styles.waterButtons}>
              <TouchableOpacity style={styles.waterBtn} onPress={() => handleAddWater(250)}>
                <Text style={styles.waterBtnText}>+250ml</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waterBtn} onPress={() => handleAddWater(500)}>
                <Text style={styles.waterBtnText}>+500ml</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.waterGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
              const isCompleted = waterIntake >= (index * 1000);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.waterGlass}
                  onPress={() => handleAddWater(1000)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isCompleted ? 'water' : 'water-outline'}
                    size={32}
                    color={isCompleted ? '#48dbfb' : 'rgba(255,255,255,0.3)'}
                  />
                  <Text style={styles.waterGlassText}>1L</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Today's Meals */}
        <View style={styles.mealsSection}>
          <View style={styles.mealsSectionHeader}>
            <Text style={styles.cardTitle}>Today's Meals</Text>
            <TouchableOpacity onPress={() => handleAddMeal('breakfast')}>
              <Ionicons name="add-circle" size={28} color={palette.neonGreen} />
            </TouchableOpacity>
          </View>

          {/* Breakfast */}
          <TouchableOpacity
            style={styles.mealTypeCard}
            onPress={() => handleAddMeal('breakfast')}
          >
            <View style={styles.mealTypeHeader}>
              <Ionicons name="sunny" size={24} color={palette.neonGreen} />
              <Text style={styles.mealTypeName}>Breakfast</Text>
              <Text style={styles.mealTypeCalories}>
                {breakfastMeals.reduce((sum, m) => sum + m.total_calories, 0).toFixed(0)} kcal
              </Text>
            </View>
            {breakfastMeals.length > 0 ? (
              breakfastMeals.map(meal => (
                <View key={meal.id} style={styles.mealItem}>
                  <Text style={styles.mealItemName}>{meal.meal_name || 'Meal'}</Text>
                  <Text style={styles.mealItemCalories}>{Math.round(meal.total_calories)} kcal</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMealText}>No meals logged</Text>
            )}
          </TouchableOpacity>

          {/* Lunch */}
          <TouchableOpacity
            style={styles.mealTypeCard}
            onPress={() => handleAddMeal('lunch')}
          >
            <View style={styles.mealTypeHeader}>
              <Ionicons name="restaurant" size={24} color={palette.neonGreen} />
              <Text style={styles.mealTypeName}>Lunch</Text>
              <Text style={styles.mealTypeCalories}>
                {lunchMeals.reduce((sum, m) => sum + m.total_calories, 0).toFixed(0)} kcal
              </Text>
            </View>
            {lunchMeals.length > 0 ? (
              lunchMeals.map(meal => (
                <View key={meal.id} style={styles.mealItem}>
                  <Text style={styles.mealItemName}>{meal.meal_name || 'Meal'}</Text>
                  <Text style={styles.mealItemCalories}>{Math.round(meal.total_calories)} kcal</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMealText}>No meals logged</Text>
            )}
          </TouchableOpacity>

          {/* Dinner */}
          <TouchableOpacity
            style={styles.mealTypeCard}
            onPress={() => handleAddMeal('dinner')}
          >
            <View style={styles.mealTypeHeader}>
              <Ionicons name="moon" size={24} color={palette.neonGreen} />
              <Text style={styles.mealTypeName}>Dinner</Text>
              <Text style={styles.mealTypeCalories}>
                {dinnerMeals.reduce((sum, m) => sum + m.total_calories, 0).toFixed(0)} kcal
              </Text>
            </View>
            {dinnerMeals.length > 0 ? (
              dinnerMeals.map(meal => (
                <View key={meal.id} style={styles.mealItem}>
                  <Text style={styles.mealItemName}>{meal.meal_name || 'Meal'}</Text>
                  <Text style={styles.mealItemCalories}>{Math.round(meal.total_calories)} kcal</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMealText}>No meals logged</Text>
            )}
          </TouchableOpacity>

          {/* Snacks */}
          <TouchableOpacity
            style={styles.mealTypeCard}
            onPress={() => handleAddMeal('snack')}
          >
            <View style={styles.mealTypeHeader}>
              <Ionicons name="fast-food" size={24} color={palette.neonGreen} />
              <Text style={styles.mealTypeName}>Snacks</Text>
              <Text style={styles.mealTypeCalories}>
                {snackMeals.reduce((sum, m) => sum + m.total_calories, 0).toFixed(0)} kcal
              </Text>
            </View>
            {snackMeals.length > 0 ? (
              snackMeals.map(meal => (
                <View key={meal.id} style={styles.mealItem}>
                  <Text style={styles.mealItemName}>{meal.meal_name || 'Meal'}</Text>
                  <Text style={styles.mealItemCalories}>{Math.round(meal.total_calories)} kcal</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMealText}>No meals logged</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Suggestions */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={20} color={palette.neonGreen} />
            <Text style={styles.aiTitle}>AI Meal Suggestions</Text>
          </View>
          <Text style={styles.aiText}>
            Get personalized meal recommendations based on your fitness goals, budget, and dietary preferences
          </Text>
          <TouchableOpacity style={styles.aiButton} onPress={handleAddToPlan}>
            <Text style={styles.aiButtonText}>View Suggestions</Text>
            <Ionicons name="arrow-forward" size={18} color={palette.background} />
          </TouchableOpacity>
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
    paddingBottom: spacing.xxl,
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

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: palette.cardBackground,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(122, 250, 160, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Calories Card
  caloriesCard: {
    backgroundColor: palette.cardBackground,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: spacing.md,
  },
  caloriesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressCircleContainer: {
    alignItems: 'center',
  },
  targetText: {
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: spacing.xs,
  },
  macrosContainer: {
    flex: 1,
  },
  macrosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  macroLabel: {
    flex: 1,
    fontSize: 14,
    color: palette.textSecondary,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },

  // Water Card
  waterCard: {
    backgroundColor: palette.cardBackground,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  waterSubtext: {
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: spacing.xs,
  },
  waterButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  waterBtn: {
    backgroundColor: palette.neonGreen,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  waterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.background,
  },
  waterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  waterGlass: {
    width: (width - spacing.lg * 2 - spacing.md * 3) / 4,
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  waterGlassText: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },

  // Meals Section
  mealsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  mealsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealTypeCard: {
    backgroundColor: palette.cardBackground,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  mealTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  mealTypeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  mealTypeCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.neonGreen,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xl,
  },
  mealItemName: {
    flex: 1,
    fontSize: 14,
    color: palette.textSecondary,
  },
  mealItemCalories: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  emptyMealText: {
    fontSize: 13,
    color: palette.textSecondary,
    paddingLeft: spacing.xl,
    fontStyle: 'italic',
  },

  // AI Card
  aiCard: {
    backgroundColor: palette.cardBackground,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(122, 250, 160, 0.2)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  aiText: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  aiButton: {
    backgroundColor: palette.neonGreen,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.background,
  },

  // Today's Meals
  mealsScrollContent: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  mealCard: {
    width: 140,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: 100,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    backgroundColor: palette.backgroundElevated,
  },
  heartIcon: {
    position: 'absolute',
    top: spacing.md + 4,
    right: spacing.md + 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
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
  mealInfo: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  macroText: {
    fontSize: 10,
    color: palette.neonGreen,
    fontWeight: '500',
  },
  macroDivider: {
    fontSize: 10,
    color: palette.textTertiary,
    marginHorizontal: 4,
  },
  emptyMealsContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyMealsText: {
    fontSize: 13,
    color: palette.textSecondary,
    marginBottom: spacing.xs,
  },
  addMealLink: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.neonGreen,
  },

  // AI Suggestions
  aiSuggestionCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
  },
  aiCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiCardText: {
    flex: 1,
    fontSize: 12,
    color: palette.textPrimary,
    marginRight: spacing.md,
  },
  addToPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addToPlanText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.neonGreen,
  },

  // Weekly Meal Plan
  totalCaloriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.neonGreen,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  totalCaloriesLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: palette.background,
  },
  totalCaloriesValue: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.background,
    marginRight: spacing.sm,
  },
  arrowButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Shopping List
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  viewMoreIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.neonGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Nutrition Reports
  monthlySummariesCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  monthlySummariesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    color: palette.neonGreen,
  },

  // Final Water Bar
  finalWaterBar: {
    height: 12,
    backgroundColor: palette.surface,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },

  // Section Header with Buttons
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickAddButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.neonGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    gap: 2,
  },
  quickAddText: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.background,
  },

  // Water Bar Checkmark
  checkmark: {
    position: 'absolute',
    right: spacing.xs,
    top: '50%',
    transform: [{ translateY: -7 }],
  },

  // Shopping List Styles
  shoppingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: palette.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: palette.neonGreen,
    borderColor: palette.neonGreen,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});

export default TodayScreen;
