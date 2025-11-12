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
    getLatestBodyStats,
    getBodyStatsHistory,
    updateBodyStats,
    calculateBMI,
} from '@/services/profileService';

interface BodyStats {
    weight_kg: number;
    height_cm: number;
    body_fat_percentage: number | null;
    muscle_mass_kg: number | null;
    bmi: number | null;
    chest_cm: number | null;
    waist_cm: number | null;
    hips_cm: number | null;
    recorded_at: string;
}

interface NewStatForm {
    weight_kg: string;
    height_cm: string;
    body_fat_percentage: string;
    muscle_mass_kg: string;
    chest_cm: string;
    waist_cm: string;
    hips_cm: string;
}

export const BodyStatsScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [currentStats, setCurrentStats] = useState<BodyStats | null>(null);
    const [history, setHistory] = useState<BodyStats[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<NewStatForm>({
        weight_kg: '',
        height_cm: '',
        body_fat_percentage: '',
        muscle_mass_kg: '',
        chest_cm: '',
        waist_cm: '',
        hips_cm: '',
    });

    useEffect(() => {
        loadBodyStats();
    }, [user]);

    const loadBodyStats = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Get latest stats
            const { data: latest } = await getLatestBodyStats(user.id);

            // Get history (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: historyData } = await getBodyStatsHistory(
                user.id,
                thirtyDaysAgo.toISOString().split('T')[0]
            );

            setCurrentStats(latest);
            setHistory(historyData || []);

            // Pre-fill form with current stats
            if (latest) {
                setFormData({
                    weight_kg: latest.weight_kg.toString(),
                    height_cm: latest.height_cm.toString(),
                    body_fat_percentage: latest.body_fat_percentage?.toString() || '',
                    muscle_mass_kg: latest.muscle_mass_kg?.toString() || '',
                    chest_cm: latest.chest_cm?.toString() || '',
                    waist_cm: latest.waist_cm?.toString() || '',
                    hips_cm: latest.hips_cm?.toString() || '',
                });
            }
        } catch (error) {
            console.error('Error loading body stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStats = async () => {
        if (!user?.id) return;

        // Validation
        if (!formData.weight_kg || !formData.height_cm) {
            Alert.alert('Validation Error', 'Weight and height are required');
            return;
        }

        try {
            setSaving(true);

            const statsData: any = {
                weight_kg: parseFloat(formData.weight_kg),
                height_cm: parseFloat(formData.height_cm),
                body_fat_percentage: formData.body_fat_percentage
                    ? parseFloat(formData.body_fat_percentage)
                    : null,
                muscle_mass_kg: formData.muscle_mass_kg ? parseFloat(formData.muscle_mass_kg) : null,
                chest_cm: formData.chest_cm ? parseFloat(formData.chest_cm) : null,
                waist_cm: formData.waist_cm ? parseFloat(formData.waist_cm) : null,
                hips_cm: formData.hips_cm ? parseFloat(formData.hips_cm) : null,
            };

            const { error } = await updateBodyStats(user.id, statsData);

            if (error) {
                throw error;
            }

            Alert.alert('Success', 'Body stats updated successfully');
            setShowAddModal(false);
            loadBodyStats(); // Reload data
        } catch (error: any) {
            console.error('Error updating body stats:', error);
            Alert.alert('Error', 'Failed to update body stats');
        } finally {
            setSaving(false);
        }
    };

    const getBMICategory = (bmi: number): { label: string; color: string } => {
        if (bmi < 18.5) return { label: 'Underweight', color: palette.warning };
        if (bmi < 25) return { label: 'Normal', color: palette.success };
        if (bmi < 30) return { label: 'Overweight', color: palette.warning };
        return { label: 'Obese', color: palette.danger };
    };

    const calculateTrend = (stat: 'weight' | 'bmi'): { value: number; isPositive: boolean } => {
        if (history.length < 2) return { value: 0, isPositive: true };

        const latest = history[history.length - 1];
        const previous = history[history.length - 2];

        let latestValue = 0;
        let previousValue = 0;

        if (stat === 'weight') {
            latestValue = latest.weight_kg;
            previousValue = previous.weight_kg;
        } else {
            latestValue = latest.bmi || 0;
            previousValue = previous.bmi || 0;
        }

        const diff = latestValue - previousValue;
        return {
            value: Math.abs(diff),
            isPositive: diff >= 0,
        };
    };

    const StatCard = ({
        title,
        value,
        unit,
        emoji,
        subtitle,
        trend,
    }: {
        title: string;
        value: number | null;
        unit: string;
        emoji: string;
        subtitle?: string;
        trend?: { value: number; isPositive: boolean };
    }) => (
        <View style={styles.statCard}>
            <View style={styles.statHeader}>
                <Text style={styles.statEmoji}>{emoji}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
            <Text style={styles.statValue}>
                {value !== null ? value.toFixed(1) : '--'}
                <Text style={styles.statUnit}> {unit}</Text>
            </Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
            {trend && (
                <View style={styles.trendContainer}>
                    <Text style={[styles.trendText, trend.isPositive ? styles.trendUp : styles.trendDown]}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value.toFixed(1)} {unit}
                    </Text>
                </View>
            )}
        </View>
    );

    const MeasurementRow = ({
        label,
        value,
        unit,
    }: {
        label: string;
        value: number | null;
        unit: string;
    }) => (
        <View style={styles.measurementRow}>
            <Text style={styles.measurementLabel}>{label}</Text>
            <Text style={styles.measurementValue}>
                {value !== null ? `${value.toFixed(1)} ${unit}` : 'Not recorded'}
            </Text>
        </View>
    );

    const HistoryItem = ({ item }: { item: BodyStats }) => {
        const date = new Date(item.recorded_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        return (
            <View style={styles.historyItem}>
                <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formattedDate}</Text>
                    <Text style={styles.historyDetails}>
                        {item.weight_kg}kg • BMI {item.bmi?.toFixed(1) || 'N/A'}
                    </Text>
                </View>
                <View style={styles.historyRight}>
                    <Text style={styles.historyWeight}>{item.weight_kg} kg</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <Screen>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={palette.brandPrimary} />
                    <Text style={styles.loadingText}>Loading body stats...</Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Body Stats</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Current Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Current Stats</Text>

                    {currentStats ? (
                        <>
                            <View style={styles.statsGrid}>
                                <StatCard
                                    title="Weight"
                                    value={currentStats.weight_kg}
                                    unit="kg"
                                    emoji="⚖️"
                                    trend={calculateTrend('weight')}
                                />
                                <StatCard
                                    title="Height"
                                    value={currentStats.height_cm}
                                    unit="cm"
                                    emoji="📏"
                                />
                            </View>

                            <View style={styles.statsGrid}>
                                <StatCard
                                    title="BMI"
                                    value={currentStats.bmi}
                                    unit=""
                                    emoji="📊"
                                    subtitle={
                                        currentStats.bmi ? getBMICategory(currentStats.bmi).label : undefined
                                    }
                                    trend={calculateTrend('bmi')}
                                />
                                <StatCard
                                    title="Body Fat"
                                    value={currentStats.body_fat_percentage}
                                    unit="%"
                                    emoji="💪"
                                />
                            </View>

                            <View style={styles.statsGrid}>
                                <StatCard
                                    title="Muscle Mass"
                                    value={currentStats.muscle_mass_kg}
                                    unit="kg"
                                    emoji="💪"
                                />
                            </View>
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateEmoji}>📊</Text>
                            <Text style={styles.emptyStateText}>No stats recorded yet</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Tap the "+ Add" button to record your first measurement
                            </Text>
                        </View>
                    )}
                </View>

                {/* Body Measurements */}
                {currentStats && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Body Measurements</Text>
                        <View style={styles.measurementsCard}>
                            <MeasurementRow label="Chest" value={currentStats.chest_cm} unit="cm" />
                            <MeasurementRow label="Waist" value={currentStats.waist_cm} unit="cm" />
                            <MeasurementRow label="Hips" value={currentStats.hips_cm} unit="cm" />
                        </View>
                    </View>
                )}

                {/* History */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>History (Last 30 Days)</Text>
                    {history.length > 0 ? (
                        <View style={styles.historyCard}>
                            {history.map((item, index) => (
                                <HistoryItem key={index} item={item} />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No history available</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Add Stats Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowAddModal(false)}
            >
                <Screen>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.backButton}>
                            <Text style={styles.backButtonText}>‹ Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add Measurement</Text>
                        <TouchableOpacity
                            onPress={handleAddStats}
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
                            <Text style={styles.modalSectionTitle}>Essential Measurements</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Weight (kg) <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.weight_kg}
                                    onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
                                    placeholder="70.5"
                                    placeholderTextColor={palette.textTertiary}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Height (cm) <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.height_cm}
                                    onChangeText={(text) => setFormData({ ...formData, height_cm: text })}
                                    placeholder="175"
                                    placeholderTextColor={palette.textTertiary}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Body Composition (Optional)</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Body Fat %</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.body_fat_percentage}
                                    onChangeText={(text) => setFormData({ ...formData, body_fat_percentage: text })}
                                    placeholder="15.0"
                                    placeholderTextColor={palette.textTertiary}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Muscle Mass (kg)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.muscle_mass_kg}
                                    onChangeText={(text) => setFormData({ ...formData, muscle_mass_kg: text })}
                                    placeholder="55.0"
                                    placeholderTextColor={palette.textTertiary}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Body Measurements (Optional)</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Chest (cm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.chest_cm}
                                    onChangeText={(text) => setFormData({ ...formData, chest_cm: text })}
                                    placeholder="95.0"
                                    placeholderTextColor={palette.textTertiary}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Waist (cm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.waist_cm}
                                    onChangeText={(text) => setFormData({ ...formData, waist_cm: text })}
                                    placeholder="80.0"
                                    placeholderTextColor={palette.textTertiary}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Hips (cm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.hips_cm}
                                    onChangeText={(text) => setFormData({ ...formData, hips_cm: text })}
                                    placeholder="95.0"
                                    placeholderTextColor={palette.textTertiary}
                                    keyboardType="decimal-pad"
                                />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    backButton: {
        padding: spacing.sm,
    },
    backButtonText: {
        ...typography.subtitle,
        color: palette.brandPrimary,
        fontSize: 32,
        fontWeight: '300',
    },
    headerTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    addButton: {
        backgroundColor: palette.brandPrimary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 8,
    },
    addButtonText: {
        ...typography.subtitle,
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: '600',
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
    // Stats Cards
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: palette.surface,
        padding: spacing.lg,
        borderRadius: 16,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statEmoji: {
        fontSize: 20,
        marginRight: spacing.xs,
    },
    statTitle: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    statValue: {
        ...typography.heading1,
        color: palette.textPrimary,
        fontSize: 32,
        fontWeight: '700',
    },
    statUnit: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 16,
        fontWeight: '400',
    },
    statSubtitle: {
        ...typography.caption,
        color: palette.neonGreen,
        fontSize: 12,
        fontWeight: '600',
        marginTop: spacing.xs,
    },
    trendContainer: {
        marginTop: spacing.xs,
    },
    trendText: {
        ...typography.caption,
        fontSize: 12,
        fontWeight: '600',
    },
    trendUp: {
        color: palette.danger,
    },
    trendDown: {
        color: palette.success,
    },
    // Measurements
    measurementsCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.md,
    },
    measurementRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 0.5,
        borderBottomColor: palette.border,
    },
    measurementLabel: {
        ...typography.body,
        color: palette.textSecondary,
        fontSize: 15,
    },
    measurementValue: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    // History
    historyCard: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        overflow: 'hidden',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 0.5,
        borderBottomColor: palette.border,
    },
    historyLeft: {
        flex: 1,
    },
    historyDate: {
        ...typography.body,
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    historyDetails: {
        ...typography.caption,
        color: palette.textSecondary,
        fontSize: 13,
    },
    historyRight: {},
    historyWeight: {
        ...typography.heading3,
        color: palette.neonGreen,
        fontSize: 18,
        fontWeight: '700',
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
});
