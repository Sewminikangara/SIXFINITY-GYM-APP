-- PROFILES & AUTHENTICATION

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    
    -- Basic Information
    full_name TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    age INTEGER,
    gender TEXT CHECK (
        gender IN (
            'male',
            'female',
            'other',
            'prefer_not_to_say'
        )
    ),
    
    -- Body Metrics
    height_cm DECIMAL(5, 2),
    current_weight_kg DECIMAL(5, 2),
    weight_kg DECIMAL(5, 2),
    target_weight_kg DECIMAL(5, 2),
    goal_weight_kg DECIMAL(5, 2),
    body_type TEXT,
    
    -- Units System
    height_unit TEXT DEFAULT 'cm',
    weight_unit TEXT DEFAULT 'kg',
    units_system TEXT DEFAULT 'metric' CHECK (
        units_system IN ('metric', 'imperial')
    ),
    
    -- Fitness Goals
    primary_goal TEXT CHECK (
        primary_goal IN (
            'lose_weight',
            'gain_muscle',
            'maintain',
            'improve_fitness',
            'gain_strength'
        )
    ),
    goal_timeline TEXT,
    
    -- Activity & Occupation
    activity_level TEXT CHECK (
        activity_level IN (
            'sedentary',
            'lightly_active',
            'moderately_active',
            'very_active',
            'extra_active'
        )
    ),
    occupation TEXT,
    occupation_custom TEXT,
    job_activity_level TEXT,
    
    -- Nutrition Goals
    daily_calorie_goal INTEGER,
    daily_protein_goal_g DECIMAL(6, 2),
    daily_carbs_goal_g DECIMAL(6, 2),
    daily_fat_goal_g DECIMAL(6, 2),
    
    -- Workout Preferences
    workout_environment TEXT,
    workout_types TEXT[],
    equipment_access TEXT,
    session_duration TEXT,
    weekly_workout_days TEXT,
    
    -- Health Assessment
    medical_conditions TEXT[],
    medical_conditions_other TEXT,
    current_symptoms TEXT[],
    past_injuries BOOLEAN DEFAULT FALSE,
    injury_details TEXT,
    
    -- Nutrition Preferences
    dietary_restrictions TEXT[],
    dietary_restrictions_other TEXT,
    food_allergies BOOLEAN DEFAULT FALSE,
    food_allergy_list TEXT,
    meals_per_day TEXT,
    meal_budget TEXT,
    cuisine_preference TEXT,
    
    -- Body Photo & Measurements
    body_photo_url TEXT,
    body_photo_ml_type TEXT,
    body_measurements JSONB,
    track_measurements BOOLEAN DEFAULT TRUE,
    
    -- Wearable Integration
    wearable_connected BOOLEAN DEFAULT FALSE,
    wearable_platform TEXT,
    
    -- Lifestyle
    sleep_hours TEXT,
    stress_level TEXT,
    smokes_or_drinks BOOLEAN DEFAULT FALSE,
    
    -- Referral System
    referral_code VARCHAR(15) UNIQUE,
    referred_by VARCHAR(15),
    is_verified BOOLEAN DEFAULT FALSE,
    subscription_status VARCHAR(20) DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'expired', 'canceled', 'trial')),
    
    -- Onboarding Status
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_primary_goal ON public.profiles(primary_goal);
CREATE INDEX IF NOT EXISTS idx_profiles_activity_level ON public.profiles(activity_level);

-- 3. TRIGGERS

-- Function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. (RLS) 
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);


-- 5. HELPER FUNCTIONS

-- Function to calculate BMI
CREATE OR REPLACE FUNCTION calculate_bmi(weight_kg DECIMAL, height_cm DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF height_cm IS NULL OR height_cm = 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND((weight_kg / ((height_cm / 100) * (height_cm / 100)))::DECIMAL, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record FROM public.profiles WHERE id = p_user_id;
    
    IF profile_record.full_name IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.avatar_url IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.gender IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.date_of_birth IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.height_cm IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.primary_goal IS NOT NULL THEN completion_score := completion_score + 15; END IF;
    IF profile_record.activity_level IS NOT NULL THEN completion_score := completion_score + 15; END IF;
    IF profile_record.onboarding_completed = TRUE THEN completion_score := completion_score + 20; END IF;
    
    RETURN completion_score;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Profiles & Authentication tables created successfully!';
    RAISE NOTICE '   - profiles table with 31+ onboarding fields';
    RAISE NOTICE '   - RLS policies enabled';
    RAISE NOTICE '   - Auto-creation triggers configured';
END $$;
