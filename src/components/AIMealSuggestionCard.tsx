import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography, radii, shadows } from '@/theme';

interface AIMealSuggestion {
    id: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    imageUrl?: string;
    reason: string;
    matchScore: number;
    tags: string[];
}

interface AIMealSuggestionCardProps {
    suggestion: AIMealSuggestion;
    onAddToPlan: (suggestion: AIMealSuggestion) => void;
    onViewRecipe: (suggestion: AIMealSuggestion) => void;
}

export const AIMealSuggestionCard: React.FC<AIMealSuggestionCardProps> = ({
    suggestion,
    onAddToPlan,
    onViewRecipe,
}) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#2A2A2A', '#1E1E1E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Header with AI Badge */}
                <View style={styles.header}>
                    <View style={styles.aiBadge}>
                        <Ionicons name="sparkles" size={14} color="#FFD700" />
                        <Text style={styles.aiBadgeText}>AI Recommended</Text>
                    </View>
                    <View style={styles.matchScore}>
                        <Ionicons name="checkmark-circle" size={14} color={palette.neonGreen} />
                        <Text style={styles.matchScoreText}>{suggestion.matchScore}% Match</Text>
                    </View>
                </View>

                {/* Image */}
                {suggestion.imageUrl && (
                    <Image source={{ uri: suggestion.imageUrl }} style={styles.image} />
                )}

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.name}>{suggestion.name}</Text>
                    <Text style={styles.description} numberOfLines={2}>
                        {suggestion.description}
                    </Text>

                    {/* Reason */}
                    <View style={styles.reasonContainer}>
                        <Ionicons name="information-circle-outline" size={14} color={palette.accentBlue} />
                        <Text style={styles.reasonText}>{suggestion.reason}</Text>
                    </View>

                    {/* Nutrition */}
                    <View style={styles.nutrition}>
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{suggestion.calories}</Text>
                            <Text style={styles.nutritionLabel}>cal</Text>
                        </View>
                        <View style={styles.nutritionDivider} />
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{suggestion.protein}g</Text>
                            <Text style={styles.nutritionLabel}>protein</Text>
                        </View>
                        <View style={styles.nutritionDivider} />
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{suggestion.carbs}g</Text>
                            <Text style={styles.nutritionLabel}>carbs</Text>
                        </View>
                        <View style={styles.nutritionDivider} />
                        <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{suggestion.fats}g</Text>
                            <Text style={styles.nutritionLabel}>fats</Text>
                        </View>
                    </View>

                    {/* Tags */}
                    <View style={styles.tags}>
                        {suggestion.tags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.viewRecipeButton}
                            onPress={() => onViewRecipe(suggestion)}
                        >
                            <Ionicons name="book-outline" size={16} color={palette.textSecondary} />
                            <Text style={styles.viewRecipeText}>View Recipe</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => onAddToPlan(suggestion)}
                        >
                            <LinearGradient
                                colors={[palette.neonGreen, palette.neonGreenDim]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.addButtonGradient}
                            >
                                <Ionicons name="add-circle" size={18} color="#1A1A1A" />
                                <Text style={styles.addButtonText}>Add to Plan</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginRight: spacing.md,
        width: 280,
    },
    gradient: {
        borderRadius: radii.xl,
        overflow: 'hidden',
        ...shadows.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        paddingBottom: spacing.sm,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD70020',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
        gap: 4,
    },
    aiBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFD700',
        textTransform: 'uppercase',
    },
    matchScore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    matchScoreText: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.neonGreen,
    },
    image: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
    },
    content: {
        padding: spacing.md,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    description: {
        fontSize: 13,
        color: palette.textSecondary,
        lineHeight: 18,
        marginBottom: spacing.sm,
    },
    reasonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        padding: spacing.sm,
        borderRadius: radii.md,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    reasonText: {
        flex: 1,
        fontSize: 12,
        color: palette.accentBlue,
        fontStyle: 'italic',
    },
    nutrition: {
        flexDirection: 'row',
        backgroundColor: palette.surface,
        borderRadius: radii.md,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    nutritionItem: {
        flex: 1,
        alignItems: 'center',
    },
    nutritionDivider: {
        width: 1,
        backgroundColor: palette.border,
    },
    nutritionValue: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    nutritionLabel: {
        fontSize: 10,
        color: palette.textTertiary,
        marginTop: 2,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    tag: {
        backgroundColor: palette.surface,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderColor: palette.border,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600',
        color: palette.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    viewRecipeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surface,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: palette.border,
    },
    viewRecipeText: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.textSecondary,
    },
    addButton: {
        flex: 1,
        borderRadius: radii.md,
        overflow: 'hidden',
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    addButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A1A1A',
    },
});
