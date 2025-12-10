import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { palette, spacing, typography } from '@/theme';
import { Screen } from '@/components/Screen';
import {
    getFitnessGoals,
    getPrimaryGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
} from '@/services/profileService';
import { getSupabaseUserId } from '@/utils/userHelpers';

interface FitnessGoal {
    goal_id: string;
    goal_type: string;
    goal_name: string;
    description: string | null;
    target_value: number;
    current_value: number;
    unit: string;
    start_date: string;
    target_date: string;
    is_completed: boolean;
    is_primary: boolean;
    progress_percentage: number;
}

interface GoalFormData {
    goal_type: string;
    goal_name: string;
    description: string;
    target_value: string;
    current_value: string;
    unit: string;
    target_date: string;
}

const GOAL_TYPES = [
    { value: 'weight_loss', label: 'Weight Loss', emoji: '⚖️', unit: 'kg' },
    { value: 'weight_gain', label: 'Weight Gain', emoji: '💪', unit: 'kg' },
    { value: 'muscle_gain', label: 'Muscle Gain', emoji: '🏋️', unit: 'kg' },
    { value: 'body_fat_reduction', label: 'Body Fat Reduction', emoji: '🔥', unit: '%' },
    { value: 'distance', label: 'Distance Goal', emoji: '🏃', unit: 'km' },
    { value: 'strength', label: 'Strength Goal', emoji: '💪', unit: 'kg' },
    { value: 'endurance', label: 'Endurance Goal', emoji: '⏱️', unit: 'min' },
    { value: 'flexibility', label: 'Flexibility', emoji: '🤸', unit: 'cm' },
    { value: 'custom', label: 'Custom Goal', emoji: '🎯', unit: '' },
];

