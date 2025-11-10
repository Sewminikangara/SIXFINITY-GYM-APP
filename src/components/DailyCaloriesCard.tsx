import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProgressCircle } from './ProgressCircle';
import { palette, spacing, typography, radii, shadows } from '@/theme';

const { width } = Dimensions.get('window');

interface DailyCaloriesCardProps {
  consumed: number;
  target: number;
  protein: number;
  carbs: number;
  fats: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  waterMl: number;
  waterGoalMl: number;
  workoutMinutes?: number;
  workoutTarget?: number;
  caloriesBurned?: number;
}

export const DailyCaloriesCard: React.FC<DailyCaloriesCardProps> = ({
  consumed,
  target,
  protein,
  carbs,
  fats,
  proteinTarget,
  carbsTarget,
  fatsTarget,
  waterMl,
  waterGoalMl,
  workoutMinutes = 0,
  workoutTarget = 40,
  caloriesBurned = 0,
}) => {
  const caloriesPercent = Math.min((consumed / target) * 100, 100);
  const proteinPercent = Math.min((protein / proteinTarget) * 100, 100);
  const carbsPercent = Math.min((carbs / carbsTarget) * 100, 100);
  const fatsPercent = Math.min((fats / fatsTarget) * 100, 100);
  const waterPercent = Math.min((waterMl / waterGoalMl) * 100, 100);
  const workoutPercent = Math.min((workoutMinutes / workoutTarget) * 100, 100);

  // Adjust calorie target based on workout completion
  const adjustedTarget = workoutPercent >= 100 ? target : Math.round(target * (workoutMinutes / workoutTarget));
  const netCalories = consumed - caloriesBurned;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E1E1E', '#252525']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Daily Nutrition</Text>
          <View style={styles.badge}>
            <Ionicons name="flame" size={14} color="#FF6B6B" />
            <Text style={styles.badgeText}>Active</Text>
          </View>
        </View>

        {/* Main Stats Row */}
        <View style={styles.mainRow}>
          {/* Calories Circle */}
          <View style={styles.caloriesSection}>
            <ProgressCircle
              progress={caloriesPercent}
              size={140}
              strokeWidth={12}
              value={consumed.toFixed(0)}
              unit="kcal"
              showGlow={true}
            />
            <Text style={styles.caloriesTarget}>of {adjustedTarget}</Text>
            {workoutMinutes > 0 && (
              <View style={styles.workoutChip}>
                <Ionicons name="barbell" size={12} color={palette.neonGreen} />
                <Text style={styles.workoutChipText}>
                  {workoutMinutes}/{workoutTarget}min
                </Text>
              </View>
            )}
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            {/* Net Calories */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Net Calories</Text>
              <Text style={styles.statValue}>{netCalories.toFixed(0)}</Text>
              <Text style={styles.statSubtext}>
                {consumed.toFixed(0)} - {caloriesBurned.toFixed(0)}
              </Text>
            </View>

            {/* Water Intake */}
            <View style={styles.statBox}>
              <View style={styles.waterHeader}>
                <Ionicons name="water" size={16} color={palette.accentBlue} />
                <Text style={styles.statLabel}>Water</Text>
              </View>
              <View style={styles.waterProgressContainer}>
                <View style={styles.waterProgressBg}>
                  <View style={[styles.waterProgressFill, { width: `${waterPercent}%` }]} />
                </View>
                <Text style={styles.waterText}>
                  {waterMl}ml / {waterGoalMl}ml
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Macros Breakdown */}
        <View style={styles.macrosSection}>
          <Text style={styles.macrosTitle}>Macros Breakdown</Text>
          
          {/* Protein */}
          <View style={styles.macroRow}>
            <View style={styles.macroHeader}>
              <View style={[styles.macroIcon, { backgroundColor: '#FF6B6B20' }]}>
                <Ionicons name="fitness" size={16} color="#FF6B6B" />
              </View>
              <Text style={styles.macroName}>Protein</Text>
              <Text style={styles.macroValue}>
                {protein.toFixed(0)}g / {proteinTarget}g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${proteinPercent}%` }]}
              />
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroRow}>
            <View style={styles.macroHeader}>
              <View style={[styles.macroIcon, { backgroundColor: '#4ECDC420' }]}>
                <Ionicons name="leaf" size={16} color="#4ECDC4" />
              </View>
              <Text style={styles.macroName}>Carbs</Text>
              <Text style={styles.macroValue}>
                {carbs.toFixed(0)}g / {carbsTarget}g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${carbsPercent}%` }]}
              />
            </View>
          </View>

          {/* Fats */}
          <View style={styles.macroRow}>
            <View style={styles.macroHeader}>
              <View style={[styles.macroIcon, { backgroundColor: '#FFE66D20' }]}>
                <Ionicons name="egg" size={16} color="#FFE66D" />
              </View>
              <Text style={styles.macroName}>Fats</Text>
              <Text style={styles.macroValue}>
                {fats.toFixed(0)}g / {fatsTarget}g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#FFE66D', '#FFAA00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${fatsPercent}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Workout Adjustment Notice */}
        {workoutPercent < 100 && workoutMinutes > 0 && (
          <View style={styles.adjustmentNotice}>
            <Ionicons name="information-circle" size={16} color={palette.accentOrange} />
            <Text style={styles.adjustmentText}>
              Target adjusted: {workoutMinutes}min workout ({workoutPercent.toFixed(0)}% of goal)
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  gradient: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  mainRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  caloriesSection: {
    alignItems: 'center',
  },
  caloriesTarget: {
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: spacing.xs,
  },
  workoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  workoutChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.neonGreen,
  },
  quickStats: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  statLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: palette.textTertiary,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  waterProgressContainer: {
    marginTop: 4,
  },
  waterProgressBg: {
    height: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginBottom: 4,
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: palette.accentBlue,
    borderRadius: radii.sm,
  },
  waterText: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  macrosSection: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  macrosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: spacing.md,
  },
  macroRow: {
    marginBottom: spacing.md,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  macroIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  macroName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: palette.textPrimary,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.sm,
  },
  adjustmentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE66D20',
    padding: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  adjustmentText: {
    flex: 1,
    fontSize: 12,
    color: palette.accentOrange,
  },
});
