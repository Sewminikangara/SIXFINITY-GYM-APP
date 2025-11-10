import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography, radii, shadows } from '@/theme';

interface MealPlanDay {
    date: string;
    dayName: string;
    breakfast?: { name: string; calories: number };
    lunch?: { name: string; calories: number };
    dinner?: { name: string; calories: number };
    snacks?: { name: string; calories: number };
    totalCalories: number;
}

interface WeeklyMealPlansProps {
    weekPlan: MealPlanDay[];
    onSwapMeal: (day: string, mealType: string) => void;
    onRegeneratePlan: () => void;
    onGenerateShoppingList: () => void;
}

export const WeeklyMealPlans: React.FC<WeeklyMealPlansProps> = ({
    weekPlan,
    onSwapMeal,
    onRegeneratePlan,
    onGenerateShoppingList,
}) => {
    const [selectedDay, setSelectedDay] = useState(0);

    const currentDay = weekPlan[selectedDay];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="calendar" size={20} color={palette.neonGreen} />
                    <Text style={styles.title}>Weekly Meal Plan</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton} onPress={onRegeneratePlan}>
                        <Ionicons name="refresh" size={18} color={palette.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={onGenerateShoppingList}>
                        <Ionicons name="cart" size={18} color={palette.neonGreen} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Days Scroll */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.daysScroll}
            >
                {weekPlan.map((day, index) => {
                    const isSelected = index === selectedDay;
                    const isToday = index === 0; // Assuming first day is today

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayCard,
                                isSelected && styles.dayCardSelected,
                            ]}
                            onPress={() => setSelectedDay(index)}
                        >
                            {isToday && (
                                <View style={styles.todayBadge}>
                                    <Text style={styles.todayBadgeText}>Today</Text>
                                </View>
                            )}
                            <Text style={[
                                styles.dayName,
                                isSelected && styles.dayNameSelected,
                            ]}>
                                {day.dayName}
                            </Text>
                            <Text style={[
                                styles.dayDate,
                                isSelected && styles.dayDateSelected,
                            ]}>
                                {day.date}
                            </Text>
                            <Text style={[
                                styles.dayCalories,
                                isSelected && styles.dayCaloriesSelected,
                            ]}>
                                {day.totalCalories} cal
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Meal Details */}
            <LinearGradient
                colors={['#2A2A2A', '#1E1E1E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mealDetailsCard}
            >
                <Text style={styles.mealDetailsTitle}>
                    {currentDay.dayName}'s Meals
                </Text>

                {/* Breakfast */}
                {currentDay.breakfast && (
                    <View style={styles.mealRow}>
                        <View style={styles.mealRowLeft}>
                            <View style={[styles.mealIcon, { backgroundColor: '#FFD70020' }]}>
                                <Ionicons name="sunny" size={18} color="#FFD700" />
                            </View>
                            <View style={styles.mealInfo}>
                                <Text style={styles.mealType}>Breakfast</Text>
                                <Text style={styles.mealName}>{currentDay.breakfast.name}</Text>
                                <Text style={styles.mealCalories}>{currentDay.breakfast.calories} cal</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.swapButton}
                            onPress={() => onSwapMeal(currentDay.date, 'breakfast')}
                        >
                            <Ionicons name="swap-horizontal" size={18} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Lunch */}
                {currentDay.lunch && (
                    <View style={styles.mealRow}>
                        <View style={styles.mealRowLeft}>
                            <View style={[styles.mealIcon, { backgroundColor: '#FF6B6B20' }]}>
                                <Ionicons name="restaurant" size={18} color="#FF6B6B" />
                            </View>
                            <View style={styles.mealInfo}>
                                <Text style={styles.mealType}>Lunch</Text>
                                <Text style={styles.mealName}>{currentDay.lunch.name}</Text>
                                <Text style={styles.mealCalories}>{currentDay.lunch.calories} cal</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.swapButton}
                            onPress={() => onSwapMeal(currentDay.date, 'lunch')}
                        >
                            <Ionicons name="swap-horizontal" size={18} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Dinner */}
                {currentDay.dinner && (
                    <View style={styles.mealRow}>
                        <View style={styles.mealRowLeft}>
                            <View style={[styles.mealIcon, { backgroundColor: '#4ECDC420' }]}>
                                <Ionicons name="moon" size={18} color="#4ECDC4" />
                            </View>
                            <View style={styles.mealInfo}>
                                <Text style={styles.mealType}>Dinner</Text>
                                <Text style={styles.mealName}>{currentDay.dinner.name}</Text>
                                <Text style={styles.mealCalories}>{currentDay.dinner.calories} cal</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.swapButton}
                            onPress={() => onSwapMeal(currentDay.date, 'dinner')}
                        >
                            <Ionicons name="swap-horizontal" size={18} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Snacks */}
                {currentDay.snacks && (
                    <View style={styles.mealRow}>
                        <View style={styles.mealRowLeft}>
                            <View style={[styles.mealIcon, { backgroundColor: '#FFE66D20' }]}>
                                <Ionicons name="fast-food" size={18} color="#FFE66D" />
                            </View>
                            <View style={styles.mealInfo}>
                                <Text style={styles.mealType}>Snacks</Text>
                                <Text style={styles.mealName}>{currentDay.snacks.name}</Text>
                                <Text style={styles.mealCalories}>{currentDay.snacks.calories} cal</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.swapButton}
                            onPress={() => onSwapMeal(currentDay.date, 'snacks')}
                        >
                            <Ionicons name="swap-horizontal" size={18} color={palette.neonGreen} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Total */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Daily Total</Text>
                    <Text style={styles.totalValue}>{currentDay.totalCalories} calories</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        backgroundColor: palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    daysScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    dayCard: {
        backgroundColor: palette.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        paddingVertical: spacing.sm,
        minWidth: 80,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    dayCardSelected: {
        backgroundColor: palette.neonGreen,
        borderColor: palette.neonGreen,
        ...shadows.neonGlowSoft,
    },
    todayBadge: {
        position: 'absolute',
        top: -8,
        backgroundColor: palette.accentBlue,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: radii.sm,
    },
    todayBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFF',
        textTransform: 'uppercase',
    },
    dayName: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: 2,
    },
    dayNameSelected: {
        color: '#1A1A1A',
    },
    dayDate: {
        fontSize: 12,
        color: palette.textSecondary,
        marginBottom: 4,
    },
    dayDateSelected: {
        color: '#2A2A2A',
    },
    dayCalories: {
        fontSize: 11,
        fontWeight: '600',
        color: palette.textTertiary,
    },
    dayCaloriesSelected: {
        color: '#1A1A1A',
    },
    mealDetailsCard: {
        marginHorizontal: spacing.lg,
        borderRadius: radii.xl,
        padding: spacing.lg,
        ...shadows.lg,
    },
    mealDetailsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.lg,
    },
    mealRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    mealRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spacing.md,
    },
    mealIcon: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mealInfo: {
        flex: 1,
    },
    mealType: {
        fontSize: 11,
        fontWeight: '600',
        color: palette.textTertiary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    mealName: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: 2,
    },
    mealCalories: {
        fontSize: 12,
        color: palette.textSecondary,
    },
    swapButton: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        backgroundColor: '#C5FF4A20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        marginTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textSecondary,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.neonGreen,
    },
});