export const FitnessGoalsScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState<FitnessGoal[]>([]);
    const [primaryGoal, setPrimaryGoal] = useState<FitnessGoal | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<FitnessGoal | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<GoalFormData>({
        goal_type: 'weight_loss',
        goal_name: '',
        description: '',
        target_value: '',
        current_value: '',
        unit: 'kg',
        target_date: '',
    });

    useEffect(() => {
        loadGoals();
    }, [user]);

    const loadGoals = async () => {
        if (!user?.id) return;

        const supabaseUserId = getSupabaseUserId(user);
        if (!supabaseUserId) return;

        try {
            setLoading(true);

            const { data: goalsData } = await getFitnessGoals(supabaseUserId, true);
            const { data: primary } = await getPrimaryGoal(supabaseUserId);

            setGoals(goalsData || []);
            setPrimaryGoal(primary);
        } catch (error) {
            console.error('Error loading goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = () => {
        setEditingGoal(null);
        setFormData({
            goal_type: 'weight_loss',
            goal_name: '',
            description: '',
            target_value: '',
            current_value: '0',
            unit: 'kg',
            target_date: '',
        });
        setShowAddModal(true);
    };

    const handleEditGoal = (goal: FitnessGoal) => {
        setEditingGoal(goal);
        setFormData({
            goal_type: goal.goal_type,
            goal_name: goal.goal_name,
            description: goal.description || '',
            target_value: goal.target_value.toString(),
            current_value: goal.current_value.toString(),
            unit: goal.unit,
            target_date: goal.target_date,
        });
        setShowAddModal(true);
    };

    const handleSaveGoal = async () => {
        if (!user?.id) return;

        const supabaseUserId = getSupabaseUserId(user);

        // Validation
        if (!formData.goal_name.trim()) {
            Alert.alert('Validation Error', 'Please enter a goal name');
            return;
        }

        if (!formData.target_value || !formData.target_date) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }

        try {
            setSaving(true);

            const goalData: any = {
                goal_type: formData.goal_type,
                goal_name: formData.goal_name.trim(),
                description: formData.description.trim() || null,
                target_value: parseFloat(formData.target_value),
                current_value: parseFloat(formData.current_value) || 0,
                unit: formData.unit,
                target_date: formData.target_date,
                is_primary: goals.length === 0, // First goal is primary by default
            };

            if (!supabaseUserId) {
                // Save locally if no Supabase UUID
                console.log('[Goals] No UUID - saving locally');
                const localGoals = [...goals];

                if (editingGoal) {
                    const index = localGoals.findIndex(g => g.goal_id === editingGoal.goal_id);
                    if (index !== -1) {
                        localGoals[index] = { ...editingGoal, ...goalData };
                    }
                } else {
                    const newGoal: FitnessGoal = {
                        goal_id: `local_${Date.now()}`,
                        ...goalData,
                        start_date: new Date().toISOString(),
                        is_completed: false,
                        progress_percentage: 0,
                    };
                    localGoals.push(newGoal);
                }

                setGoals(localGoals);
                Alert.alert('Success', editingGoal ? 'Goal updated!' : 'Goal created!');
                setShowAddModal(false);
                return;
            }

            if (editingGoal) {
                const { error } = await updateGoal(editingGoal.goal_id, goalData);
                if (error) throw error;
                Alert.alert('Success', 'Goal updated successfully');
            } else {
                const { error } = await createGoal(supabaseUserId, goalData);
                if (error) throw error;
                Alert.alert('Success', 'Goal created successfully');
            }

            setShowAddModal(false);
            loadGoals();
        } catch (error: any) {
            console.error('Error saving goal:', error);
            Alert.alert('Error', 'Failed to save goal');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGoal = (goal: FitnessGoal) => {
        Alert.alert('Delete Goal', `Are you sure you want to delete "${goal.goal_name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const { error } = await deleteGoal(goal.goal_id);
                        if (error) throw error;
                        Alert.alert('Success', 'Goal deleted successfully');
                        loadGoals();
                    } catch (error) {
                        console.error('Error deleting goal:', error);
                        Alert.alert('Error', 'Failed to delete goal');
                    }
                },
            },
        ]);
    };

    const handleSetPrimary = async (goal: FitnessGoal) => {
        if (!user?.id) return;

        const supabaseUserId = getSupabaseUserId(user);
        if (!supabaseUserId) return;

        try {
            const { error } = await updateGoal(goal.goal_id, { is_primary: true });
            if (error) throw error;
            Alert.alert('Success', 'Primary goal updated');
            loadGoals();
        } catch (error) {
            console.error('Error setting primary goal:', error);
            Alert.alert('Error', 'Failed to set primary goal');
        }
    };

    const handleUpdateProgress = (goal: FitnessGoal) => {
        Alert.prompt(
            'Update Progress',
            `Current: ${goal.current_value} ${goal.unit}\nEnter new value:`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async (value) => {
                        if (!value) return;
                        try {
                            const { error } = await updateGoalProgress(goal.goal_id, parseFloat(value));
                            if (error) throw error;
                            Alert.alert('Success', 'Progress updated');
                            loadGoals();
                        } catch (error) {
                            console.error('Error updating progress:', error);
                            Alert.alert('Error', 'Failed to update progress');
                        }
                    },
                },
            ],
            'plain-text',
            goal.current_value.toString()
        );
    };

    const getGoalTypeInfo = (type: string) => {
        return GOAL_TYPES.find((t) => t.value === type) || GOAL_TYPES[0];
    };

    const ProgressBar = ({ percentage }: { percentage: number }) => {
        const clampedPercentage = Math.min(100, Math.max(0, percentage));
        return (
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${clampedPercentage}%` }]} />
            </View>
        );
    };

    const GoalCard = ({ goal }: { goal: FitnessGoal }) => {
        const typeInfo = getGoalTypeInfo(goal.goal_type);
        const daysLeft = Math.ceil(
            (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
            <View style={[styles.goalCard, goal.is_primary && styles.goalCardPrimary]}>
                {goal.is_primary && (
                    <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Primary Goal</Text>
                    </View>
                )}

                <View style={styles.goalHeader}>
                    <View style={styles.goalHeaderLeft}>
                        <View style={styles.goalTitleContainer}>
                            <Text style={styles.goalName}>{goal.goal_name}</Text>
                            {goal.description && (
                                <Text style={styles.goalDescription} numberOfLines={2}>
                                    {goal.description}
                                </Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleEditGoal(goal)}
                        style={styles.editButton}
                    >
                        <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.goalProgress}>
                    <View style={styles.goalProgressHeader}>
                        <Text style={styles.goalProgressText}>
                            {goal.current_value} / {goal.target_value} {goal.unit}
                        </Text>
                        <Text style={styles.goalProgressPercentage}>
                            {goal.progress_percentage.toFixed(0)}%
                        </Text>
                    </View>
                    <ProgressBar percentage={goal.progress_percentage} />
                </View>

                <View style={styles.goalFooter}>
                    <Text style={styles.goalDaysLeft}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                    </Text>
                    <View style={styles.goalActions}>
                        {!goal.is_primary && (
                            <TouchableOpacity
                                onPress={() => handleSetPrimary(goal)}
                                style={styles.actionButton}
                            >
                                <Text style={styles.actionButtonText}>Set Primary</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => handleUpdateProgress(goal)}
                            style={[styles.actionButton, styles.actionButtonPrimary]}
                        >
                            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                                Update
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDeleteGoal(goal)}
                            style={[styles.actionButton, styles.actionButtonDanger]}
                        >
                            <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                                Delete
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <Screen>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={palette.brandPrimary} />
                    <Text style={styles.loadingText}>Loading goals...</Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <View style={styles.simpleHeader}>
                <Text style={styles.screenTitle}>Fitness Goals</Text>
                <TouchableOpacity onPress={handleAddGoal} style={styles.addButton}>
                    <Text style={styles.addButtonText}>ADD</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Primary Goal Highlight */}
                {primaryGoal && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Primary Goal</Text>
                        <GoalCard goal={primaryGoal} />
                    </View>
                )}

                {/* All Goals */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>All Goals ({goals.length})</Text>
                    {goals.length > 0 ? (
                        goals.map((goal) => <GoalCard key={goal.goal_id} goal={goal} />)
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No goals set yet</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Tap the "ADD" button to create your first fitness goal
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Add/Edit Goal Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowAddModal(false)}
            >
                <Screen>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {editingGoal ? 'Edit Goal' : 'Add Goal'}
                        </Text>
                        <TouchableOpacity
                            onPress={handleSaveGoal}
                            disabled={saving}
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={palette.textPrimary} />
                            ) : (
                                <Text style={styles.saveButtonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Goal Type</Text>
                            <View style={styles.goalTypesGrid}>
                                {GOAL_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={[
                                            styles.goalTypeOption,
                                            formData.goal_type === type.value && styles.goalTypeOptionSelected,
                                        ]}
                                        onPress={() =>
                                            setFormData({ ...formData, goal_type: type.value, unit: type.unit })
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.goalTypeLabel,
                                                formData.goal_type === type.value && styles.goalTypeLabelSelected,
                                            ]}
                                        >
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Goal Details</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Goal Name <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.goal_name}
                                    onChangeText={(text) => setFormData({ ...formData, goal_name: text })}
                                    placeholder="e.g., Lose 10kg"
                                    placeholderTextColor={palette.textTertiary}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={formData.description}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                    placeholder="Add details about your goal..."
                                    placeholderTextColor={palette.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>
                                        Current Value <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.current_value}
                                        onChangeText={(text) => setFormData({ ...formData, current_value: text })}
                                        placeholder="0"
                                        placeholderTextColor={palette.textTertiary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>

                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>
                                        Target Value <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.target_value}
                                        onChangeText={(text) => setFormData({ ...formData, target_value: text })}
                                        placeholder="10"
                                        placeholderTextColor={palette.textTertiary}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Unit <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.unit}
                                    onChangeText={(text) => setFormData({ ...formData, unit: text })}
                                    placeholder="kg, km, reps, etc."
                                    placeholderTextColor={palette.textTertiary}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Target Date <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.target_date}
                                    onChangeText={(text) => setFormData({ ...formData, target_date: text })}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={palette.textTertiary}
                                />
                                <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2025-12-31)</Text>
                            </View>
                        </View>

                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                </Screen>
            </Modal>
        </Screen>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    loadingText: {
        ...typography.body,
        color: palette.textSecondary,
    },
    simpleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    screenTitle: {
        ...typography.heading1,
        color: palette.textPrimary,
        fontSize: 28,
        fontWeight: '700',
    },
    addButton: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 8,
    },
    addButtonText: {
        ...typography.subtitle,
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.subtitle,
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    // Goal Card
    goalCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    goalCardPrimary: {
        borderColor: palette.brandPrimary,
    },
    primaryBadge: {
        backgroundColor: palette.brandPrimary,
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 6,
        marginBottom: spacing.sm,
    },
    primaryBadgeText: {
        ...typography.caption,
        color: palette.textPrimary,
        fontSize: 11,
        fontWeight: '700',
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    goalHeaderLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    goalEmoji: {
        fontSize: 32,
        marginRight: spacing.sm,
    },
    goalTitleContainer: {
        flex: 1,
    },
    goalName: {
        ...typography.heading3,
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    goalDescription: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
    },
    editButton: {
        padding: spacing.xs,
    },
    editButtonText: {
        fontSize: 20,
    },
    goalProgress: {
        marginBottom: spacing.md,
    },
    goalProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    goalProgressText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    goalProgressPercentage: {
        ...typography.body,
        color: palette.neonGreen,
        fontSize: 15,
        fontWeight: '700',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: palette.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: palette.neonGreen,
        borderRadius: 4,
    },
    goalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    goalDaysLeft: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
    },
    goalActions: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    actionButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 6,
        backgroundColor: palette.border,
    },
    actionButtonPrimary: {
        backgroundColor: palette.brandPrimary,
    },
    actionButtonDanger: {
        backgroundColor: palette.danger,
    },
    actionButtonText: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    actionButtonTextPrimary: {
        color: palette.textPrimary,
    },
    actionButtonTextDanger: {
        color: palette.textPrimary,
    },
    // Empty State
    emptyState: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.xxl,
        alignItems: 'center',
    },
    emptyStateEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyStateText: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    emptyStateSubtext: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
        textAlign: 'center',
    },
    bottomSpacer: {
        height: spacing.xxl,
    },
    // Modal
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    modalTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    cancelButton: {
        padding: spacing.sm,
    },
    cancelButtonText: {
        ...typography.subtitle,
        color: palette.brandPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        ...typography.subtitle,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    modalScrollView: {
        flex: 1,
    },
    modalSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    modalSectionTitle: {
        ...typography.subtitle,
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    goalTypesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    goalTypeOption: {
        width: '30%',
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 12,
        paddingVertical: spacing.md,
        alignItems: 'center',
        gap: spacing.xs,
    },
    goalTypeOptionSelected: {
        backgroundColor: palette.brandPrimary,
        borderColor: palette.brandPrimary,
    },
    goalTypeEmoji: {
        fontSize: 24,
    },
    goalTypeLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    goalTypeLabelSelected: {
        color: palette.textPrimary,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    required: {
        color: palette.danger,
    },
    input: {
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    helperText: {
        ...typography.caption,
        color: palette.textTertiary,
        fontSize: 12,
        marginTop: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    halfWidth: {
        flex: 1,
    },
});
