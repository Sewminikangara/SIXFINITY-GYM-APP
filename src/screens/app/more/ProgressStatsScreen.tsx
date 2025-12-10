import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import * as profileService from '@/services/profileService';
import { getSupabaseUserId } from '@/utils/userHelpers';

const { width } = Dimensions.get('window');

interface StatCard {
    title: string;
    value: string;
    unit: string;
    change: number;
}

export default function ProgressStatsScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

    const [stats, setStats] = useState<StatCard[]>([
        { title: 'Weight', value: '0', unit: 'kg', change: 0 },
        { title: 'BMI', value: '0', unit: '', change: 0 },
        { title: 'Body Fat', value: '0', unit: '%', change: 0 },
        { title: 'Muscle Mass', value: '0', unit: 'kg', change: 0 },
    ]);

    useEffect(() => {
        loadProgressData();
    }, [user, selectedPeriod]);

    const loadProgressData = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Get Supabase UUID
            const supabaseUserId = getSupabaseUserId(user);
            if (!supabaseUserId) {
                setLoading(false);
                return;
            }

            const { data: statsData, error } = await profileService.getBodyStatsHistory(supabaseUserId);

            if (!error && statsData && statsData.length > 0) {
                const latest = statsData[0];
                const previous = statsData[1] || latest;

                const weightChange = latest.weight_kg - (previous.weight_kg || latest.weight_kg);
                const bmiChange = latest.bmi - (previous.bmi || latest.bmi);
                const bodyFatChange = latest.body_fat_percentage - (previous.body_fat_percentage || latest.body_fat_percentage);
                const muscleMassChange = latest.muscle_mass_kg - (previous.muscle_mass_kg || latest.muscle_mass_kg);

                setStats([
                    { title: 'Weight', value: latest.weight_kg?.toFixed(1) || '0', unit: 'kg', change: weightChange },
                    { title: 'BMI', value: latest.bmi?.toFixed(1) || '0', unit: '', change: bmiChange },
                    { title: 'Body Fat', value: latest.body_fat_percentage?.toFixed(1) || '0', unit: '%', change: bodyFatChange },
                    { title: 'Muscle Mass', value: latest.muscle_mass_kg?.toFixed(1) || '0', unit: 'kg', change: muscleMassChange },
                ]);
            }
        } catch (error) {
            console.error('Error loading progress data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadProgressData();
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={palette.brandPrimary} />
                    <Text style={styles.loadingText}>Loading your progress...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.brandPrimary} />}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Progress and Stats</Text>
                    <View style={styles.headerRight} />
                </View>

                <View style={styles.periodSelector}>
                    {(['week', 'month', 'year'] as const).map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
                            onPress={() => setSelectedPeriod(period)}
                        >
                            <Text style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}>
                                {period === 'week' ? '7 Days' : period === 'month' ? '30 Days' : 'Year'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <View key={index} style={styles.statCard}>
                            <Text style={styles.statTitle}>{stat.title}</Text>
                            <View style={styles.statValueContainer}>
                                <Text style={styles.statValue}>
                                    {stat.value}
                                    <Text style={styles.statUnit}> {stat.unit}</Text>
                                </Text>
                            </View>
                            {stat.change !== 0 && (
                                <View style={[styles.statChange, stat.change < 0 && styles.statChangeNegative]}>
                                    <Text style={[styles.statChangeText, stat.change < 0 && styles.statChangeTextNegative]}>
                                        {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)} {stat.unit}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={styles.actionsSection}>
                    <Text style={styles.actionsSectionTitle}>Quick Actions</Text>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('BodyStats' as never)}>
                        <View style={styles.actionButtonContent}>
                            <Text style={styles.actionButtonText}>Update Body Stats</Text>
                            <Text style={styles.actionButtonSubtext}>Record your latest measurements</Text>
                        </View>
                        <Text style={styles.actionButtonChevron}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('FitnessGoals' as never)}>
                        <View style={styles.actionButtonContent}>
                            <Text style={styles.actionButtonText}>Fitness Goals</Text>
                            <Text style={styles.actionButtonSubtext}>Set and track your goals</Text>
                        </View>
                        <Text style={styles.actionButtonChevron}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Achievements' as never)}>
                        <View style={styles.actionButtonContent}>
                            <Text style={styles.actionButtonText}>Achievements</Text>
                            <Text style={styles.actionButtonSubtext}>View your earned badges</Text>
                        </View>
                        <Text style={styles.actionButtonChevron}>›</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: spacing.md, fontSize: 16, color: palette.textSecondary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 16, color: palette.brandPrimary, fontWeight: '600' },
    headerTitle: { fontSize: 24, fontWeight: '700', color: palette.textPrimary },
    headerRight: { width: 40 },
    periodSelector: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.lg, backgroundColor: palette.surface, borderRadius: 12, padding: 4 },
    periodButton: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: 8 },
    periodButtonActive: { backgroundColor: palette.brandPrimary },
    periodButtonText: { fontSize: 14, fontWeight: '600', color: palette.textSecondary },
    periodButtonTextActive: { color: '#000000' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md },
    statCard: { width: (width - spacing.lg * 2 - spacing.md) / 2, backgroundColor: palette.surface, borderRadius: 16, padding: spacing.md, alignItems: 'center' },
    statTitle: { fontSize: 13, color: palette.textSecondary, marginBottom: spacing.xs },
    statValueContainer: { marginBottom: spacing.xs },
    statValue: { fontSize: 28, fontWeight: '700', color: palette.textPrimary },
    statUnit: { fontSize: 16, fontWeight: '400', color: palette.textSecondary },
    statChange: { backgroundColor: '#dcfce7', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
    statChangeNegative: { backgroundColor: '#fee2e2' },
    statChangeText: { fontSize: 11, fontWeight: '600', color: '#15803d' },
    statChangeTextNegative: { color: '#b91c1c' },
    actionsSection: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
    actionsSectionTitle: { fontSize: 18, fontWeight: '700', color: palette.textPrimary, marginBottom: spacing.md },
    actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md },
    actionButtonContent: { flex: 1 },
    actionButtonText: { fontSize: 16, fontWeight: '600', color: palette.textPrimary, marginBottom: 2 },
    actionButtonSubtext: { fontSize: 13, color: palette.textSecondary },
    actionButtonChevron: { fontSize: 24, color: palette.textSecondary },
    bottomSpacing: { height: spacing.xl },
});
