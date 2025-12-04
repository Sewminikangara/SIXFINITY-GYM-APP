import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';

const WORKOUT_CATEGORIES = [
    { id: '1', name: 'Arms', icon: 'arm-flex', color: '#FF6B6B' },
    { id: '2', name: 'Chest', icon: 'weight-lifter', color: '#4ECDC4' },
    { id: '3', name: 'Legs', icon: 'run', color: '#45B7D1' },
    { id: '4', name: 'Back', icon: 'arrow-up-bold', color: '#96CEB4' },
    { id: '5', name: 'Core', icon: 'ab-testing', color: '#FFEAA7' },
    { id: '6', name: 'Cardio', icon: 'heart-pulse', color: '#FF7675' },
    { id: '7', name: 'Full Body', icon: 'human-handsup', color: '#A29BFE' },
];

const RECOMMENDED_WORKOUTS = [
    {
        id: '1',
        name: 'Upper Body Blast',
        duration: '45 min',
        difficulty: 'Intermediate',
        muscleGroups: ['Chest', 'Arms', 'Shoulders'],
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        aiReason: 'Based on your strength goals',
    },
    {
        id: '2',
        name: 'HIIT Cardio Burn',
        duration: '30 min',
        difficulty: 'Advanced',
        muscleGroups: ['Full Body', 'Cardio'],
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
        aiReason: 'Perfect for fat loss',
    },
];

const MY_WORKOUT_PLANS = [
    {
        id: '1',
        name: 'Push-Pull-Legs Plan',
        workouts: 6,
        duration: '6 weeks',
        progress: 65,
    },
    {
        id: '2',
        name: 'Beginner Strength',
        workouts: 12,
        duration: '4 weeks',
        progress: 30,
    },
];

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const WorkoutsTab = () => {
    const navigation = useNavigation<NavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Icon name="magnify" size={20} color={palette.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, body part, or goal"
                        placeholderTextColor={palette.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close-circle" size={20} color={palette.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {WORKOUT_CATEGORIES.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryCard,
                                selectedCategory === category.id && styles.categoryCardActive,
                            ]}
                            onPress={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.categoryIconContainer,
                                    { backgroundColor: category.color + '20' },
                                ]}
                            >
                                <Icon name={category.icon} size={24} color={category.color} />
                            </View>
                            <Text style={styles.categoryName}>{category.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* AI Recommended Workouts */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended for You</Text>
                    <View style={styles.aiTag}>
                        <Icon name="robot" size={14} color={palette.neonGreen} />
                        <Text style={styles.aiTagText}>AI</Text>
                    </View>
                </View>
                <Text style={styles.sectionSubtitle}>Personalized based on your goals and progress</Text>

                {RECOMMENDED_WORKOUTS.map((workout) => (
                    <TouchableOpacity
                        key={workout.id}
                        style={styles.workoutCard}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('ActiveWorkout', { workoutId: workout.id })}
                    >
                        <Image
                            source={{ uri: workout.image }}
                            style={styles.workoutImage}
                        />
                        <View style={styles.workoutInfo}>
                            <View style={styles.workoutHeader}>
                                <Text style={styles.workoutName}>{workout.name}</Text>
                                <View style={[styles.difficultyBadge, styles[`difficulty${workout.difficulty}`]]}>
                                    <Text style={styles.difficultyText}>{workout.difficulty}</Text>
                                </View>
                            </View>
                            <Text style={styles.aiReason}>✨ {workout.aiReason}</Text>
                            <View style={styles.workoutMeta}>
                                <View style={styles.metaItem}>
                                    <Icon name="clock-outline" size={14} color={palette.textSecondary} />
                                    <Text style={styles.metaText}>{workout.duration}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Icon name="dumbbell" size={14} color={palette.textSecondary} />
                                    <Text style={styles.metaText}>{workout.muscleGroups.join(', ')}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('ActiveWorkout', { workoutId: workout.id })}>
                                <LinearGradient
                                    colors={[palette.neonGreen, palette.neonGreenDim]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.startButtonGradient}
                                >
                                    <Text style={styles.startButtonText}>Start Workout</Text>
                                    <Icon name="play" size={16} color={palette.background} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* My Workout Plans */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Workout Plans</Text>
                {MY_WORKOUT_PLANS.map((plan) => (
                    <TouchableOpacity
                        key={plan.id}
                        style={styles.planCard}
                        activeOpacity={0.8}
                    >
                        <View style={styles.planHeader}>
                            <View style={styles.planIconContainer}>
                                <Icon name="clipboard-text" size={24} color={palette.neonGreen} />
                            </View>
                            <View style={styles.planInfo}>
                                <Text style={styles.planName}>{plan.name}</Text>
                                <Text style={styles.planMeta}>
                                    {plan.workouts} workouts • {plan.duration}
                                </Text>
                            </View>
                            <Icon name="chevron-right" size={24} color={palette.textSecondary} />
                        </View>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${plan.progress}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{plan.progress}%</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: palette.textPrimary,
        fontSize: 15,
        paddingVertical: 8,
    },
    section: {
        paddingTop: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: 4,
        gap: 8,
    },
    sectionTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        paddingHorizontal: spacing.lg,
        marginBottom: 4,
    },
    sectionSubtitle: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    aiTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    aiTagText: {
        color: palette.neonGreen,
        fontSize: 11,
        fontWeight: '700',
    },
    categoriesContainer: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    categoryCard: {
        alignItems: 'center',
        padding: spacing.sm,
        backgroundColor: palette.surface,
        borderRadius: 12,
        width: 85,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryCardActive: {
        borderColor: palette.neonGreen,
        backgroundColor: 'rgba(197, 255, 74, 0.1)',
    },
    categoryIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryName: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    workoutCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
    },
    workoutImage: {
        width: '100%',
        height: 180,
        backgroundColor: palette.border,
    },
    workoutInfo: {
        padding: spacing.md,
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    workoutName: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
    },
    difficultyBeginner: {
        backgroundColor: '#4ECDC420',
    },
    difficultyIntermediate: {
        backgroundColor: '#FFA50020',
    },
    difficultyAdvanced: {
        backgroundColor: '#FF634720',
    },
    difficultyText: {
        fontSize: 11,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    aiReason: {
        color: palette.neonGreen,
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 12,
    },
    workoutMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        color: palette.textSecondary,
        fontSize: 13,
    },
    startButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    startButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    startButtonText: {
        color: palette.background,
        fontSize: 15,
        fontWeight: '700',
    },
    planCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.border,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    planIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(197, 255, 74, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    planMeta: {
        color: palette.textSecondary,
        fontSize: 13,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: palette.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: palette.neonGreen,
        borderRadius: 4,
    },
    progressText: {
        color: palette.textPrimary,
        fontSize: 13,
        fontWeight: '700',
        width: 40,
        textAlign: 'right',
    },
});
