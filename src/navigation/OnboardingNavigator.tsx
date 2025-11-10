import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  // Old screens (kept for backward compatibility)
  ActivityLevelScreen,
  GoalsScreen,
  ProfileDetailsScreen,
  ProfileIntroScreen,
  SummaryScreen,
  // New comprehensive onboarding screens
  PersonalInfoScreen,
  BodyMetricsScreen,
  OccupationScreen,
  FitnessGoalsScreen,
  WorkoutPreferencesScreen,
  HealthAssessmentScreen,
  NutritionPreferencesScreen,
  LifestyleTrackingScreen,
  OnboardingSummaryScreen,
} from '@/screens/onboarding';
import { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* New comprehensive onboarding flow (31 questions) */}
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="BodyMetrics" component={BodyMetricsScreen} />
      <Stack.Screen name="Occupation" component={OccupationScreen} />
      <Stack.Screen name="FitnessGoals" component={FitnessGoalsScreen} />
      <Stack.Screen name="WorkoutPreferences" component={WorkoutPreferencesScreen} />
      <Stack.Screen name="HealthAssessment" component={HealthAssessmentScreen} />
      <Stack.Screen name="NutritionPreferences" component={NutritionPreferencesScreen} />
      <Stack.Screen name="LifestyleTracking" component={LifestyleTrackingScreen} />
      <Stack.Screen name="OnboardingSummary" component={OnboardingSummaryScreen} />

      {/* Old screens (kept for backward compatibility, not actively used) */}
      <Stack.Screen name="ProfileIntro" component={ProfileIntroScreen} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
      <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Summary" component={SummaryScreen} />
    </Stack.Navigator>
  );
};
