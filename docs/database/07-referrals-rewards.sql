-- SIXFINITY APP - REFERRALS & REWARDS SYSTEM
-- File: 07-referrals-rewards.sql
-- 5 tables: referrals, referral_rewards, reward_points_wallet, reward_transactions + profiles extensions

  muscle_groups TEXT[],
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises" ON public.exercises FOR
SELECT USING (true);

CREATE POLICY "Users can insert custom exercises" ON public.exercises FOR
INSERT
WITH
    CHECK (
        is_custom = true
        AND auth.uid () = created_by
    );

CREATE POLICY "Users can update their own custom exercises" ON public.exercises FOR
UPDATE USING (
    is_custom = true
    AND auth.uid () = created_by
);

CREATE POLICY "Users can delete their own custom exercises" ON public.exercises FOR DELETE USING (
    is_custom = true
    AND auth.uid () = created_by
);

-- workout plans table
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency_per_week INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout plans" ON public.workout_plans FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own workout plans" ON public.workout_plans FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own workout plans" ON public.workout_plans FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own workout plans" ON public.workout_plans FOR DELETE USING (auth.uid () = user_id);

--  workout sessions table
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    workout_plan_id UUID REFERENCES public.workout_plans (id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    notes TEXT,
    started_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        completed_at TIMESTAMP
    WITH
        TIME ZONE,
        duration_minutes INTEGER,
        total_volume_kg DECIMAL(10, 2),
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout sessions" ON public.workout_sessions FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own workout sessions" ON public.workout_sessions FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own workout sessions" ON public.workout_sessions FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own workout sessions" ON public.workout_sessions FOR DELETE USING (auth.uid () = user_id);

-- workout exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    workout_session_id UUID NOT NULL REFERENCES public.workout_sessions (id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises (id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workout exercises from their sessions" ON public.workout_exercises FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.workout_sessions
            WHERE
                workout_sessions.id = workout_exercises.workout_session_id
                AND workout_sessions.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert workout exercises to their sessions" ON public.workout_exercises FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.workout_sessions
            WHERE
                workout_sessions.id = workout_exercises.workout_session_id
                AND workout_sessions.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update workout exercises in their sessions" ON public.workout_exercises FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.workout_sessions
        WHERE
            workout_sessions.id = workout_exercises.workout_session_id
            AND workout_sessions.user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete workout exercises from their sessions" ON public.workout_exercises FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.workout_sessions
        WHERE
            workout_sessions.id = workout_exercises.workout_session_id
            AND workout_sessions.user_id = auth.uid ()
    )
);

--  sets table
CREATE TABLE IF NOT EXISTS public.sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises (id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight_kg DECIMAL(6, 2),
    duration_seconds INTEGER,
    distance_meters DECIMAL(8, 2),
    rpe INTEGER CHECK (
        rpe >= 1
        AND rpe <= 10
    ),
    is_warmup BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sets from their workout exercises" ON public.sets FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.workout_exercises we
                JOIN public.workout_sessions ws ON ws.id = we.workout_session_id
            WHERE
                we.id = sets.workout_exercise_id
                AND ws.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert sets to their workout exercises" ON public.sets FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.workout_exercises we
                JOIN public.workout_sessions ws ON ws.id = we.workout_session_id
            WHERE
                we.id = sets.workout_exercise_id
                AND ws.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update sets in their workout exercises" ON public.sets FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.workout_exercises we
            JOIN public.workout_sessions ws ON ws.id = we.workout_session_id
        WHERE
            we.id = sets.workout_exercise_id
            AND ws.user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete sets from their workout exercises" ON public.sets FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.workout_exercises we
            JOIN public.workout_sessions ws ON ws.id = we.workout_session_id
        WHERE
            we.id = sets.workout_exercise_id
            AND ws.user_id = auth.uid ()
    )
);

-- meals table
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    meal_type TEXT CHECK (
        meal_type IN (
            'breakfast',
            'lunch',
            'dinner',
            'snack',
            'other'
        )
    ),
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_time TIME,
    calories INTEGER,
    protein_g DECIMAL(6, 2),
    carbs_g DECIMAL(6, 2),
    fat_g DECIMAL(6, 2),
    fiber_g DECIMAL(6, 2),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meals" ON public.meals FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own meals" ON public.meals FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own meals" ON public.meals FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own meals" ON public.meals FOR DELETE USING (auth.uid () = user_id);

