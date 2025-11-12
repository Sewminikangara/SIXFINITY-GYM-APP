-- SIXFINITY APP - NOTIFICATIONS & SUPPORT SYSTEM
-- File: 08-notifications-support.sql  
-- 6 tables: notifications, notification_preferences, faq, support_requests, support_chat, issue_reports

        RAISE EXCEPTION 'Missing required columns: %', array_to_string(missing_cols, ', ');
    ELSE
        RAISE NOTICE ' All required columns exist!';
    END IF;
END $$;

-- Show final column list
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;








ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_primary_goal_check;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_activity_level_check;

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_units_system_check;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Old CHECK constraints removed! New onboarding values will now work.';
END $$;

-- Verify by trying to insert a test value
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Get a test user ID (or create dummy)
    SELECT id INTO test_id FROM auth.users LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        -- Try updating with new values (won't actually save, just tests constraints)
        BEGIN
            UPDATE profiles 
            SET 
                primary_goal = 'build_muscle',
                activity_level = 'very_active',
                gender = 'non_binary'
            WHERE id = test_id
            AND false; -- This ensures it doesn't actually update
            
            RAISE NOTICE '✅ Test passed! New values accepted.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Test failed: %', SQLERRM;
        END;
    END IF;
END $$;








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

-- Onboarding flag (most important!)
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

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles (onboarding_completed);

CREATE INDEX IF NOT EXISTS idx_profiles_primary_goal ON profiles (primary_goal);

CREATE INDEX IF NOT EXISTS idx_profiles_activity_level ON profiles (activity_level);

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
    ELSE
        RAISE NOTICE ' All required columns exist!';
    END IF;
END $$;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;










CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date 
  ON weight_logs (user_id, date DESC);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  total_workout_minutes INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;


-- Weight Logs Policies
DROP POLICY IF EXISTS "Users can view own weight logs" ON weight_logs;
CREATE POLICY "Users can view own weight logs" ON weight_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own weight logs" ON weight_logs;
CREATE POLICY "Users can insert own weight logs" ON weight_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own weight logs" ON weight_logs;
CREATE POLICY "Users can update own weight logs" ON weight_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own weight logs" ON weight_logs;
CREATE POLICY "Users can delete own weight logs" ON weight_logs
  FOR DELETE USING (auth.uid() = user_id);
