import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components';
import { palette, typography, spacing, radii } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseUserId } from '@/utils/userHelpers';
import mealPlanService, { DailyMealPlan, ShoppingListItem } from '@/services/mealPlanService';

export const PlansScreen = () => {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [weeklyPlans, setWeeklyPlans] = useState<DailyMealPlan[]>([]);
    const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
    const [showShoppingList, setShowShoppingList] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('');
    const [showAddItemForm, setShowAddItemForm] = useState(false);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const supabaseUserId = getSupabaseUserId(user);
            if (!supabaseUserId) return;

            const [plans, shopping] = await Promise.all([
                mealPlanService.getWeeklyDailyPlans('current-week'),
                mealPlanService.getShoppingList(supabaseUserId),
            ]);

            setWeeklyPlans(plans);
            setShoppingList(shopping);
        } catch (error) {
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleGenerateNewPlan = () => {
        Alert.alert(
            'Generate New Plan',
            'This will create a new AI-powered meal plan for the week based on your goals.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate',
                    onPress: async () => {
                        if (!user) return;
                        const supabaseUserId = getSupabaseUserId(user);
                        if (!supabaseUserId) return;

                        try {
                            await mealPlanService.generateWeeklyMealPlan(
                                supabaseUserId,
                                'muscle_gain',
                                'medium',
                                []
                            );
                            Alert.alert('Success', 'New meal plan generated!');
                            await loadData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to generate meal plan');
                        }
                    },
                },
            ]
        );
    };

    const toggleShoppingItem = async (itemId: string, currentStatus: boolean) => {
        try {
            await mealPlanService.toggleShoppingItemPurchased(itemId, !currentStatus);
            setShoppingList(prev =>
                prev.map(item =>
                    item.id === itemId ? { ...item, is_purchased: !currentStatus } : item
                )
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to update shopping item');
        }
    };

    const handleAddShoppingItem = async () => {
        if (!newItemName.trim()) {
            Alert.alert('Error', 'Please enter item name');
            return;
        }
        if (!user) return;

        try {
            const supabaseUserId = getSupabaseUserId(user);
            if (!supabaseUserId) return;

            const newItem = await mealPlanService.addShoppingListItem(
                supabaseUserId,
                newItemName,
                newItemQuantity || '1',
                newItemUnit || 'piece',
                'other'
            );

            setShoppingList(prev => [...prev, newItem]);

            // Reset form
            setNewItemName('');
            setNewItemQuantity('');
            setNewItemUnit('');
            setShowAddItemForm(false);

            Alert.alert('Success', 'Item added to shopping list!');
        } catch (error) {
            Alert.alert('Error', 'Failed to add item');
        }
    };

    const handleDeleteShoppingItem = (itemId: string) => {
        Alert.alert(
            'Delete Item',
            'Remove this item from shopping list?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setShoppingList(prev => prev.filter(item => item.id !== itemId));
                    }
                }
            ]
        );
    };

    const totalCalories = weeklyPlans.reduce((sum, plan) => sum + plan.total_calories, 0);
    const avgCalories = Math.round(totalCalories / 7);
    const unpurchasedItems = shoppingList.filter(item => !item.is_purchased).length;

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
                    <Text style={styles.headerTitle}>Weekly Meal Plans</Text>
                    <TouchableOpacity onPress={handleGenerateNewPlan}>
                        <Ionicons name="refresh" size={24} color={palette.neonGreen} />
                    </TouchableOpacity>
                </View>

                {/* Weekly Summary Card */}
                <LinearGradient
                    colors={['rgba(0, 255, 127, 0.15)', 'rgba(0, 255, 127, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.summaryCard}
                >
                    <View style={styles.summaryRow}>
                        <View>
                            <Text style={styles.summaryLabel}>Weekly Total</Text>
                            <Text style={styles.summaryValue}>{totalCalories.toLocaleString()} kcal</Text>
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>Daily Avg</Text>
                            <Text style={styles.summaryValue}>{avgCalories} kcal</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowShoppingList(true)}>
                            <View style={styles.shoppingBadge}>
                                <Ionicons name="cart" size={20} color={palette.neonGreen} />
                                {unpurchasedItems > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{unpurchasedItems}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Days Selector */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.daysScroll}
                    contentContainerStyle={styles.daysContent}
                >
                    {days.map((day, index) => (
                        <TouchableOpacity
                            key={day}
                            onPress={() => setSelectedDay(index)}
                            style={[
                                styles.dayCard,
                                selectedDay === index && styles.dayCardActive,
                            ]}
                        >
                            <Text style={[
                                styles.dayText,
                                selectedDay === index && styles.dayTextActive,
                            ]}>
                                {day}
                            </Text>
                            {weeklyPlans[index]?.is_completed && (
                                <View style={styles.completedDot} />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Selected Day Plan */}
                {weeklyPlans[selectedDay] && (
                    <View style={styles.dayPlanCard}>
                        <View style={styles.dayPlanHeader}>
                            <Text style={styles.dayPlanTitle}>{fullDays[selectedDay]}</Text>
                            <Text style={styles.dayPlanDate}>
                                {new Date(weeklyPlans[selectedDay].date).toLocaleDateString()}
                            </Text>
                        </View>

                        {/* Macros */}
                        <View style={styles.macrosRow}>
                            <View style={styles.macroItem}>
                                <Text style={styles.macroValue}>{weeklyPlans[selectedDay].total_calories}</Text>
                                <Text style={styles.macroLabel}>Calories</Text>
                            </View>
                            <View style={styles.macroItem}>
                                <Text style={styles.macroValue}>{weeklyPlans[selectedDay].total_protein_grams}g</Text>
                                <Text style={styles.macroLabel}>Protein</Text>
                            </View>
                            <View style={styles.macroItem}>
                                <Text style={styles.macroValue}>{weeklyPlans[selectedDay].total_carbs_grams}g</Text>
                                <Text style={styles.macroLabel}>Carbs</Text>
                            </View>
                            <View style={styles.macroItem}>
                                <Text style={styles.macroValue}>{weeklyPlans[selectedDay].total_fats_grams}g</Text>
                                <Text style={styles.macroLabel}>Fats</Text>
                            </View>
                        </View>

                        {/* Meals */}
                        <View style={styles.mealsSection}>
                            <MealSlot icon="sunny" label="Breakfast" mealId={weeklyPlans[selectedDay].breakfast_meal_id} />
                            <MealSlot icon="restaurant" label="Lunch" mealId={weeklyPlans[selectedDay].lunch_meal_id} />
                            <MealSlot icon="moon" label="Dinner" mealId={weeklyPlans[selectedDay].dinner_meal_id} />
                            <MealSlot icon="fast-food" label="Snacks" mealId={weeklyPlans[selectedDay].snack_meal_ids?.[0]} />
                        </View>

                        {/* Adherence */}
                        {weeklyPlans[selectedDay].is_completed && (
                            <View style={styles.adherenceCard}>
                                <Text style={styles.adherenceLabel}>Meal Adherence</Text>
                                <View style={styles.adherenceBar}>
                                    <View
                                        style={[
                                            styles.adherenceProgress,
                                            { width: `${weeklyPlans[selectedDay].adherence_percentage}%` },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.adherenceValue}>
                                    {weeklyPlans[selectedDay].adherence_percentage}% completed
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleGenerateNewPlan}>
                        <Ionicons name="sparkles" size={20} color={palette.neonGreen} />
                        <Text style={styles.actionBtnText}>Regenerate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="swap-horizontal" size={20} color={palette.neonGreen} />
                        <Text style={styles.actionBtnText}>Swap Meal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="create" size={20} color={palette.neonGreen} />
                        <Text style={styles.actionBtnText}>Customize</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Shopping List Modal */}
            <Modal
                visible={showShoppingList}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowShoppingList(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Shopping List</Text>
                        <TouchableOpacity onPress={() => setShowShoppingList(false)}>
                            <Ionicons name="close" size={28} color={palette.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Add Item Form */}
                        {showAddItemForm ? (
                            <View style={styles.addItemForm}>
                                <Text style={styles.addItemTitle}>Add New Item</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Item name (e.g., Chicken breast)"
                                    placeholderTextColor={palette.textTertiary}
                                    value={newItemName}
                                    onChangeText={setNewItemName}
                                />
                                <View style={styles.inputRow}>
                                    <TextInput
                                        style={[styles.input, styles.inputSmall]}
                                        placeholder="Quantity"
                                        placeholderTextColor={palette.textTertiary}
                                        value={newItemQuantity}
                                        onChangeText={setNewItemQuantity}
                                        keyboardType="decimal-pad"
                                    />
                                    <TextInput
                                        style={[styles.input, styles.inputSmall]}
                                        placeholder="Unit (kg, lbs, etc)"
                                        placeholderTextColor={palette.textTertiary}
                                        value={newItemUnit}
                                        onChangeText={setNewItemUnit}
                                    />
                                </View>
                                <View style={styles.formButtons}>
                                    <TouchableOpacity
                                        style={[styles.formButton, styles.cancelButton]}
                                        onPress={() => {
                                            setShowAddItemForm(false);
                                            setNewItemName('');
                                            setNewItemQuantity('');
                                            setNewItemUnit('');
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.formButton, styles.addButton]}
                                        onPress={handleAddShoppingItem}
                                    >
                                        <Text style={styles.addButtonText}>Add Item</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.addItemButton}
                                onPress={() => setShowAddItemForm(true)}
                            >
                                <Ionicons name="add-circle" size={24} color={palette.neonGreen} />
                                <Text style={styles.addItemButtonText}>Add Item Manually</Text>
                            </TouchableOpacity>
                        )}

                        {/* Shopping List Items */}
                        {shoppingList.map(item => (
                            <View key={item.id} style={styles.shoppingItemWrapper}>
                                <TouchableOpacity
                                    style={styles.shoppingItem}
                                    onPress={() => toggleShoppingItem(item.id, item.is_purchased)}
                                >
                                    <View style={styles.checkbox}>
                                        {item.is_purchased && (
                                            <Ionicons name="checkmark" size={18} color={palette.neonGreen} />
                                        )}
                                    </View>
                                    <View style={styles.shoppingItemContent}>
                                        <Text style={[
                                            styles.shoppingItemName,
                                            item.is_purchased && styles.shoppingItemNamePurchased,
                                        ]}>
                                            {item.ingredient_name}
                                        </Text>
                                        <Text style={styles.shoppingItemQuantity}>
                                            {item.quantity} {item.unit}
                                        </Text>
                                    </View>
                                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteItemButton}
                                    onPress={() => handleDeleteShoppingItem(item.id)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </Screen>
    );
};

const MealSlot = ({ icon, label, mealId }: { icon: string; label: string; mealId?: string }) => (
    <View style={styles.mealSlot}>
        <Ionicons name={icon as any} size={20} color={palette.neonGreen} />
        <Text style={styles.mealSlotLabel}>{label}</Text>
        <Text style={styles.mealSlotValue}>{mealId ? 'Planned' : 'Not set'}</Text>
    </View>
);

const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
        protein: '#ff6b6b',
        carbs: '#feca57',
        vegetables: '#00ff7f',
        fruits: '#ff9ff3',
        dairy: '#48dbfb',
        other: '#999',
    };
    return colors[category] || colors.other;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    content: {
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
    },
    summaryCard: {
        padding: spacing.lg,
        borderRadius: radii.lg,
        marginBottom: spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    summaryValue: {
        ...typography.heading3,
        color: palette.textPrimary,
    },
    shoppingBadge: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: palette.neonGreen,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        ...typography.caption,
        color: palette.background,
        fontSize: 10,
        fontWeight: 'bold',
    },
    daysScroll: {
        marginBottom: spacing.lg,
    },
    daysContent: {
        paddingRight: spacing.lg,
    },
    dayCard: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minWidth: 60,
        alignItems: 'center',
    },
    dayCardActive: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
    },
    dayText: {
        ...typography.bodyBold,
        color: palette.textSecondary,
    },
    dayTextActive: {
        color: palette.background,
    },
    completedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: palette.neonGreen,
        marginTop: spacing.xs,
    },
    dayPlanCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    dayPlanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    dayPlanTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
    },
    dayPlanDate: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    macrosRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.lg,
    },
    macroItem: {
        alignItems: 'center',
    },
    macroValue: {
        ...typography.heading3,
        color: palette.neonGreen,
        marginBottom: spacing.xs,
    },
    macroLabel: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    mealsSection: {
        marginBottom: spacing.lg,
    },
    mealSlot: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: palette.backgroundElevated,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
    },
    mealSlotLabel: {
        ...typography.body,
        color: palette.textPrimary,
        marginLeft: spacing.sm,
        flex: 1,
    },
    mealSlotValue: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    adherenceCard: {
        backgroundColor: palette.backgroundElevated,
        borderRadius: radii.md,
        padding: spacing.md,
    },
    adherenceLabel: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    adherenceBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: radii.sm,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    adherenceProgress: {
        height: '100%',
        backgroundColor: palette.neonGreen,
    },
    adherenceValue: {
        ...typography.caption,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        marginHorizontal: spacing.xs,
    },
    actionBtnText: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginLeft: spacing.xs,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: palette.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
    },
    modalContent: {
        flex: 1,
        padding: spacing.lg,
    },
    shoppingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: radii.sm,
        borderWidth: 2,
        borderColor: palette.neonGreen,
        marginRight: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shoppingItemContent: {
        flex: 1,
    },
    shoppingItemName: {
        ...typography.body,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    shoppingItemNamePurchased: {
        textDecorationLine: 'line-through',
        color: palette.textSecondary,
    },
    shoppingItemQuantity: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    categoryBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.sm,
    },
    categoryBadgeText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Add Item Form Styles
    addItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        marginBottom: spacing.lg,
        borderWidth: 2,
        borderColor: palette.neonGreen,
        borderStyle: 'dashed',
    },
    addItemButtonText: {
        ...typography.body,
        color: palette.neonGreen,
        marginLeft: spacing.sm,
        fontWeight: '600',
    },
    addItemForm: {
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    addItemTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    input: {
        backgroundColor: palette.backgroundElevated,
        borderRadius: radii.md,
        padding: spacing.md,
        color: palette.textPrimary,
        ...typography.body,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    inputSmall: {
        flex: 1,
    },
    formButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    formButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: palette.backgroundElevated,
        borderWidth: 1,
        borderColor: palette.textSecondary,
    },
    cancelButtonText: {
        ...typography.body,
        color: palette.textSecondary,
        fontWeight: '600',
    },
    addButton: {
        backgroundColor: palette.neonGreen,
    },
    addButtonText: {
        ...typography.body,
        color: palette.background,
        fontWeight: '600',
    },
    shoppingItemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    deleteItemButton: {
        padding: spacing.sm,
        marginLeft: spacing.sm,
    },
});