-- food items table
CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    brand TEXT,
    serving_size TEXT NOT NULL,
    serving_size_g DECIMAL(8, 2),
    calories INTEGER NOT NULL,
    protein_g DECIMAL(6, 2),
    carbs_g DECIMAL(6, 2),
    fat_g DECIMAL(6, 2),
    fiber_g DECIMAL(6, 2),
    sugar_g DECIMAL(6, 2),
    sodium_mg DECIMAL(8, 2),
    barcode TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view food items" ON public.food_items FOR
SELECT USING (true);

CREATE POLICY "Users can insert custom food items" ON public.food_items FOR
INSERT
WITH
    CHECK (
        is_custom = true
        AND auth.uid () = created_by
    );

CREATE POLICY "Users can update their own custom food items" ON public.food_items FOR
UPDATE USING (
    is_custom = true
    AND auth.uid () = created_by
);

CREATE POLICY "Users can delete their own custom food items" ON public.food_items FOR DELETE USING (
    is_custom = true
    AND auth.uid () = created_by
);

--meal items table
CREATE TABLE IF NOT EXISTS public.meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    meal_id UUID NOT NULL REFERENCES public.meals (id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES public.food_items (id) ON DELETE CASCADE,
    servings DECIMAL(6, 2) NOT NULL DEFAULT 1,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meal items from their meals" ON public.meal_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.meals
            WHERE
                meals.id = meal_items.meal_id
                AND meals.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert meal items to their meals" ON public.meal_items FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.meals
            WHERE
                meals.id = meal_items.meal_id
                AND meals.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update meal items in their meals" ON public.meal_items FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.meals
        WHERE
            meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete meal items from their meals" ON public.meal_items FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.meals
        WHERE
            meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid ()
    )
);

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes
CREATE INDEX idx_progress_entries_user_date ON public.progress_entries (user_id, entry_date DESC);

CREATE INDEX idx_workout_sessions_user_started ON public.workout_sessions (user_id, started_at DESC);

CREATE INDEX idx_meals_user_date ON public.meals (user_id, meal_date DESC);

CREATE INDEX idx_exercises_category ON public.exercises (category);

CREATE INDEX idx_food_items_name ON public.food_items (name);

-- Insert sample exercises
INSERT INTO public.exercises (name, description, category, equipment, difficulty, muscle_groups) VALUES
  ('Barbell Bench Press', 'Classic chest exercise using a barbell', 'chest', ARRAY['barbell', 'bench'], 'intermediate', ARRAY['chest', 'triceps', 'shoulders']),
  ('Barbell Squat', 'Compound leg exercise', 'legs', ARRAY['barbell', 'squat_rack'], 'intermediate', ARRAY['quadriceps', 'glutes', 'hamstrings']),
  ('Deadlift', 'Full body compound movement', 'fullbody', ARRAY['barbell'], 'advanced', ARRAY['back', 'glutes', 'hamstrings', 'core']),
  ('Pull-ups', 'Bodyweight back exercise', 'back', ARRAY['pull_up_bar'], 'intermediate', ARRAY['lats', 'biceps']),
  ('Push-ups', 'Bodyweight chest exercise', 'chest', ARRAY['bodyweight'], 'beginner', ARRAY['chest', 'triceps', 'shoulders']),
  ('Dumbbell Shoulder Press', 'Overhead pressing movement', 'shoulders', ARRAY['dumbbells'], 'beginner', ARRAY['shoulders', 'triceps']),
  ('Barbell Row', 'Back thickness builder', 'back', ARRAY['barbell'], 'intermediate', ARRAY['lats', 'rhomboids', 'biceps']),
  ('Bicep Curls', 'Isolation exercise for biceps', 'arms', ARRAY['dumbbells'], 'beginner', ARRAY['biceps']),
  ('Tricep Dips', 'Bodyweight tricep exercise', 'arms', ARRAY['dip_bars'], 'intermediate', ARRAY['triceps', 'chest']),
  ('Plank', 'Core stability exercise', 'core', ARRAY['bodyweight'], 'beginner', ARRAY['core', 'abs']),
  ('Running', 'Cardiovascular exercise', 'cardio', ARRAY['none'], 'beginner', ARRAY['legs', 'cardiovascular']),
  ('Leg Press', 'Machine-based leg exercise', 'legs', ARRAY['leg_press_machine'], 'beginner', ARRAY['quadriceps', 'glutes'])
ON CONFLICT DO NOTHING;













