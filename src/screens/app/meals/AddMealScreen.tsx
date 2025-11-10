import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button } from '@/components';
import { palette, spacing, typography, radii } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import mealService from '@/services/mealService';
import foodSearchService, { FoodSearchResult } from '@/services/foodSearchService';

interface AddMealScreenProps {
    navigation: any;
    route?: {
        params?: {
            mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
        };
    };
}

export const AddMealScreen: React.FC<AddMealScreenProps> = ({ navigation, route }) => {
    const { user } = useAuth();
    const initialMealType = route?.params?.mealType || 'breakfast';

    // Form state
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(initialMealType);
    const [mealName, setMealName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fats, setFats] = useState('');
    const [fiber, setFiber] = useState('');
    const [servingSize, setServingSize] = useState('1');
    const [servingUnit, setServingUnit] = useState('serving');
    const [notes, setNotes] = useState('');
    const [category, setCategory] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Food search autocomplete
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const mealTypes = [
        { value: 'breakfast', label: 'Breakfast', icon: 'sunny' },
        { value: 'lunch', label: 'Lunch', icon: 'restaurant' },
        { value: 'dinner', label: 'Dinner', icon: 'moon' },
        { value: 'snack', label: 'Snack', icon: 'fast-food' },
    ];

    const categories = [
        'vegetarian',
        'vegan',
        'high-protein',
        'high-carb',
        'low-carb',
        'keto',
        'balanced',
    ];

    const servingUnits = [
        'serving',
        'piece',
        'cup',
        'gram',
        'oz',
        'ml',
        'tbsp',
        'tsp',
    ];

    // Search for foods when user types
    useEffect(() => {
        const searchFoods = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setSearching(true);
            try {
                const results = await foodSearchService.searchFoods(searchQuery);
                setSearchResults(results);
                setShowResults(results.length > 0);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        };

        // Debounce search
        const timer = setTimeout(searchFoods, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Auto-fill nutrition when user selects a food
    const handleSelectFood = (food: FoodSearchResult) => {
        setMealName(food.name);
        setCalories(food.calories.toFixed(0));
        setProtein(food.protein.toFixed(1));
        setCarbs(food.carbs.toFixed(1));
        setFats(food.fat.toFixed(1));
        setFiber(food.fiber.toFixed(1));
        setSearchQuery('');
        setShowResults(false);
        setSearchResults([]);
    };

    const validate = (): boolean => {
        if (!mealName.trim()) {
            Alert.alert('Validation Error', 'Please enter a meal name');
            return false;
        }

        if (!calories || parseFloat(calories) <= 0) {
            Alert.alert('Validation Error', 'Please enter valid calories');
            return false;
        }

        if (!protein || parseFloat(protein) < 0) {
            Alert.alert('Validation Error', 'Please enter valid protein amount');
            return false;
        }

        if (!carbs || parseFloat(carbs) < 0) {
            Alert.alert('Validation Error', 'Please enter valid carbs amount');
            return false;
        }

        if (!fats || parseFloat(fats) < 0) {
            Alert.alert('Validation Error', 'Please enter valid fats amount');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validate() || !user) return;

        try {
            setLoading(true);

            // Create meal
            const meal = await mealService.createMeal({
                user_id: user.id,
                meal_type: mealType,
                meal_name: mealName.trim(),
                total_calories: parseFloat(calories),
                protein_grams: parseFloat(protein),
                carbs_grams: parseFloat(carbs),
                fats_grams: parseFloat(fats),
                fiber_grams: fiber ? parseFloat(fiber) : undefined,
                meal_category: category || undefined,
                entry_method: 'manual',
                notes: notes.trim() || undefined,
            });

            // Add meal item
            await mealService.addMealItem({
                meal_id: meal.id,
                food_name: mealName.trim(),
                serving_size: parseFloat(servingSize),
                serving_unit: servingUnit,
                calories: parseFloat(calories),
                protein_grams: parseFloat(protein),
                carbs_grams: parseFloat(carbs),
                fats_grams: parseFloat(fats),
                fiber_grams: fiber ? parseFloat(fiber) : undefined,
                external_source: 'manual',
            });

            Alert.alert('Success', 'Meal added successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            console.error('Error saving meal:', error);
            Alert.alert('Error', 'Failed to save meal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Meal</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Food Search Section */}
                <View style={styles.searchSection}>
                    <Text style={styles.sectionLabel}>Search Food</Text>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search for chicken, rice, banana..."
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                        />
                        {searching && <ActivityIndicator size="small" color="#9FD356" />}
                    </View>

                    {/* Search Results */}
                    {showResults && searchResults.length > 0 && (
                        <View style={styles.searchResults}>
                            {searchResults.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.searchResultItem}
                                    onPress={() => handleSelectFood(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.resultLeft}>
                                        <Text style={styles.resultName} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        {item.brand && (
                                            <Text style={styles.resultBrand} numberOfLines={1}>
                                                {item.brand}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.resultRight}>
                                        <Text style={styles.resultCalories}>
                                            {Math.round(item.calories)} cal
                                        </Text>
                                        <Text style={styles.resultMacros}>
                                            {item.protein.toFixed(0)}P · {item.carbs.toFixed(0)}C · {item.fat.toFixed(0)}F
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Meal Type Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Meal Type</Text>
                    <View style={styles.mealTypeGrid}>
                        {mealTypes.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.mealTypeCard,
                                    mealType === type.value && styles.mealTypeCardActive,
                                ]}
                                onPress={() => setMealType(type.value as any)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={type.icon as any}
                                    size={24}
                                    color={mealType === type.value ? '#9FD356' : '#666'}
                                />
                                <Text
                                    style={[
                                        styles.mealTypeLabel,
                                        mealType === type.value && styles.mealTypeLabelActive,
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Meal Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Meal Name</Text>
                    <TextInput
                        style={styles.textInput}
                        value={mealName}
                        onChangeText={setMealName}
                        placeholder="e.g., Grilled Chicken Salad"
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Nutrition Summary Card - Shows calculated nutrition */}
                {(calories || protein || carbs || fats) && (
                    <View style={styles.nutritionSummaryCard}>
                        <Text style={styles.nutritionSummaryTitle}>Nutrition Summary</Text>
                        <View style={styles.nutritionSummaryGrid}>
                            <View style={styles.nutritionSummaryItem}>
                                <Text style={styles.nutritionSummaryValue}>
                                    {calories ? Math.round(parseFloat(calories)) : 0}
                                </Text>
                                <Text style={styles.nutritionSummaryLabel}>Calories</Text>
                            </View>
                            <View style={styles.nutritionSummaryDivider} />
                            <View style={styles.nutritionSummaryItem}>
                                <Text style={styles.nutritionSummaryValue}>
                                    {protein ? parseFloat(protein).toFixed(1) : '0.0'}g
                                </Text>
                                <Text style={styles.nutritionSummaryLabel}>Protein</Text>
                            </View>
                            <View style={styles.nutritionSummaryDivider} />
                            <View style={styles.nutritionSummaryItem}>
                                <Text style={styles.nutritionSummaryValue}>
                                    {carbs ? parseFloat(carbs).toFixed(1) : '0.0'}g
                                </Text>
                                <Text style={styles.nutritionSummaryLabel}>Carbs</Text>
                            </View>
                            <View style={styles.nutritionSummaryDivider} />
                            <View style={styles.nutritionSummaryItem}>
                                <Text style={styles.nutritionSummaryValue}>
                                    {fats ? parseFloat(fats).toFixed(1) : '0.0'}g
                                </Text>
                                <Text style={styles.nutritionSummaryLabel}>Fats</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Serving Size */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Serving Size</Text>
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.inputSmall]}
                            value={servingSize}
                            onChangeText={setServingSize}
                            placeholder="1"
                            placeholderTextColor={palette.textTertiary}
                            keyboardType="decimal-pad"
                        />
                        <View style={styles.pickerContainer}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.unitScroll}
                            >
                                {servingUnits.map((unit) => (
                                    <TouchableOpacity
                                        key={unit}
                                        style={[
                                            styles.unitButton,
                                            servingUnit === unit && styles.unitButtonActive,
                                        ]}
                                        onPress={() => setServingUnit(unit)}
                                    >
                                        <Text
                                            style={[
                                                styles.unitText,
                                                servingUnit === unit && styles.unitTextActive,
                                            ]}
                                        >
                                            {unit}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </View>

                {/* Nutrition Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nutrition Information *</Text>

                    <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionLabel}>Calories</Text>
                            <TextInput
                                style={styles.nutritionInput}
                                value={calories}
                                onChangeText={setCalories}
                                placeholder="0"
                                placeholderTextColor={palette.textTertiary}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.nutritionUnit}>kcal</Text>
                        </View>

                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionLabel}>Protein</Text>
                            <TextInput
                                style={styles.nutritionInput}
                                value={protein}
                                onChangeText={setProtein}
                                placeholder="0"
                                placeholderTextColor={palette.textTertiary}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.nutritionUnit}>g</Text>
                        </View>

                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionLabel}>Carbs</Text>
                            <TextInput
                                style={styles.nutritionInput}
                                value={carbs}
                                onChangeText={setCarbs}
                                placeholder="0"
                                placeholderTextColor={palette.textTertiary}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.nutritionUnit}>g</Text>
                        </View>

                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionLabel}>Fats</Text>
                            <TextInput
                                style={styles.nutritionInput}
                                value={fats}
                                onChangeText={setFats}
                                placeholder="0"
                                placeholderTextColor={palette.textTertiary}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.nutritionUnit}>g</Text>
                        </View>

                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionLabel}>Fiber</Text>
                            <TextInput
                                style={styles.nutritionInput}
                                value={fiber}
                                onChangeText={setFiber}
                                placeholder="0"
                                placeholderTextColor={palette.textTertiary}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.nutritionUnit}>g</Text>
                        </View>
                    </View>
                </View>

                {/* Category */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category (Optional)</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                    >
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryButton,
                                    category === cat && styles.categoryButtonActive,
                                ]}
                                onPress={() => setCategory(category === cat ? '' : cat)}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        category === cat && styles.categoryTextActive,
                                    ]}
                                >
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Add any additional notes..."
                        placeholderTextColor={palette.textTertiary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Save Button */}
                <Button
                    label="Save Meal"
                    variant="primary"
                    onPress={handleSave}
                    loading={loading}
                    style={styles.saveButton}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    searchSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        paddingVertical: spacing.sm,
        marginLeft: spacing.sm,
    },
    searchResults: {
        backgroundColor: '#FFFFFF',
        borderRadius: radii.md,
        marginTop: spacing.sm,
        maxHeight: 300,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    searchResultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    resultLeft: {
        flex: 2,
    },
    resultName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    resultBrand: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
    },
    resultRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    resultCalories: {
        fontSize: 15,
        fontWeight: '700',
        color: '#9FD356',
        marginBottom: 2,
    },
    resultMacros: {
        fontSize: 12,
        color: '#999',
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    title: {
        ...typography.heading2,
        color: palette.textPrimary,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: spacing.md,
    },
    mealTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    mealTypeCard: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: '#F8F8F8',
        borderRadius: radii.lg,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    mealTypeCardActive: {
        borderColor: '#9FD356',
        backgroundColor: '#FFFFFF',
    },
    mealTypeLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: spacing.xs,
    },
    mealTypeLabelActive: {
        color: '#9FD356',
        fontWeight: '600',
    },
    mealTypeButton: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: palette.cardBackground,
        borderRadius: radii.lg,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    mealTypeButtonActive: {
        borderColor: palette.neonGreen,
        backgroundColor: palette.surface,
    },
    mealTypeText: {
        ...typography.body,
        color: palette.textSecondary,
        marginTop: spacing.xs,
    },
    mealTypeTextActive: {
        color: palette.neonGreen,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#F8F8F8',
        borderRadius: radii.lg,
        padding: spacing.md,
        fontSize: 15,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textInput: {
        backgroundColor: '#F8F8F8',
        borderRadius: radii.lg,
        padding: spacing.md,
        fontSize: 15,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    row: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    inputSmall: {
        flex: 1,
    },
    pickerContainer: {
        flex: 2,
    },
    unitScroll: {
        flexDirection: 'row',
    },
    unitButton: {
        backgroundColor: palette.cardBackground,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginRight: spacing.xs,
        borderWidth: 1,
        borderColor: palette.border,
    },
    unitButtonActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    unitText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    unitTextActive: {
        color: palette.background,
        fontWeight: '600',
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    nutritionItem: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: palette.cardBackground,
        borderRadius: radii.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    nutritionLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    nutritionInput: {
        ...typography.heading3,
        color: palette.textPrimary,
        padding: 0,
        marginBottom: spacing.xs,
    },
    nutritionUnit: {
        ...typography.footnote,
        color: palette.textTertiary,
    },
    categoryScroll: {
        flexDirection: 'row',
    },
    categoryButton: {
        backgroundColor: palette.cardBackground,
        borderRadius: radii.round,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: palette.border,
    },
    categoryButtonActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    categoryText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    categoryTextActive: {
        color: palette.background,
        fontWeight: '600',
    },
    textArea: {
        height: 100,
        paddingTop: spacing.md,
    },
    saveButton: {
        marginTop: spacing.md,
    },
    // Nutrition Summary Card
    nutritionSummaryCard: {
        backgroundColor: '#9FD356',
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: '#8BC34A',
    },
    nutritionSummaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    nutritionSummaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    nutritionSummaryItem: {
        alignItems: 'center',
    },
    nutritionSummaryValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    nutritionSummaryLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FFFFFF',
        opacity: 0.9,
    },
    nutritionSummaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#FFFFFF',
        opacity: 0.3,
    },
    helperText: {
        fontSize: 13,
        color: '#999',
        marginTop: spacing.sm,
        fontStyle: 'italic',
    },
});
