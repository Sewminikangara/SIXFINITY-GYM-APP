import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography, radii, shadows } from '@/theme';
import { Meal } from '@/services/mealService';

interface MealCardProps {
    meal: Meal;
    onEdit: (meal: Meal) => void;
    onDelete: (mealId: string) => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onEdit, onDelete }) => {
    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Meal',
            'Are you sure you want to delete this meal?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(meal.id),
                },
            ]
        );
    };

    const getCategoryColor = () => {
        switch (meal.meal_category) {
            case 'high-protein':
                return '#FF6B6B';
            case 'high-carb':
                return '#4ECDC4';
            case 'low-carb':
                return '#FFE66D';
            case 'vegetarian':
            case 'vegan':
                return '#95E1D3';
            default:
                return palette.textSecondary;
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onEdit(meal)}
            activeOpacity={0.7}
        >
            {/* Photo if available */}
            {meal.photo_url && (
                <Image source={{ uri: meal.photo_url }} style={styles.photo} />
            )}

            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.mealName} numberOfLines={1}>
                            {meal.meal_name || 'Meal'}
                        </Text>
                        <Text style={styles.time}>{formatTime(meal.meal_time)}</Text>
                    </View>

                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => onEdit(meal)}
                            style={styles.iconButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="create-outline" size={20} color={palette.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleDelete}
                            style={styles.iconButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="trash-outline" size={20} color={palette.danger} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Nutrition Info */}
                <View style={styles.nutrition}>
                    <View style={styles.caloriesBadge}>
                        <Ionicons name="flame" size={14} color={palette.accentOrange} />
                        <Text style={styles.calories}>{Math.round(meal.total_calories)} cal</Text>
                    </View>

                    <View style={styles.macros}>
                        <View style={styles.macroItem}>
                            <Text style={styles.macroValue}>{Math.round(meal.protein_grams)}g</Text>
                            <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                            <Text style={styles.macroValue}>{Math.round(meal.carbs_grams)}g</Text>
                            <Text style={styles.macroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                            <Text style={styles.macroValue}>{Math.round(meal.fats_grams)}g</Text>
                            <Text style={styles.macroLabel}>Fats</Text>
                        </View>
                    </View>
                </View>

                {/* Category & Entry Method */}
                <View style={styles.footer}>
                    {meal.meal_category && (
                        <View style={[styles.badge, { borderColor: getCategoryColor() }]}>
                            <Text style={[styles.badgeText, { color: getCategoryColor() }]}>
                                {meal.meal_category}
                            </Text>
                        </View>
                    )}

                    <View style={styles.entryMethodBadge}>
                        <Ionicons
                            name={
                                meal.entry_method === 'photo' ? 'camera' :
                                    meal.entry_method === 'barcode' ? 'barcode' :
                                        meal.entry_method === 'ai-suggestion' ? 'sparkles' :
                                            'create'
                            }
                            size={12}
                            color={palette.textTertiary}
                        />
                        <Text style={styles.entryMethodText}>
                            {meal.entry_method === 'photo' ? 'Photo' :
                                meal.entry_method === 'barcode' ? 'Barcode' :
                                    meal.entry_method === 'ai-suggestion' ? 'AI' :
                                        'Manual'}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: palette.cardBackground,
        borderRadius: radii.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
        ...shadows.md,
    },
    photo: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    content: {
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    mealName: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: 2,
    },
    time: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    iconButton: {
        padding: spacing.xs,
    },
    nutrition: {
        marginBottom: spacing.sm,
    },
    caloriesBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.md,
        alignSelf: 'flex-start',
        marginBottom: spacing.sm,
    },
    calories: {
        ...typography.bodyBold,
        color: palette.accentOrange,
        marginLeft: 4,
    },
    macros: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    macroItem: {
        flex: 1,
        alignItems: 'center',
    },
    macroDivider: {
        width: 1,
        height: 24,
        backgroundColor: palette.border,
    },
    macroValue: {
        ...typography.bodyBold,
        color: palette.textPrimary,
    },
    macroLabel: {
        ...typography.footnote,
        color: palette.textSecondary,
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    badge: {
        borderWidth: 1,
        borderRadius: radii.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    badgeText: {
        ...typography.footnote,
        fontWeight: '600',
    },
    entryMethodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    entryMethodText: {
        ...typography.footnote,
        color: palette.textTertiary,
    },
});
