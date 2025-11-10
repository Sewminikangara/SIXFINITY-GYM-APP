export type RootStackParamList = {
  Splash: undefined;
  Loading: undefined;
  Auth: undefined;
  App: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string } | undefined;
  VerifyOTP: {
    email?: string;
    phone?: string;
    type: 'signup' | 'reset' | 'email';
  };
  ResetPassword: {
    token: string;
    email?: string;
    phone?: string;
  };
};

export type AppTabParamList = {
  Home: undefined;
  Gyms: undefined;
  Meals: undefined;
  Workout: undefined;
  More: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  GymFinder: undefined;
  GymMap: undefined;
  GymDetail: {
    gymId: string;
  };
  MyGyms: undefined;
  LiveStatus: {
    gymId?: string;
  };
  CheckIn: {
    gymId: string;
    gymName: string;
  };
  Trainers: undefined;
  TrainerDetail: {
    trainer: {
      id: string;
      name: string;
      location: string;
      rating: number;
      image: string;
      specialization: string[];
      experience: number;
      pricePerSession: number;
      available: boolean;
    };
  };
  // Meal screens
  AddMeal: {
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    meal?: any;
    isEditing?: boolean;
  };
  MealAnalysis: {
    imageUri: string;
    scanType: 'camera' | 'barcode';
  };
  Camera: undefined;
  FoodPhoto: undefined;
  BarcodeScanner: undefined;
};

export interface OnboardingParams {
  // Personal Info (Screen 1)
  fullName?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Body Metrics (Screen 2)
  heightCm?: number;
  heightUnit?: 'cm' | 'ft';
  weightKg?: number;
  weightUnit?: 'kg' | 'lbs';
  goalWeightKg?: number;
  bodyType?: 'lean' | 'average' | 'muscular' | 'curvy' | 'plus_size';

  // Occupation (Screen 3)
  occupation?: string;
  occupationCustom?: string;
  jobActivityLevel?: 'mostly_sitting' | 'some_movement' | 'on_foot' | 'physically_demanding';

  // Fitness Goals (Screen 4)
  primaryGoal?: 'lose_weight' | 'build_muscle' | 'improve_endurance' | 'improve_flexibility' | 'general_fitness' | 'sports_performance';
  goalTimeline?: '1_3_months' | '3_6_months' | '6_plus_months';

  // Workout Preferences (Screen 5)
  workoutEnvironment?: 'gym' | 'home' | 'outdoor';
  workoutTypes?: string[]; // max 2
  equipmentAccess?: 'full_gym' | 'basic_equipment' | 'bodyweight_only';
  sessionDuration?: '15_30_min' | '30_45_min' | '45_60_min';
  weeklyWorkoutDays?: '1_2_days' | '3_4_days' | '5_plus_days';

  // Health Assessment (Screen 6)
  activityLevel?: 'sedentary' | 'lightly_active' | 'very_active';
  medicalConditions?: string[];
  medicalConditionsOther?: string;
  currentSymptoms?: string[];
  pastInjuries?: boolean;
  injuryDetails?: string;

  // Nutrition (Screen 7)
  dietaryRestrictions?: string[];
  dietaryRestrictionsOther?: string;
  foodAllergies?: boolean;
  foodAllergyList?: string;
  mealsPerDay?: '2_meals' | '3_meals' | '4_plus_meals';
  mealBudget?: 'budget_friendly' | 'moderate' | 'premium';
  cuisinePreference?: 'any' | 'specific_regional' | 'international';

  // Lifestyle (Screen 8)
  bodyPhotoUrl?: string;
  bodyPhotoMlType?: string;
  bodyMeasurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  trackMeasurements?: boolean;
  wearableConnected?: boolean;
  wearablePlatform?: 'google_fit' | 'apple_health' | 'fitbit' | 'samsung_health' | 'garmin';
  sleepHours?: 'less_5' | '5_7' | '7_9' | '9_plus';
  stressLevel?: 'low' | 'moderate' | 'high';
  smokesOrDrinks?: boolean;
}export type OnboardingStackParamList = {
  ProfileIntro: undefined;
  PersonalInfo: { profile?: OnboardingParams };
  BodyMetrics: { profile: OnboardingParams };
  Occupation: { profile: OnboardingParams };
  FitnessGoals: { profile: OnboardingParams };
  WorkoutPreferences: { profile: OnboardingParams };
  HealthAssessment: { profile: OnboardingParams };
  NutritionPreferences: { profile: OnboardingParams };
  LifestyleTracking: { profile: OnboardingParams };
  OnboardingSummary: { profile: OnboardingParams };

  // Keep old screens for backward compatibility during transition
  ProfileDetails?: { profile: OnboardingParams } | undefined;
  ActivityLevel?: { profile: OnboardingParams };
  Goals?: { profile: OnboardingParams };
  Summary?: { profile: OnboardingParams };
};