-- Body Metrics & Units
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS height_unit TEXT DEFAULT 'cm';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_weight_kg NUMERIC;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_type TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- Occupation & Work Activity (Q8-9)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation_custom TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS job_activity_level TEXT;

-- Fitness Goals (Q10-11)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_timeline TEXT;

-- Workout Preferences (Q12-16)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workout_environment TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workout_types TEXT[];

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment_access TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_duration TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weekly_workout_days TEXT;

-- Health Assessment (Q17-20)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT[];

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS medical_conditions_other TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_symptoms TEXT[];

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS past_injuries BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS injury_details TEXT;

-- Nutrition Preferences (Q21-25)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[];

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dietary_restrictions_other TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS food_allergies BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS food_allergy_list TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meals_per_day TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meal_budget TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cuisine_preference TEXT;

-- Body Photo & Measurements (Q26-27)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_photo_url TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS body_photo_ml_type TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS body_measurements JSONB;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS track_measurements BOOLEAN DEFAULT TRUE;

-- Wearable Integration (Q28)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS wearable_connected BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wearable_platform TEXT;

-- Lifestyle (Q29-31)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_hours TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stress_level TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS smokes_or_drinks BOOLEAN DEFAULT FALSE;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_primary_goal ON profiles (primary_goal);

CREATE INDEX IF NOT EXISTS idx_profiles_activity_level ON profiles (activity_level);

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles (onboarding_completed);

-- Add updated_at timestamp
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully! All onboarding fields added to profiles table.';
END $$;











SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'gender', 'body_type', 'occupation', 'job_activity_level',
  'goal_weight_kg', 'goal_timeline', 'workout_environment',
  'workout_types', 'equipment_access', 'session_duration',
  'weekly_workout_days', 'medical_conditions', 'current_symptoms',
  'past_injuries', 'dietary_restrictions', 'food_allergies',
  'meals_per_day', 'meal_budget', 'cuisine_preference',
  'body_photo_url', 'body_photo_ml_type', 'body_measurements',
  'wearable_connected', 'wearable_platform', 'sleep_hours',
  'stress_level', 'smokes_or_drinks'
)
ORDER BY column_name;




ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;

COMMENT ON COLUMN profiles.age IS 'User age from onboarding (13-100)';

SELECT column_name, data_type
FROM information_schema.columns
WHERE
    table_name = 'profiles'
    AND column_name IN (
        'age',
        'full_name',
        'gender',
        'body_type'
    )
ORDER BY column_name;












DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'profiles table does not exist! Run supabase-schema.sql first';
    END IF;
END $$;


-- Personal Information
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Body Metrics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm NUMERIC;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS height_unit TEXT DEFAULT 'cm';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_weight_kg NUMERIC;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_type TEXT;

-- Fitness Goals
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_goal TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_timeline TEXT;

-- Activity Level
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_level TEXT;

-- Occupation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation_custom TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS job_activity_level TEXT;

-- Workout Preferences
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workout_environment TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workout_types TEXT[];

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment_access TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_duration TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weekly_workout_days TEXT;

-- Health Assessment
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT[];

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS medical_conditions_other TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_symptoms TEXT[];

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS past_injuries BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS injury_details TEXT;

-- Nutrition
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[];

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dietary_restrictions_other TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS food_allergies BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS food_allergy_list TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meals_per_day TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meal_budget TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cuisine_preference TEXT;

-- Lifestyle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_photo_url TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS body_photo_ml_type TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS body_measurements JSONB;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS track_measurements BOOLEAN DEFAULT TRUE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS wearable_connected BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wearable_platform TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_hours TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stress_level TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS smokes_or_drinks BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Timestamps
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create or replace the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles (onboarding_completed);

CREATE INDEX IF NOT EXISTS idx_profiles_primary_goal ON profiles (primary_goal);

CREATE INDEX IF NOT EXISTS idx_profiles_activity_level ON profiles (activity_level);

-- Verify all critical columns exist
DO $$ 
DECLARE
    missing_cols TEXT[];
BEGIN
    SELECT ARRAY_AGG(col) INTO missing_cols
    FROM (VALUES 
        ('age'),
        ('gender'),
        ('full_name'),
        ('height_cm'),
        ('weight_kg'),
        ('primary_goal'),
        ('activity_level'),
        ('onboarding_completed')
    ) AS required_cols(col)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = required_cols.col
    );
    
    IF missing_cols IS NOT NULL THEN
        RAISE EXCEPTION 'Missing required columns: %', array_to_string(missing_cols, ', ');
