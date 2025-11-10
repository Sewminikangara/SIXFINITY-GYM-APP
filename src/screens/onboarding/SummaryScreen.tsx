import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Button, Screen } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { OnboardingStackParamList } from '@/navigation/types';
import { palette, spacing, typography } from '@/theme';

type SummaryRoute = RouteProp<OnboardingStackParamList, 'Summary'>;

export const SummaryScreen = () => {
  const { user, completeOnboarding } = useAuth();
  const route = useRoute<SummaryRoute>();
  const [loading, setLoading] = useState(false);

  // Get all collected data from navigation params
  const profile = route.params?.profile || {};

  const handleFinish = async () => {
    // Validate we have the required data
    if (!profile.age || !profile.heightCm || !profile.weightKg || !profile.primaryGoal || !profile.activityLevel) {
      Alert.alert('Missing Data', 'Please complete all onboarding steps.');
      return;
    }

    setLoading(true);

    try {
      // Save to database with real user data
      await completeOnboarding({
        fullName: user?.user_metadata?.full_name || 'User',
        age: profile.age,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        primaryGoal: profile.primaryGoal,
        activityLevel: profile.activityLevel,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.emoji}></Text>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>Your personalized plan is ready.</Text>
        </View>

        {/* Show summary of collected data */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Profile</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Age:</Text>
            <Text style={styles.summaryValue}>{profile.age} years</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Height:</Text>
            <Text style={styles.summaryValue}>{profile.heightCm} cm</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Weight:</Text>
            <Text style={styles.summaryValue}>{profile.weightKg} kg</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Goal:</Text>
            <Text style={styles.summaryValue}>
              {profile.primaryGoal === 'lose_weight' ? 'Lose Weight' :
                profile.primaryGoal === 'build_muscle' ? 'Build Muscle' : 'General Fitness'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Activity:</Text>
            <Text style={styles.summaryValue}>
              {profile.activityLevel === 'sedentary' ? 'Sedentary' :
                profile.activityLevel === 'lightly_active' ? 'Lightly Active' : 'Very Active'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Button label="Start My Journey" onPress={handleFinish} loading={loading} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  emoji: { fontSize: 64 },
  title: { ...typography.heading1, color: palette.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.body, color: palette.textSecondary, textAlign: 'center' },
  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    ...typography.heading2,
    color: palette.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  summaryLabel: {
    ...typography.body,
    color: palette.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    color: palette.textPrimary,
    fontWeight: '600',
  },
});
