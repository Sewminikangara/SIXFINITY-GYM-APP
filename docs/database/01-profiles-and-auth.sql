-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
-- Stores user profile information and onboarding data
CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary Key
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    
    -- Basic Information
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Personal Demographics
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Body Metrics
    height_cm DECIMAL(5, 2),
    height_unit TEXT DEFAULT 'cm',
    weight_kg DECIMAL(5, 2),
    weight_unit TEXT DEFAULT 'kg',
    goal_weight_kg DECIMAL(5, 2),
    body_type TEXT,
    
    -- Occupation & Work Activity
    occupation TEXT,
    occupation_custom TEXT,
    job_activity_level TEXT,
    
    -- Fitness Goals
    primary_goal TEXT CHECK (primary_goal IN ('lose_weight', 'gain_muscle', 'maintain', 'improve_fitness', 'gain_strength')),
    goal_timeline TEXT,
    
    -- Activity Level
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
    exercise_experience TEXT CHECK (exercise_experience IN ('beginner', 'intermediate', 'advanced')),
    
    -- Workout Preferences
    workout_environment TEXT,
    workout_types TEXT[],
    equipment_access TEXT,
    session_duration TEXT,
    weekly_workout_days TEXT,
    workout_days_per_week INTEGER,
    workout_duration_minutes INTEGER,
    preferred_workout_time TEXT CHECK (preferred_workout_time IN ('morning', 'afternoon', 'evening')),
    
    -- Health Assessment
    medical_conditions TEXT[],
    medical_conditions_other TEXT,
    current_symptoms TEXT[],
    past_injuries BOOLEAN DEFAULT FALSE,
    injury_details TEXT,
    health_conditions TEXT[],
    injuries_limitations TEXT[],
    medications TEXT[],
    
    -- Nutrition Preferences
    dietary_restrictions TEXT[],
    dietary_restrictions_other TEXT,
    food_allergies BOOLEAN DEFAULT FALSE,
    food_allergy_list TEXT,
    meals_per_day TEXT,
    meal_budget TEXT,
    cuisine_preference TEXT,
    
    -- Daily Nutrition Goals
    daily_calorie_goal INTEGER,
    daily_protein_goal_g DECIMAL(6, 2),
    daily_carbs_goal_g DECIMAL(6, 2),
    daily_fat_goal_g DECIMAL(6, 2),
    daily_water_goal_ml INTEGER DEFAULT 2000,
    
    -- Lifestyle
    sleep_hours TEXT,
    sleep_hours_per_night DECIMAL(3, 1),
    stress_level TEXT CHECK (stress_level IN ('low', 'moderate', 'high')),
    smokes_or_drinks BOOLEAN DEFAULT FALSE,
    
    -- Body Photo & Measurements
    body_photo_url TEXT,
    body_photo_ml_type TEXT,
    body_measurements JSONB,
    track_measurements BOOLEAN DEFAULT TRUE,
    
    -- Wearable Integration
    wearable_connected BOOLEAN DEFAULT FALSE,
    wearable_platform TEXT,
    
    -- System Metadata
    region_code VARCHAR(10),
    timezone VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'USD',
    preferred_language VARCHAR(10) DEFAULT 'en',
    app_version VARCHAR(20),
    device_type VARCHAR(20),
    
    -- Onboarding Status
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Web System Integration
    last_synced_to_web TIMESTAMP WITH TIME ZONE,
    web_sync_status VARCHAR(20) DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_primary_goal ON public.profiles(primary_goal);
CREATE INDEX IF NOT EXISTS idx_profiles_activity_level ON public.profiles(activity_level);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_web_sync_status ON public.profiles(web_sync_status);

-- (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);


-- TRIGGERS

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- COMMENTS
COMMENT ON TABLE public.profiles IS 'User profile information including onboarding data, fitness goals, and health metrics';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key to auth.users - user unique identifier';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Flag indicating if user has completed onboarding process';
COMMENT ON COLUMN public.profiles.web_sync_status IS 'Status of sync with web system: pending, synced, failed';
