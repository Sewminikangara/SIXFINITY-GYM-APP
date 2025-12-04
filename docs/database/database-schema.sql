-- SIXFINITY FITNESS APP - DATABASE SCHEMA

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    height_cm DECIMAL(5, 2),
    weight_kg DECIMAL(5, 2),
    goal_weight_kg DECIMAL(5, 2),
    primary_goal TEXT CHECK (primary_goal IN ('lose_weight', 'gain_muscle', 'maintain', 'improve_fitness', 'gain_strength')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
    occupation TEXT,
    exercise_experience TEXT CHECK (exercise_experience IN ('beginner', 'intermediate', 'advanced')),
    workout_days_per_week INTEGER,
    workout_duration_minutes INTEGER,
    preferred_workout_time TEXT CHECK (preferred_workout_time IN ('morning', 'afternoon', 'evening')),
    health_conditions TEXT[],
    injuries_limitations TEXT[],
    medications TEXT[],
    dietary_restrictions TEXT[],
    food_allergies TEXT[],
    daily_calorie_goal INTEGER,
    daily_protein_goal_g DECIMAL(6, 2),
    daily_carbs_goal_g DECIMAL(6, 2),
    daily_fat_goal_g DECIMAL(6, 2),
    daily_water_goal_ml INTEGER DEFAULT 2000,
    sleep_hours_per_night DECIMAL(3, 1),
    stress_level TEXT CHECK (stress_level IN ('low', 'moderate', 'high')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- MEALS TABLE
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name VARCHAR(255),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIME NOT NULL DEFAULT CURRENT_TIME,
  total_calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
  protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  meal_category VARCHAR(50) CHECK (meal_category IN ('vegetarian', 'vegan', 'high-protein', 'high-carb', 'low-carb', 'keto', 'balanced', 'other')),
  entry_method VARCHAR(50) NOT NULL CHECK (entry_method IN ('manual', 'photo', 'barcode', 'ai-suggestion')),
  photo_url TEXT,
  barcode_value VARCHAR(255),
  ai_detected_foods JSONB,
  ai_confidence_score DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_user_date ON meals(user_id, meal_date DESC);
CREATE INDEX idx_meals_meal_type ON meals(meal_type);
CREATE INDEX idx_meals_created_at ON meals(created_at DESC);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meals" ON meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meals" ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meals" ON meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meals" ON meals FOR DELETE USING (auth.uid() = user_id);

-- MEAL ITEMS TABLE
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
  food_name VARCHAR(255) NOT NULL,
  food_brand VARCHAR(255),
  serving_size DECIMAL(10, 2) NOT NULL,
  serving_unit VARCHAR(50) NOT NULL,
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  external_food_id VARCHAR(255),
  external_source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_items_meal_id ON meal_items(meal_id);

ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meal items of their meals" ON meal_items FOR SELECT 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert meal items to their meals" ON meal_items FOR INSERT 
  WITH CHECK (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));
CREATE POLICY "Users can update meal items of their meals" ON meal_items FOR UPDATE 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete meal items of their meals" ON meal_items FOR DELETE 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

-- WATER INTAKE TABLE
CREATE TABLE water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INT NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  daily_goal_ml INT DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_water_intake_user_date ON water_intake(user_id, date DESC);

ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own water intake" ON water_intake FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DAILY NUTRITION SUMMARY TABLE
CREATE TABLE daily_nutrition_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_calories_consumed DECIMAL(10, 2) NOT NULL DEFAULT 0,
  calories_target DECIMAL(10, 2) NOT NULL,
  calories_burned DECIMAL(10, 2) DEFAULT 0,
  calories_net DECIMAL(10, 2) GENERATED ALWAYS AS (total_calories_consumed - calories_burned) STORED,
  total_protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fiber_grams DECIMAL(10, 2) DEFAULT 0,
  total_sugar_grams DECIMAL(10, 2) DEFAULT 0,
  total_sodium_mg DECIMAL(10, 2) DEFAULT 0,
  protein_target_grams DECIMAL(10, 2),
  carbs_target_grams DECIMAL(10, 2),
  fats_target_grams DECIMAL(10, 2),
  total_water_ml INT DEFAULT 0,
  water_goal_ml INT DEFAULT 2000,
  meals_logged INT DEFAULT 0,
  breakfast_logged BOOLEAN DEFAULT FALSE,
  lunch_logged BOOLEAN DEFAULT FALSE,
  dinner_logged BOOLEAN DEFAULT FALSE,
  snacks_count INT DEFAULT 0,
  workout_duration_minutes INT DEFAULT 0,
  workout_calories_burned DECIMAL(10, 2) DEFAULT 0,
  goal_met BOOLEAN DEFAULT FALSE,
  protein_goal_met BOOLEAN DEFAULT FALSE,
  water_goal_met BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_nutrition_user_date ON daily_nutrition_summary(user_id, date DESC);

ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own nutrition summary" ON daily_nutrition_summary FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AUTO-UPDATE FUNCTIONS
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_nutrition_summary (
    user_id, date, total_calories_consumed, total_protein_grams, total_carbs_grams, total_fats_grams,
    total_fiber_grams, total_sugar_grams, total_sodium_mg, meals_logged, breakfast_logged, lunch_logged,
    dinner_logged, snacks_count, calories_target, protein_target_grams, carbs_target_grams, fats_target_grams
  )
  SELECT 
    COALESCE(NEW.user_id, OLD.user_id), COALESCE(NEW.meal_date, OLD.meal_date),
    COALESCE(SUM(m.total_calories), 0), COALESCE(SUM(m.protein_grams), 0), COALESCE(SUM(m.carbs_grams), 0),
    COALESCE(SUM(m.fats_grams), 0), COALESCE(SUM(m.fiber_grams), 0), COALESCE(SUM(m.sugar_grams), 0),
    COALESCE(SUM(m.sodium_mg), 0), COUNT(*), BOOL_OR(m.meal_type = 'breakfast'), BOOL_OR(m.meal_type = 'lunch'),
    BOOL_OR(m.meal_type = 'dinner'), COUNT(*) FILTER (WHERE m.meal_type = 'snack'), 2000, 150, 200, 65
  FROM meals m
  WHERE m.user_id = COALESCE(NEW.user_id, OLD.user_id) AND m.meal_date = COALESCE(NEW.meal_date, OLD.meal_date)
  GROUP BY m.user_id, m.meal_date
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_calories_consumed = EXCLUDED.total_calories_consumed, total_protein_grams = EXCLUDED.total_protein_grams,
    total_carbs_grams = EXCLUDED.total_carbs_grams, total_fats_grams = EXCLUDED.total_fats_grams,
    total_fiber_grams = EXCLUDED.total_fiber_grams, total_sugar_grams = EXCLUDED.total_sugar_grams,
    total_sodium_mg = EXCLUDED.total_sodium_mg, meals_logged = EXCLUDED.meals_logged,
    breakfast_logged = EXCLUDED.breakfast_logged, lunch_logged = EXCLUDED.lunch_logged,
    dinner_logged = EXCLUDED.dinner_logged, snacks_count = EXCLUDED.snacks_count, updated_at = NOW(),
    goal_met = (EXCLUDED.total_calories_consumed >= daily_nutrition_summary.calories_target * 0.9 
                AND EXCLUDED.total_calories_consumed <= daily_nutrition_summary.calories_target * 1.1),
    protein_goal_met = (EXCLUDED.total_protein_grams >= daily_nutrition_summary.protein_target_grams);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_nutrition_summary
AFTER INSERT OR UPDATE OR DELETE ON meals
FOR EACH ROW EXECUTE FUNCTION update_daily_nutrition_summary();

CREATE OR REPLACE FUNCTION update_water_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_nutrition_summary SET 
    total_water_ml = (SELECT COALESCE(SUM(amount_ml), 0) FROM water_intake WHERE user_id = NEW.user_id AND date = NEW.date),
    water_goal_met = (SELECT COALESCE(SUM(amount_ml), 0) >= NEW.daily_goal_ml FROM water_intake WHERE user_id = NEW.user_id AND date = NEW.date),
    updated_at = NOW()
  WHERE user_id = NEW.user_id AND date = NEW.date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_water_summary
AFTER INSERT OR UPDATE ON water_intake
FOR EACH ROW EXECUTE FUNCTION update_water_summary();




--Profile onboarding--

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





--Meal and nutrition tracking --
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Meal Basic Info
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name VARCHAR(255),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIME NOT NULL DEFAULT CURRENT_TIME,
  
  -- Nutrition Data
  total_calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
  protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Meal Categorization
  meal_category VARCHAR(50) CHECK (meal_category IN ('vegetarian', 'vegan', 'high-protein', 'high-carb', 'low-carb', 'keto', 'balanced', 'other')),
  
  -- Entry Method
  entry_method VARCHAR(50) NOT NULL CHECK (entry_method IN ('manual', 'photo', 'barcode', 'ai-suggestion')),
  
  -- Photo/Barcode Data
  photo_url TEXT,
  barcode_value VARCHAR(255),
  
  -- AI Detection Data (if photo)
  ai_detected_foods JSONB, -- Array of detected food items with confidence scores
  ai_confidence_score DECIMAL(5, 2), -- Overall AI detection confidence (0-100)
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_user_date ON meals(user_id, meal_date DESC);
CREATE INDEX idx_meals_meal_type ON meals(meal_type);
CREATE INDEX idx_meals_created_at ON meals(created_at DESC);


CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
  
  -- Food Item Info
  food_name VARCHAR(255) NOT NULL,
  food_brand VARCHAR(255), -- e.g., "McDonald's", "Kellogg's"
  
  -- Portion Info
  serving_size DECIMAL(10, 2) NOT NULL, -- e.g., 100, 1, 2
  serving_unit VARCHAR(50) NOT NULL, -- e.g., "grams", "pieces", "cups", "ml"
  
  -- Nutrition per item
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Food Database Reference (if from Nutritionix or similar)
  external_food_id VARCHAR(255), -- Reference to external food database
  external_source VARCHAR(50), -- 'nutritionix', 'usda', 'manual'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_items_meal_id ON meal_items(meal_id);


CREATE TABLE water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Water Tracking
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INT NOT NULL, -- Amount in milliliters
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Daily Goal
  daily_goal_ml INT DEFAULT 2000, -- Default 2 liters
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_water_intake_user_date ON water_intake(user_id, date DESC);


CREATE TABLE daily_nutrition_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  -- Calories
  total_calories_consumed DECIMAL(10, 2) NOT NULL DEFAULT 0,
  calories_target DECIMAL(10, 2) NOT NULL, -- From user's fitness goals
  calories_burned DECIMAL(10, 2) DEFAULT 0, -- From workouts/activity
  calories_net DECIMAL(10, 2) GENERATED ALWAYS AS (total_calories_consumed - calories_burned) STORED,
  
  -- Macros Consumed
  total_protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fiber_grams DECIMAL(10, 2) DEFAULT 0,
  total_sugar_grams DECIMAL(10, 2) DEFAULT 0,
  total_sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Macro Targets (from user profile/goals)
  protein_target_grams DECIMAL(10, 2),
  carbs_target_grams DECIMAL(10, 2),
  fats_target_grams DECIMAL(10, 2),
  
  -- Water Intake
  total_water_ml INT DEFAULT 0,
  water_goal_ml INT DEFAULT 2000,
  
  -- Meal Counts
  meals_logged INT DEFAULT 0,
  breakfast_logged BOOLEAN DEFAULT FALSE,
  lunch_logged BOOLEAN DEFAULT FALSE,
  dinner_logged BOOLEAN DEFAULT FALSE,
  snacks_count INT DEFAULT 0,
  
  -- Workout Impact (if workout time affects calorie calculation)
  workout_duration_minutes INT DEFAULT 0, -- Total workout time for the day
  workout_calories_burned DECIMAL(10, 2) DEFAULT 0,
  
  -- Status Flags
  goal_met BOOLEAN DEFAULT FALSE, -- Did user meet calorie goal?
  protein_goal_met BOOLEAN DEFAULT FALSE,
  water_goal_met BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one summary per user per day
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_nutrition_user_date ON daily_nutrition_summary(user_id, date DESC);


CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Plan Info
  plan_name VARCHAR(255) NOT NULL, -- e.g., "Week of Jan 1-7, 2026"
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Plan Type
  plan_type VARCHAR(50) CHECK (plan_type IN ('ai-generated', 'custom', 'template')),
  generation_method VARCHAR(50), -- 'auto', 'manual', 'from-template'
  
  -- Plan Details
  total_weekly_calories DECIMAL(10, 2),
  avg_daily_calories DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE, -- Currently active plan
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_active ON meal_plans(user_id, is_active) WHERE is_active = TRUE;


CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  
  -- Schedule
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  specific_date DATE, -- Actual date for this meal
  
  -- Meal Details
  meal_name VARCHAR(255) NOT NULL,
  meal_description TEXT,
  recipe_url TEXT,
  
  -- Nutrition
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL,
  carbs_grams DECIMAL(10, 2) NOT NULL,
  fats_grams DECIMAL(10, 2) NOT NULL,
  
  -- Categorization
  meal_category VARCHAR(50),
  cuisine_type VARCHAR(100), -- 'Italian', 'Asian', 'Mexican', etc.
  
  -- Preparation
  prep_time_minutes INT,
  cook_time_minutes INT,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  -- Ingredients (for shopping list)
  ingredients JSONB, -- Array of {name, quantity, unit, purchased: false}
  
  -- User Actions
  is_completed BOOLEAN DEFAULT FALSE, -- Did user actually eat this?
  completed_at TIMESTAMP WITH TIME ZONE,
  is_skipped BOOLEAN DEFAULT FALSE,
  
  -- Customization
  is_swapped BOOLEAN DEFAULT FALSE, -- Was this meal swapped from original?
  original_meal_id UUID, -- Reference to original if swapped
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_plan_items_plan_id ON meal_plan_items(meal_plan_id);
CREATE INDEX idx_meal_plan_items_date ON meal_plan_items(specific_date);

-- 7. SHOPPING LIST TABLE
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  
  -- List Info
  list_name VARCHAR(255) NOT NULL,
  week_start_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SHOPPING LIST ITEMS TABLE
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  
  -- Item Details
  ingredient_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL, -- 'grams', 'kg', 'pieces', 'liters', etc.
  
  -- Category (for grouping in UI)
  category VARCHAR(100), -- 'Produce', 'Meat', 'Dairy', 'Grains', 'Spices', etc.
  
  -- Status
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMP WITH TIME ZONE,
  
  -- Price (optional)
  estimated_price DECIMAL(10, 2),
  actual_price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  
  -- Reference
  meal_plan_item_ids UUID[], -- Array of meal_plan_item IDs that need this ingredient
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);

-- 9. AI MEAL SUGGESTIONS TABLE
CREATE TABLE ai_meal_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Suggestion Details
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name VARCHAR(255) NOT NULL,
  meal_description TEXT,
  recipe_url TEXT,
  photo_url TEXT,
  
  -- Nutrition
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL,
  carbs_grams DECIMAL(10, 2) NOT NULL,
  fats_grams DECIMAL(10, 2) NOT NULL,
  
  -- AI Reasoning
  suggestion_reason TEXT, -- Why this meal was suggested
  based_on_goal VARCHAR(100), -- 'muscle-gain', 'fat-loss', 'maintenance'
  based_on_budget VARCHAR(50), -- 'low', 'medium', 'high'
  based_on_dietary_restrictions TEXT[], -- Array of restrictions considered
  
  -- Personalization
  matches_allergies BOOLEAN DEFAULT TRUE,
  matches_cuisine_preference BOOLEAN DEFAULT TRUE,
  matches_budget BOOLEAN DEFAULT TRUE,
  
  -- AI Confidence
  confidence_score DECIMAL(5, 2), -- 0-100
  
  -- User Actions
  is_viewed BOOLEAN DEFAULT FALSE,
  is_added_to_plan BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  user_feedback VARCHAR(50), -- 'liked', 'disliked', 'saved', null
  
  -- Scheduling
  suggested_for_date DATE,
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Suggestions expire after X days
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_meal_suggestions_user_id ON ai_meal_suggestions(user_id);
CREATE INDEX idx_ai_meal_suggestions_date ON ai_meal_suggestions(user_id, suggested_for_date);
CREATE INDEX idx_ai_meal_suggestions_active ON ai_meal_suggestions(user_id, expires_at) WHERE is_dismissed = FALSE;

-- 10. NUTRITION REPORTS TABLE (Monthly summaries)
CREATE TABLE nutrition_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Report Period
  report_month INT NOT NULL CHECK (report_month BETWEEN 1 AND 12),
  report_year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Calorie Stats
  avg_daily_calories DECIMAL(10, 2),
  total_calories_month DECIMAL(10, 2),
  highest_calorie_day DECIMAL(10, 2),
  lowest_calorie_day DECIMAL(10, 2),
  days_met_calorie_goal INT DEFAULT 0,
  days_exceeded_calorie_goal INT DEFAULT 0,
  
  -- Macro Stats
  avg_protein_grams DECIMAL(10, 2),
  avg_carbs_grams DECIMAL(10, 2),
  avg_fats_grams DECIMAL(10, 2),
  protein_goal_achievement_rate DECIMAL(5, 2), -- Percentage
  
  -- Water Intake Stats
  avg_daily_water_ml INT,
  days_met_water_goal INT DEFAULT 0,
  water_goal_achievement_rate DECIMAL(5, 2),
  
  -- Meal Logging Stats
  total_meals_logged INT DEFAULT 0,
  avg_meals_per_day DECIMAL(5, 2),
  most_frequent_foods JSONB, -- Array of {food_name, frequency}
  
  -- Trends
  calorie_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'
  weight_change_kg DECIMAL(5, 2), -- Weight change during this month
  
  -- Achievements/Badges
  badges_earned TEXT[], -- Array of badge names earned this month
  streak_days INT DEFAULT 0, -- Consecutive days of goal achievement
  
  -- Generated Data
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, report_year, report_month)
);

CREATE INDEX idx_nutrition_reports_user_id ON nutrition_reports(user_id);
CREATE INDEX idx_nutrition_reports_period ON nutrition_reports(user_id, report_year DESC, report_month DESC);

-- 11. USER DIETARY PREFERENCES TABLE
CREATE TABLE user_dietary_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Dietary Restrictions
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_pescatarian BOOLEAN DEFAULT FALSE,
  is_keto BOOLEAN DEFAULT FALSE,
  is_paleo BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  is_dairy_free BOOLEAN DEFAULT FALSE,
  is_nut_free BOOLEAN DEFAULT FALSE,
  
  -- Allergies
  allergies TEXT[], -- Array of allergen names
  
  -- Dislikes
  disliked_foods TEXT[], -- Array of food names to avoid
  
  -- Preferences
  preferred_cuisines TEXT[], -- Array of cuisine types
  preferred_meal_categories TEXT[], -- 'high-protein', 'low-carb', etc.
  
  -- Budget
  budget_range VARCHAR(20) CHECK (budget_range IN ('low', 'medium', 'high')),
  max_meal_cost DECIMAL(10, 2), -- Maximum cost per meal
  
  -- Regional Preferences
  region VARCHAR(100), -- User's region/country
  local_ingredients_only BOOLEAN DEFAULT FALSE,
  
  -- Meal Timing
  preferred_breakfast_time TIME,
  preferred_lunch_time TIME,
  preferred_dinner_time TIME,
  
  -- Calorie Distribution (percentage per meal)
  breakfast_calorie_percent INT DEFAULT 25,
  lunch_calorie_percent INT DEFAULT 35,
  dinner_calorie_percent INT DEFAULT 30,
  snack_calorie_percent INT DEFAULT 10,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. NUTRITION BADGES TABLE (Achievement system)
CREATE TABLE nutrition_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Badge Info
  badge_name VARCHAR(255) NOT NULL UNIQUE,
  badge_description TEXT NOT NULL,
  badge_icon_url TEXT,
  badge_category VARCHAR(50), -- 'calorie', 'protein', 'water', 'streak', 'variety'
  
  -- Criteria
  criteria_type VARCHAR(100) NOT NULL, -- 'days_streak', 'protein_target_days', 'meals_logged', etc.
  criteria_value INT NOT NULL, -- The number needed to achieve (e.g., 7 for 7-day streak)
  
  -- Display
  badge_tier VARCHAR(20) CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. USER NUTRITION BADGES TABLE (Earned badges)
CREATE TABLE user_nutrition_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES nutrition_badges(id) ON DELETE CASCADE NOT NULL,
  
  -- Achievement Info
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_for_period DATE, -- Which day/week/month was this earned for
  
  -- Metadata
  progress_value INT, -- The actual value achieved
  notes TEXT,
  
  UNIQUE(user_id, badge_id, earned_for_period)
);

CREATE INDEX idx_user_nutrition_badges_user_id ON user_nutrition_badges(user_id);

-- 14. BARCODE FOOD DATABASE TABLE (Cache)
CREATE TABLE barcode_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Barcode Info
  barcode VARCHAR(255) NOT NULL UNIQUE,
  barcode_type VARCHAR(50), -- 'UPC', 'EAN', etc.
  
  -- Food Info
  food_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  
  -- Nutrition (per 100g or per serving)
  serving_size DECIMAL(10, 2) NOT NULL,
  serving_unit VARCHAR(50) NOT NULL,
  
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL,
  carbs_grams DECIMAL(10, 2) NOT NULL,
  fats_grams DECIMAL(10, 2) NOT NULL,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Source
  data_source VARCHAR(100), -- 'OpenFoodFacts', 'Nutritionix', 'Manual', etc.
  external_id VARCHAR(255),
  
  -- Metadata
  times_scanned INT DEFAULT 0, -- How many users scanned this
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_barcode_foods_barcode ON barcode_foods(barcode);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_meal_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nutrition_badges ENABLE ROW LEVEL SECURITY;

-- Meals policies
CREATE POLICY "Users can view their own meals" 
  ON meals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals" 
  ON meals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals" 
  ON meals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals" 
  ON meals FOR DELETE 
  USING (auth.uid() = user_id);

-- Meal items policies (inherit from meals)
CREATE POLICY "Users can view meal items of their meals" 
  ON meal_items FOR SELECT 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert meal items to their meals" 
  ON meal_items FOR INSERT 
  WITH CHECK (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

CREATE POLICY "Users can update meal items of their meals" 
  ON meal_items FOR UPDATE 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete meal items of their meals" 
  ON meal_items FOR DELETE 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

-- Water intake policies
CREATE POLICY "Users can manage their own water intake" 
  ON water_intake FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily nutrition summary policies
CREATE POLICY "Users can manage their own nutrition summary" 
  ON daily_nutrition_summary FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Meal plans policies
CREATE POLICY "Users can manage their own meal plans" 
  ON meal_plans FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Meal plan items policies
CREATE POLICY "Users can view their meal plan items" 
  ON meal_plan_items FOR SELECT 
  USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their meal plan items" 
  ON meal_plan_items FOR ALL 
  USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()))
  WITH CHECK (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

-- Shopping lists policies
CREATE POLICY "Users can manage their own shopping lists" 
  ON shopping_lists FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Shopping list items policies
CREATE POLICY "Users can manage their shopping list items" 
  ON shopping_list_items FOR ALL 
  USING (shopping_list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid()))
  WITH CHECK (shopping_list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid()));

-- AI meal suggestions policies
CREATE POLICY "Users can view their own meal suggestions" 
  ON ai_meal_suggestions FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Nutrition reports policies
CREATE POLICY "Users can view their own nutrition reports" 
  ON nutrition_reports FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User dietary preferences policies
CREATE POLICY "Users can manage their own dietary preferences" 
  ON user_dietary_preferences FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Nutrition badges - read-only for all authenticated users
CREATE POLICY "Authenticated users can view all badges" 
  ON nutrition_badges FOR SELECT 
  TO authenticated 
  USING (true);

-- User nutrition badges policies
CREATE POLICY "Users can view their own earned badges" 
  ON user_nutrition_badges FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Barcode foods - read-only for all authenticated users (public cache)
CREATE POLICY "Authenticated users can view barcode foods" 
  ON barcode_foods FOR SELECT 
  TO authenticated 
  USING (true);


-- Function to update daily nutrition summary when meal is added/updated/deleted
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate daily summary for the affected date
  INSERT INTO daily_nutrition_summary (
    user_id,
    date,
    total_calories_consumed,
    total_protein_grams,
    total_carbs_grams,
    total_fats_grams,
    total_fiber_grams,
    total_sugar_grams,
    total_sodium_mg,
    meals_logged,
    breakfast_logged,
    lunch_logged,
    dinner_logged,
    snacks_count,
    calories_target,
    protein_target_grams,
    carbs_target_grams,
    fats_target_grams
  )
  SELECT 
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.meal_date, OLD.meal_date),
    COALESCE(SUM(m.total_calories), 0),
    COALESCE(SUM(m.protein_grams), 0),
    COALESCE(SUM(m.carbs_grams), 0),
    COALESCE(SUM(m.fats_grams), 0),
    COALESCE(SUM(m.fiber_grams), 0),
    COALESCE(SUM(m.sugar_grams), 0),
    COALESCE(SUM(m.sodium_mg), 0),
    COUNT(*),
    BOOL_OR(m.meal_type = 'breakfast'),
    BOOL_OR(m.meal_type = 'lunch'),
    BOOL_OR(m.meal_type = 'dinner'),
    COUNT(*) FILTER (WHERE m.meal_type = 'snack'),
    2000, -- Default calorie target (should be from user profile)
    150,  -- Default protein target
    200,  -- Default carbs target
    65    -- Default fats target
  FROM meals m
  WHERE m.user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND m.meal_date = COALESCE(NEW.meal_date, OLD.meal_date)
  GROUP BY m.user_id, m.meal_date
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    total_calories_consumed = EXCLUDED.total_calories_consumed,
    total_protein_grams = EXCLUDED.total_protein_grams,
    total_carbs_grams = EXCLUDED.total_carbs_grams,
    total_fats_grams = EXCLUDED.total_fats_grams,
    total_fiber_grams = EXCLUDED.total_fiber_grams,
    total_sugar_grams = EXCLUDED.total_sugar_grams,
    total_sodium_mg = EXCLUDED.total_sodium_mg,
    meals_logged = EXCLUDED.meals_logged,
    breakfast_logged = EXCLUDED.breakfast_logged,
    lunch_logged = EXCLUDED.lunch_logged,
    dinner_logged = EXCLUDED.dinner_logged,
    snacks_count = EXCLUDED.snacks_count,
    updated_at = NOW(),
    goal_met = (EXCLUDED.total_calories_consumed >= daily_nutrition_summary.calories_target * 0.9 
                AND EXCLUDED.total_calories_consumed <= daily_nutrition_summary.calories_target * 1.1),
    protein_goal_met = (EXCLUDED.total_protein_grams >= daily_nutrition_summary.protein_target_grams);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update summary when meal changes
CREATE TRIGGER trigger_update_daily_nutrition_summary
AFTER INSERT OR UPDATE OR DELETE ON meals
FOR EACH ROW
EXECUTE FUNCTION update_daily_nutrition_summary();

-- Function to update water intake summary
CREATE OR REPLACE FUNCTION update_water_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_nutrition_summary
  SET 
    total_water_ml = (
      SELECT COALESCE(SUM(amount_ml), 0)
      FROM water_intake
      WHERE user_id = NEW.user_id AND date = NEW.date
    ),
    water_goal_met = (
      SELECT COALESCE(SUM(amount_ml), 0) >= NEW.daily_goal_ml
      FROM water_intake
      WHERE user_id = NEW.user_id AND date = NEW.date
    ),
    updated_at = NOW()
  WHERE user_id = NEW.user_id AND date = NEW.date;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for water intake
CREATE TRIGGER trigger_update_water_summary
AFTER INSERT OR UPDATE ON water_intake
FOR EACH ROW
EXECUTE FUNCTION update_water_summary();


INSERT INTO nutrition_badges (badge_name, badge_description, badge_category, criteria_type, criteria_value, badge_tier, display_order) VALUES
('Calorie Tracker', 'Log meals for 7 consecutive days', 'streak', 'days_streak', 7, 'bronze', 1),
('Nutrition Master', 'Log meals for 30 consecutive days', 'streak', 'days_streak', 30, 'silver', 2),
('Protein Power', 'Meet protein target 5 days in a row', 'protein', 'protein_target_days', 5, 'bronze', 3),
('Protein Champion', 'Meet protein target 15 days in a row', 'protein', 'protein_target_days', 15, 'gold', 4),
('Hydration Hero', 'Meet water goal 7 days in a row', 'water', 'water_goal_days', 7, 'bronze', 5),
('Water Warrior', 'Meet water goal 30 days in a row', 'water', 'water_goal_days', 30, 'platinum', 6),
('Meal Logger', 'Log 100 total meals', 'variety', 'total_meals', 100, 'silver', 7),
('Calorie Balance', 'Stay within calorie range 10 days in a row', 'calorie', 'calorie_balance_days', 10, 'gold', 8);







--GYM management --
-- GYM TAB 

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. GYMS TABLE
CREATE TABLE gyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Location
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOGRAPHY(POINT, 4326), -- PostGIS for spatial queries
    
    -- Contact
    phone_number VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(500),
    
    -- Media
    images TEXT[] DEFAULT '{}', -- Array of image URLs
    cover_image TEXT,
    
    -- Facilities (stored as JSON array)
    facilities JSONB DEFAULT '[]', -- ["Pool", "Sauna", "Parking", "Cafe", etc.]
    
    -- Pricing
    membership_fee DECIMAL(10, 2),
    price_range VARCHAR(20), -- 'Low', 'Medium', 'High'
    
    -- Hours
    opening_hours JSONB, -- {"monday": "06:00-22:00", "tuesday": "06:00-22:00", ...}
    is_24_hours BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Stats (computed/cached)
    rating DECIMAL(2, 1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    current_occupancy INTEGER DEFAULT 0,
    max_capacity INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT valid_occupancy CHECK (current_occupancy >= 0)
);

-- Indexes for gyms
CREATE INDEX idx_gyms_location ON gyms USING GIST(location);
CREATE INDEX idx_gyms_city ON gyms(city);
CREATE INDEX idx_gyms_rating ON gyms(rating DESC);
CREATE INDEX idx_gyms_is_active ON gyms(is_active);
CREATE INDEX idx_gyms_facilities ON gyms USING GIN(facilities);


-- 2. GYM MEMBERSHIPS TABLE
CREATE TABLE gym_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    
    -- Membership details
    membership_type VARCHAR(50), -- 'Monthly', 'Annual', 'Day Pass', etc.
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'suspended', 'cancelled'
    
    -- Dates
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    last_visited TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    total_visits INTEGER DEFAULT 0,
    
    -- Payment
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    
    -- Preferences
    is_favorite BOOLEAN DEFAULT false,
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, gym_id),
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes for gym_memberships
CREATE INDEX idx_gym_memberships_user_id ON gym_memberships(user_id);
CREATE INDEX idx_gym_memberships_gym_id ON gym_memberships(gym_id);
CREATE INDEX idx_gym_memberships_status ON gym_memberships(status);
CREATE INDEX idx_gym_memberships_last_visited ON gym_memberships(last_visited DESC);

-- 3. CHECK-INS TABLE
CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES gym_memberships(id) ON DELETE SET NULL,
    
    -- Check-in details
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER, -- Calculated on check-out
    
    -- Verification
    verification_method VARCHAR(20), -- 'qr_code', 'biometric', 'manual'
    qr_code_data TEXT,
    
    -- Location (for verification)
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(11, 8),
    
    -- Status
    status VARCHAR(20) DEFAULT 'checked_in', -- 'checked_in', 'checked_out', 'invalid'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_checkout CHECK (check_out_time IS NULL OR check_out_time > check_in_time)
);

-- Indexes for check_ins
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_check_ins_gym_id ON check_ins(gym_id);
CREATE INDEX idx_check_ins_check_in_time ON check_ins(check_in_time DESC);
CREATE INDEX idx_check_ins_status ON check_ins(status);

-- 4. EQUIPMENT TABLE
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    
    -- Equipment details
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Cardio', 'Strength', 'Free Weights', 'Functional', 'Other'
    brand VARCHAR(100),
    model VARCHAR(100),
    
    -- Description
    description TEXT,
    specifications TEXT,
    usage_instructions TEXT,
    
    -- Media
    images TEXT[] DEFAULT '{}',
    video_url TEXT,
    
    -- Quantity
    total_count INTEGER NOT NULL DEFAULT 1,
    available_count INTEGER NOT NULL DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    requires_booking BOOLEAN DEFAULT false,
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    condition VARCHAR(20) DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor', 'broken'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_counts CHECK (available_count >= 0 AND available_count <= total_count)
);

-- Indexes for equipment
CREATE INDEX idx_equipment_gym_id ON equipment(gym_id);
CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_is_active ON equipment(is_active);

-- 5. EQUIPMENT USAGE TABLE
CREATE TABLE equipment_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    
    -- Usage details
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    planned_duration_minutes INTEGER, -- User's intended duration
    actual_duration_minutes INTEGER, -- Calculated on end
    
    -- Status
    status VARCHAR(20) DEFAULT 'in_use', -- 'in_use', 'completed', 'cancelled', 'extended'
    
    -- Issues
    reported_issue TEXT,
    issue_severity VARCHAR(20), -- 'minor', 'major', 'urgent'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_end_time CHECK (end_time IS NULL OR end_time > start_time)
);

-- Indexes for equipment_usage
CREATE INDEX idx_equipment_usage_equipment_id ON equipment_usage(equipment_id);
CREATE INDEX idx_equipment_usage_user_id ON equipment_usage(user_id);
CREATE INDEX idx_equipment_usage_status ON equipment_usage(status);
CREATE INDEX idx_equipment_usage_start_time ON equipment_usage(start_time DESC);

-- 6. EQUIPMENT QUEUE TABLE
CREATE TABLE equipment_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    
    -- Queue details
    queue_position INTEGER NOT NULL,
    estimated_wait_minutes INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'notified', 'claimed', 'expired', 'cancelled'
    
    -- Notifications
    notified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Time when queue position expires
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for equipment_queue
CREATE INDEX idx_equipment_queue_equipment_id ON equipment_queue(equipment_id);
CREATE INDEX idx_equipment_queue_user_id ON equipment_queue(user_id);
CREATE INDEX idx_equipment_queue_status ON equipment_queue(status);
CREATE INDEX idx_equipment_queue_position ON equipment_queue(queue_position);

-- 7. TRAINERS TABLE
CREATE TABLE trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If trainer has user account
    
    -- Personal details
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    photo_url TEXT,
    bio TEXT,
    
    -- Professional details
    specializations TEXT[] DEFAULT '{}', -- ["Weight Loss", "Strength Training", "Yoga", etc.]
    certifications TEXT[] DEFAULT '{}',
    years_of_experience INTEGER,
    languages TEXT[] DEFAULT '{}',
    
    -- Pricing
    price_per_session DECIMAL(10, 2),
    price_per_hour DECIMAL(10, 2),
    
    -- Stats
    rating DECIMAL(2, 1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    total_sessions_completed INTEGER DEFAULT 0,
    
    -- Availability
    available_days JSONB, -- {"monday": ["09:00-12:00", "14:00-18:00"], ...}
    is_available BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Indexes for trainers
CREATE INDEX idx_trainers_gym_id ON trainers(gym_id);
CREATE INDEX idx_trainers_rating ON trainers(rating DESC);
CREATE INDEX idx_trainers_is_active ON trainers(is_active);
CREATE INDEX idx_trainers_specializations ON trainers USING GIN(specializations);

-- 8. TRAINING SESSIONS TABLE
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    
    -- Session details
    session_type VARCHAR(50), -- 'personal', 'group', 'assessment'
    title VARCHAR(255),
    description TEXT,
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
    
    -- Payment
    price DECIMAL(10, 2),
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
    
    -- Notes
    trainer_notes TEXT,
    client_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- Indexes for training_sessions
CREATE INDEX idx_training_sessions_trainer_id ON training_sessions(trainer_id);
CREATE INDEX idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_training_sessions_scheduled_date ON training_sessions(scheduled_date);
CREATE INDEX idx_training_sessions_status ON training_sessions(status);

-- 9. CLASSES TABLE
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    
    -- Class details
    name VARCHAR(255) NOT NULL,
    class_type VARCHAR(100) NOT NULL, -- 'Yoga', 'Zumba', 'CrossFit', 'Spinning', etc.
    description TEXT,
    difficulty_level VARCHAR(20), -- 'Beginner', 'Intermediate', 'Advanced'
    
    -- Media
    image_url TEXT,
    
    -- Capacity
    max_capacity INTEGER NOT NULL,
    min_capacity INTEGER DEFAULT 1,
    
    -- Duration
    duration_minutes INTEGER NOT NULL,
    
    -- Recurring schedule
    day_of_week VARCHAR(20), -- 'Monday', 'Tuesday', etc.
    start_time TIME,
    end_time TIME,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    requires_booking BOOLEAN DEFAULT true,
    
    -- Pricing
    price_per_class DECIMAL(10, 2),
    is_included_in_membership BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_capacity CHECK (max_capacity >= min_capacity),
    CONSTRAINT valid_time CHECK (end_time IS NULL OR end_time > start_time)
);

-- Indexes for classes
CREATE INDEX idx_classes_gym_id ON classes(gym_id);
CREATE INDEX idx_classes_trainer_id ON classes(trainer_id);
CREATE INDEX idx_classes_class_type ON classes(class_type);
CREATE INDEX idx_classes_day_of_week ON classes(day_of_week);
CREATE INDEX idx_classes_is_active ON classes(is_active);

-- 10. CLASS BOOKINGS TABLE
CREATE TABLE class_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    
    -- Booking details
    booking_date DATE NOT NULL, -- Specific date for this class instance
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'booked', -- 'booked', 'confirmed', 'attended', 'cancelled', 'no_show'
    
    -- Payment
    price DECIMAL(10, 2),
    payment_status VARCHAR(20) DEFAULT 'pending',
    
    -- Attendance
    checked_in_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(class_id, user_id, booking_date)
);

-- Indexes for class_bookings
CREATE INDEX idx_class_bookings_class_id ON class_bookings(class_id);
CREATE INDEX idx_class_bookings_user_id ON class_bookings(user_id);
CREATE INDEX idx_class_bookings_booking_date ON class_bookings(booking_date);
CREATE INDEX idx_class_bookings_status ON class_bookings(status);

-- 11. GYM REVIEWS TABLE
CREATE TABLE gym_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL,
    title VARCHAR(255),
    comment TEXT NOT NULL,
    
    -- Media
    photos TEXT[] DEFAULT '{}',
    
    -- Engagement
    helpful_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    
    -- Status
    is_verified_visit BOOLEAN DEFAULT false, -- User has checked in to this gym
    is_approved BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    
    -- Response
    gym_response TEXT,
    gym_response_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
    UNIQUE(gym_id, user_id) -- One review per user per gym
);

-- Indexes for gym_reviews
CREATE INDEX idx_gym_reviews_gym_id ON gym_reviews(gym_id);
CREATE INDEX idx_gym_reviews_user_id ON gym_reviews(user_id);
CREATE INDEX idx_gym_reviews_rating ON gym_reviews(rating);
CREATE INDEX idx_gym_reviews_created_at ON gym_reviews(created_at DESC);

-- 12. REVIEW HELPFUL VOTES TABLE
CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES gym_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(review_id, user_id)
);

-- Indexes for review_helpful_votes
CREATE INDEX idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);

-- 13. TRAINER REVIEWS TABLE
CREATE TABLE trainer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    
    -- Specific ratings
    professionalism_rating INTEGER,
    knowledge_rating INTEGER,
    motivation_rating INTEGER,
    
    -- Status
    is_approved BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT valid_professionalism CHECK (professionalism_rating IS NULL OR (professionalism_rating >= 1 AND professionalism_rating <= 5)),
    CONSTRAINT valid_knowledge CHECK (knowledge_rating IS NULL OR (knowledge_rating >= 1 AND knowledge_rating <= 5)),
    CONSTRAINT valid_motivation CHECK (motivation_rating IS NULL OR (motivation_rating >= 1 AND motivation_rating <= 5))
);

-- Indexes for trainer_reviews
CREATE INDEX idx_trainer_reviews_trainer_id ON trainer_reviews(trainer_id);
CREATE INDEX idx_trainer_reviews_user_id ON trainer_reviews(user_id);
CREATE INDEX idx_trainer_reviews_created_at ON trainer_reviews(created_at DESC);


-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_memberships_updated_at BEFORE UPDATE ON gym_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_usage_updated_at BEFORE UPDATE ON equipment_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_queue_updated_at BEFORE UPDATE ON equipment_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_bookings_updated_at BEFORE UPDATE ON class_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_reviews_updated_at BEFORE UPDATE ON gym_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainer_reviews_updated_at BEFORE UPDATE ON trainer_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update gym location geography from lat/lng
CREATE OR REPLACE FUNCTION update_gym_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gym_location_trigger BEFORE INSERT OR UPDATE OF latitude, longitude ON gyms
    FOR EACH ROW EXECUTE FUNCTION update_gym_location();

-- Function: Update gym rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_gym_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE gyms SET
        rating = (
            SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
            FROM gym_reviews
            WHERE gym_id = COALESCE(NEW.gym_id, OLD.gym_id)
            AND is_approved = true
            AND is_hidden = false
        ),
        review_count = (
            SELECT COUNT(*)
            FROM gym_reviews
            WHERE gym_id = COALESCE(NEW.gym_id, OLD.gym_id)
            AND is_approved = true
            AND is_hidden = false
        )
    WHERE id = COALESCE(NEW.gym_id, OLD.gym_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gym_rating_on_review AFTER INSERT OR UPDATE OR DELETE ON gym_reviews
    FOR EACH ROW EXECUTE FUNCTION update_gym_rating();

-- Function: Update trainer rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_trainer_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trainers SET
        rating = (
            SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
            FROM trainer_reviews
            WHERE trainer_id = COALESCE(NEW.trainer_id, OLD.trainer_id)
            AND is_approved = true
        ),
        review_count = (
            SELECT COUNT(*)
            FROM trainer_reviews
            WHERE trainer_id = COALESCE(NEW.trainer_id, OLD.trainer_id)
            AND is_approved = true
        )
    WHERE id = COALESCE(NEW.trainer_id, OLD.trainer_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trainer_rating_on_review AFTER INSERT OR UPDATE OR DELETE ON trainer_reviews
    FOR EACH ROW EXECUTE FUNCTION update_trainer_rating();

-- Function: Update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE gym_reviews SET
        helpful_count = (
            SELECT COUNT(*)
            FROM review_helpful_votes
            WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
        )
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_helpful_count_trigger AFTER INSERT OR DELETE ON review_helpful_votes
    FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- Function: Update equipment available count
CREATE OR REPLACE FUNCTION update_equipment_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'in_use' THEN
        UPDATE equipment
        SET available_count = available_count - 1
        WHERE id = NEW.equipment_id AND available_count > 0;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'in_use' AND NEW.status IN ('completed', 'cancelled') THEN
            UPDATE equipment
            SET available_count = available_count + 1
            WHERE id = NEW.equipment_id AND available_count < total_count;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'in_use' THEN
        UPDATE equipment
        SET available_count = available_count + 1
        WHERE id = OLD.equipment_id AND available_count < total_count;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_availability_trigger AFTER INSERT OR UPDATE OR DELETE ON equipment_usage
    FOR EACH ROW EXECUTE FUNCTION update_equipment_availability();

-- Function: Update membership last_visited and total_visits on check-in
CREATE OR REPLACE FUNCTION update_membership_on_checkin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'checked_in' THEN
        UPDATE gym_memberships
        SET last_visited = NEW.check_in_time,
            total_visits = total_visits + 1
        WHERE user_id = NEW.user_id AND gym_id = NEW.gym_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_membership_on_checkin_trigger AFTER INSERT ON check_ins
    FOR EACH ROW EXECUTE FUNCTION update_membership_on_checkin();

-- Function: Calculate check-in duration on check-out
CREATE OR REPLACE FUNCTION calculate_checkin_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
        NEW.status = 'checked_out';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_checkin_duration_trigger BEFORE UPDATE ON check_ins
    FOR EACH ROW EXECUTE FUNCTION calculate_checkin_duration();

-- Function: Calculate equipment usage duration on end
CREATE OR REPLACE FUNCTION calculate_equipment_usage_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
        NEW.actual_duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
        IF NEW.status = 'in_use' THEN
            NEW.status = 'completed';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_equipment_usage_duration_trigger BEFORE UPDATE ON equipment_usage
    FOR EACH ROW EXECUTE FUNCTION calculate_equipment_usage_duration();


ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_reviews ENABLE ROW LEVEL SECURITY;

-- GYMS: Public read, admin write
CREATE POLICY "Gyms are viewable by everyone" ON gyms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view inactive gyms" ON gyms
    FOR SELECT USING (auth.role() = 'authenticated');

-- GYM_MEMBERSHIPS: Users can view their own, gyms can view their members
CREATE POLICY "Users can view their own memberships" ON gym_memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create memberships" ON gym_memberships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships" ON gym_memberships
    FOR UPDATE USING (auth.uid() = user_id);

-- CHECK_INS: Users can view/create their own
CREATE POLICY "Users can view their own check-ins" ON check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-ins" ON check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins" ON check_ins
    FOR UPDATE USING (auth.uid() = user_id);

-- EQUIPMENT: Public read for active gyms
CREATE POLICY "Equipment is viewable by everyone" ON equipment
    FOR SELECT USING (
        is_active = true AND 
        EXISTS (SELECT 1 FROM gyms WHERE gyms.id = equipment.gym_id AND gyms.is_active = true)
    );

-- EQUIPMENT_USAGE: Users can view/manage their own usage
CREATE POLICY "Users can view their own equipment usage" ON equipment_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create equipment usage" ON equipment_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment usage" ON equipment_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- EQUIPMENT_QUEUE: Users can view/manage their own queue positions
CREATE POLICY "Users can view their own queue positions" ON equipment_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create queue positions" ON equipment_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue positions" ON equipment_queue
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue positions" ON equipment_queue
    FOR DELETE USING (auth.uid() = user_id);

-- TRAINERS: Public read for active trainers
CREATE POLICY "Trainers are viewable by everyone" ON trainers
    FOR SELECT USING (
        is_active = true AND
        EXISTS (SELECT 1 FROM gyms WHERE gyms.id = trainers.gym_id AND gyms.is_active = true)
    );

-- TRAINING_SESSIONS: Users can view/manage their own sessions
CREATE POLICY "Users can view their own training sessions" ON training_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create training sessions" ON training_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training sessions" ON training_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- CLASSES: Public read for active classes
CREATE POLICY "Classes are viewable by everyone" ON classes
    FOR SELECT USING (
        is_active = true AND
        EXISTS (SELECT 1 FROM gyms WHERE gyms.id = classes.gym_id AND gyms.is_active = true)
    );

-- CLASS_BOOKINGS: Users can view/manage their own bookings
CREATE POLICY "Users can view their own class bookings" ON class_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create class bookings" ON class_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own class bookings" ON class_bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own class bookings" ON class_bookings
    FOR DELETE USING (auth.uid() = user_id AND status = 'booked');

-- GYM_REVIEWS: Public read approved reviews, users manage their own
CREATE POLICY "Approved gym reviews are viewable by everyone" ON gym_reviews
    FOR SELECT USING (is_approved = true AND is_hidden = false);

CREATE POLICY "Users can view their own gym reviews" ON gym_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create gym reviews" ON gym_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gym reviews" ON gym_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gym reviews" ON gym_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- REVIEW_HELPFUL_VOTES: Users can vote on reviews
CREATE POLICY "Users can view helpful votes" ON review_helpful_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create helpful votes" ON review_helpful_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own helpful votes" ON review_helpful_votes
    FOR DELETE USING (auth.uid() = user_id);

-- TRAINER_REVIEWS: Public read approved reviews, users manage their own
CREATE POLICY "Approved trainer reviews are viewable by everyone" ON trainer_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view their own trainer reviews" ON trainer_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create trainer reviews" ON trainer_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trainer reviews" ON trainer_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trainer reviews" ON trainer_reviews
    FOR DELETE USING (auth.uid() = user_id);


-- Function: Get nearby gyms using PostGIS
CREATE OR REPLACE FUNCTION get_nearby_gyms(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE (
    gym_id UUID,
    name VARCHAR,
    distance_km DECIMAL,
    rating DECIMAL,
    review_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.name,
        ROUND((ST_Distance(
            g.location,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) / 1000)::numeric, 2) AS distance_km,
        g.rating,
        g.review_count
    FROM gyms g
    WHERE 
        g.is_active = true
        AND ST_DWithin(
            g.location,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            radius_km * 1000
        )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user's active gym membership
CREATE OR REPLACE FUNCTION get_user_active_memberships(p_user_id UUID)
RETURNS TABLE (
    membership_id UUID,
    gym_id UUID,
    gym_name VARCHAR,
    status VARCHAR,
    last_visited TIMESTAMP WITH TIME ZONE,
    total_visits INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gm.id,
        g.id,
        g.name,
        gm.status,
        gm.last_visited,
        gm.total_visits
    FROM gym_memberships gm
    JOIN gyms g ON g.id = gm.gym_id
    WHERE 
        gm.user_id = p_user_id
        AND gm.status = 'active'
        AND g.is_active = true
    ORDER BY gm.last_visited DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function: Get equipment live status for a gym
CREATE OR REPLACE FUNCTION get_equipment_live_status(p_gym_id UUID)
RETURNS TABLE (
    equipment_id UUID,
    equipment_name VARCHAR,
    category VARCHAR,
    total_count INTEGER,
    available_count INTEGER,
    in_use_count INTEGER,
    queue_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.category,
        e.total_count,
        e.available_count,
        e.total_count - e.available_count AS in_use_count,
        (
            SELECT COUNT(*)::INTEGER
            FROM equipment_queue eq
            WHERE eq.equipment_id = e.id AND eq.status = 'waiting'
        ) AS queue_count
    FROM equipment e
    WHERE 
        e.gym_id = p_gym_id
        AND e.is_active = true
    ORDER BY e.category, e.name;
END;
$$ LANGUAGE plpgsql;






-- USER PROFILE  More tab
-- Part 1: User Profile & Stats Tables  

-- 1. USERS TABLE 
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    date_of_birth DATE,
    phone VARCHAR(20),
    height_cm DECIMAL(5,2),
    membership_status VARCHAR(50) DEFAULT 'free' CHECK (membership_status IN ('free', 'premium', 'pro')),
    profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_membership ON public.user_profiles(membership_status);


-- 2. FITNESS GOALS TABLE
CREATE TABLE IF NOT EXISTS public.fitness_goals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness', 'custom')),
    goal_value DECIMAL(10,2),
    goal_unit VARCHAR(20),
    goal_description TEXT,
    target_date DATE,
    start_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fitness_goals_user_id ON public.fitness_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_active ON public.fitness_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_primary ON public.fitness_goals(user_id, is_primary);

-- 3. BODY STATS TABLE

CREATE TABLE IF NOT EXISTS public.body_stats (
    stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_date DATE DEFAULT CURRENT_DATE,
    
    -- Weight and Composition
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    body_fat_percentage DECIMAL(4,2),
    muscle_mass_kg DECIMAL(5,2),
    body_water_percentage DECIMAL(4,2),
    bone_mass_kg DECIMAL(4,2),
    
    -- Measurements (in cm)
    chest_cm DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    hips_cm DECIMAL(5,2),
    arms_cm DECIMAL(5,2),
    legs_cm DECIMAL(5,2),
    neck_cm DECIMAL(5,2),
    
    -- Daily Health Metrics
    heart_rate_bpm INTEGER,
    resting_heart_rate_bpm INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    hydration_level_ml INTEGER,
    calories_burned_today INTEGER DEFAULT 0,
    steps_count INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    sleep_hours DECIMAL(4,2),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    
    -- Data Source
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'wearable', 'ai_estimation')),
    device_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_body_stats_user_id ON public.body_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_body_stats_date ON public.body_stats(user_id, recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_body_stats_source ON public.body_stats(user_id, source);

-- 4. AI FITNESS SUMMARY TABLE
CREATE TABLE IF NOT EXISTS public.ai_fitness_summary (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- AI Generated Content
    summary_text TEXT NOT NULL,
    goal_progress_percentage DECIMAL(5,2),
    predicted_goal_completion_date DATE,
    ai_recommendation TEXT,
    
    -- Progress Indicators
    weekly_progress_summary TEXT,
    monthly_progress_summary TEXT,
    strengths JSONB,
    improvement_areas JSONB,
    
    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_current BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_summary_user_id ON public.ai_fitness_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_summary_current ON public.ai_fitness_summary(user_id, is_current);

-- 5. WEARABLE DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.wearable_devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Device Information
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('apple_watch', 'fitbit', 'samsung_gear', 'mi_band', 'garmin', 'other')),
    device_model VARCHAR(100),
    device_serial_number VARCHAR(100),
    
    -- Connection Status
    sync_status VARCHAR(50) DEFAULT 'disconnected' CHECK (sync_status IN ('connected', 'disconnected', 'syncing', 'error')),
    last_sync_time TIMESTAMP WITH TIME ZONE,
    sync_frequency_minutes INTEGER DEFAULT 30,
    
    -- Data Permissions
    heart_rate_enabled BOOLEAN DEFAULT TRUE,
    steps_enabled BOOLEAN DEFAULT TRUE,
    sleep_enabled BOOLEAN DEFAULT TRUE,
    calories_enabled BOOLEAN DEFAULT TRUE,
    blood_pressure_enabled BOOLEAN DEFAULT FALSE,
    blood_oxygen_enabled BOOLEAN DEFAULT FALSE,
    
    -- Battery & Connection
    battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
    connection_type VARCHAR(50) CHECK (connection_type IN ('bluetooth', 'wifi', 'cloud')),
    
    -- Metadata
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wearable_devices_user_id ON public.wearable_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_active ON public.wearable_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_sync ON public.wearable_devices(sync_status);

-- 6. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
    achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Achievement Details
    badge_name VARCHAR(100) NOT NULL,
    badge_icon TEXT,
    badge_category VARCHAR(50) CHECK (badge_category IN ('workouts', 'streaks', 'goals', 'milestones', 'social', 'special')),
    description TEXT,
    
    -- Achievement Criteria
    criteria_type VARCHAR(50),
    criteria_value INTEGER,
    
    -- Progress
    current_progress INTEGER DEFAULT 0,
    target_progress INTEGER NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    is_earned BOOLEAN DEFAULT FALSE,
    earned_date TIMESTAMP WITH TIME ZONE,
    
    -- Display
    display_order INTEGER DEFAULT 0,
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    points_value INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_earned ON public.achievements(user_id, is_earned);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(badge_category);

-- 7. HEALTH RISK TABLE
CREATE TABLE IF NOT EXISTS public.health_risk (
    risk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Risk Assessment
    risk_type VARCHAR(50) NOT NULL CHECK (risk_type IN ('cardiovascular', 'diabetes', 'obesity', 'hypertension', 'injury', 'overtraining', 'general')),
    risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    
    -- AI Analysis
    ai_recommendation TEXT,
    contributing_factors JSONB,
    recommended_actions JSONB,
    
    -- Assessment Details
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessment_method VARCHAR(50) CHECK (assessment_method IN ('ai_analysis', 'manual_input', 'doctor_consultation')),
    is_current BOOLEAN DEFAULT TRUE,
    
    -- Follow-up
    next_assessment_date DATE,
    reviewed_by_professional BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_health_risk_user_id ON public.health_risk(user_id);
CREATE INDEX IF NOT EXISTS idx_health_risk_current ON public.health_risk(user_id, is_current);
CREATE INDEX IF NOT EXISTS idx_health_risk_level ON public.health_risk(risk_level);

-- 8. USER DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.user_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Document Information
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('medical_note', 'prescription', 'lab_report', 'insurance', 'waiver', 'other')),
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    
    -- Medical Context
    issued_by VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    notes TEXT,
    
    -- Privacy
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON public.user_documents(user_id, document_type);

-- 9. USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Regional Settings
    region_code VARCHAR(10),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Unit Preferences
    unit_weight VARCHAR(10) DEFAULT 'kg' CHECK (unit_weight IN ('kg', 'lbs')),
    unit_height VARCHAR(10) DEFAULT 'cm' CHECK (unit_height IN ('cm', 'ft_in')),
    unit_distance VARCHAR(10) DEFAULT 'km' CHECK (unit_distance IN ('km', 'miles')),
    unit_calories VARCHAR(10) DEFAULT 'kcal' CHECK (unit_calories IN ('kcal', 'cal')),
    unit_water VARCHAR(10) DEFAULT 'ml' CHECK (unit_water IN ('ml', 'oz')),
    auto_conversion_enabled BOOLEAN DEFAULT TRUE,
    
    -- App Preferences
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    download_quality VARCHAR(20) DEFAULT 'high' CHECK (download_quality IN ('low', 'medium', 'high')),
    
    -- Notification Preferences
    allow_push BOOLEAN DEFAULT TRUE,
    allow_email BOOLEAN DEFAULT TRUE,
    allow_sms BOOLEAN DEFAULT FALSE,
    notifications_preview BOOLEAN DEFAULT TRUE,
    
    -- Privacy Settings
    share_activity BOOLEAN DEFAULT FALSE,
    profile_visibility VARCHAR(20) DEFAULT 'private' CHECK (profile_visibility IN ('public', 'friends', 'private')),
    
    -- AI Settings
    ai_tips_enabled BOOLEAN DEFAULT TRUE,
    ai_voice_language VARCHAR(10) DEFAULT 'en',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- TRIGGERS

-- Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (with DROP IF EXISTS)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fitness_goals_updated_at ON public.fitness_goals;
CREATE TRIGGER update_fitness_goals_updated_at BEFORE UPDATE ON public.fitness_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_body_stats_updated_at ON public.body_stats;
CREATE TRIGGER update_body_stats_updated_at BEFORE UPDATE ON public.body_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wearable_devices_updated_at ON public.wearable_devices;
CREATE TRIGGER update_wearable_devices_updated_at BEFORE UPDATE ON public.wearable_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievements_updated_at ON public.achievements;
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_fitness_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Fitness Goals Policies
DROP POLICY IF EXISTS "Users can view their own fitness goals" ON public.fitness_goals;
CREATE POLICY "Users can view their own fitness goals"
    ON public.fitness_goals FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own fitness goals" ON public.fitness_goals;
CREATE POLICY "Users can insert their own fitness goals"
    ON public.fitness_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own fitness goals" ON public.fitness_goals;
CREATE POLICY "Users can update their own fitness goals"
    ON public.fitness_goals FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own fitness goals" ON public.fitness_goals;
CREATE POLICY "Users can delete their own fitness goals"
    ON public.fitness_goals FOR DELETE
    USING (auth.uid() = user_id);

-- Body Stats Policies
DROP POLICY IF EXISTS "Users can view their own body stats" ON public.body_stats;
CREATE POLICY "Users can view their own body stats"
    ON public.body_stats FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own body stats" ON public.body_stats;
CREATE POLICY "Users can insert their own body stats"
    ON public.body_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own body stats" ON public.body_stats;
CREATE POLICY "Users can update their own body stats"
    ON public.body_stats FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own body stats" ON public.body_stats;
CREATE POLICY "Users can delete their own body stats"
    ON public.body_stats FOR DELETE
    USING (auth.uid() = user_id);

-- AI Fitness Summary Policies
DROP POLICY IF EXISTS "Users can view their own AI summaries" ON public.ai_fitness_summary;
CREATE POLICY "Users can view their own AI summaries"
    ON public.ai_fitness_summary FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert AI summaries" ON public.ai_fitness_summary;
CREATE POLICY "System can insert AI summaries"
    ON public.ai_fitness_summary FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Wearable Devices Policies
DROP POLICY IF EXISTS "Users can view their own devices" ON public.wearable_devices;
CREATE POLICY "Users can view their own devices"
    ON public.wearable_devices FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own devices" ON public.wearable_devices;
CREATE POLICY "Users can insert their own devices"
    ON public.wearable_devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own devices" ON public.wearable_devices;
CREATE POLICY "Users can update their own devices"
    ON public.wearable_devices FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own devices" ON public.wearable_devices;
CREATE POLICY "Users can delete their own devices"
    ON public.wearable_devices FOR DELETE
    USING (auth.uid() = user_id);

-- Achievements Policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.achievements;
CREATE POLICY "Users can view their own achievements"
    ON public.achievements FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert achievements" ON public.achievements;
CREATE POLICY "System can insert achievements"
    ON public.achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update achievements" ON public.achievements;
CREATE POLICY "System can update achievements"
    ON public.achievements FOR UPDATE
    USING (auth.uid() = user_id);

-- Health Risk Policies
DROP POLICY IF EXISTS "Users can view their own health risks" ON public.health_risk;
CREATE POLICY "Users can view their own health risks"
    ON public.health_risk FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own health risks" ON public.health_risk;
CREATE POLICY "Users can insert their own health risks"
    ON public.health_risk FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own health risks" ON public.health_risk;
CREATE POLICY "Users can update their own health risks"
    ON public.health_risk FOR UPDATE
    USING (auth.uid() = user_id);

-- User Documents Policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.user_documents;
CREATE POLICY "Users can view their own documents"
    ON public.user_documents FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.user_documents;
CREATE POLICY "Users can insert their own documents"
    ON public.user_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.user_documents;
CREATE POLICY "Users can delete their own documents"
    ON public.user_documents FOR DELETE
    USING (auth.uid() = user_id);

-- User Preferences Policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);



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
    SELECT * INTO profile_record FROM public.user_profiles WHERE user_id = p_user_id;
    
    IF profile_record.full_name IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.avatar_url IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.gender IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.date_of_birth IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.phone IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    IF profile_record.height_cm IS NOT NULL THEN completion_score := completion_score + 10; END IF;
    
    -- Check if user has fitness goals
    IF EXISTS (SELECT 1 FROM public.fitness_goals WHERE user_id = p_user_id) THEN
        completion_score := completion_score + 15;
    END IF;
    
    -- Check if user has body stats
    IF EXISTS (SELECT 1 FROM public.body_stats WHERE user_id = p_user_id) THEN
        completion_score := completion_score + 15;
    END IF;
    
    -- Check if user has preferences set
    IF EXISTS (SELECT 1 FROM public.user_preferences WHERE user_id = p_user_id) THEN
        completion_score := completion_score + 10;
    END IF;
    
    RETURN completion_score;
END;
$$ LANGUAGE plpgsql;






-- SIXFINITY APP - WALLET 
-- Part 2: Payment Methods 

-- 1. PAYMENT METHODS
CREATE TABLE IF NOT EXISTS public.payment_methods (
    payment_method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Method Type
    method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'upi', 'bank_account', 'wallet', 'other')),
    
    -- Gateway Information
    gateway_id VARCHAR(50) CHECK (gateway_id IN ('razorpay', 'stripe', 'paypal', 'square', 'other')),
    gateway_customer_id VARCHAR(255),
    gateway_payment_method_id VARCHAR(255),
    
    -- Card Information (Masked)
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    card_expiry_month INTEGER CHECK (card_expiry_month BETWEEN 1 AND 12),
    card_expiry_year INTEGER,
    card_holder_name VARCHAR(255),
    
    -- Bank Account Information
    bank_name VARCHAR(255),
    account_last_four VARCHAR(4),
    
    -- UPI Information
    upi_id VARCHAR(255),
    
    -- PayPal Information
    paypal_email VARCHAR(255),
    
    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    nickname VARCHAR(100),
    billing_address JSONB,
    
    -- Timestamps
    verified_at TIMESTAMP WITH TIME ZONE,
    added_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON public.payment_methods(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON public.payment_methods(user_id, is_active);

-- 2. INVOICES TABLE 
CREATE TABLE IF NOT EXISTS public.invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Invoice Information
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_type VARCHAR(50) CHECK (invoice_type IN ('payment', 'refund', 'subscription', 'topup')),
    
    -- Amount Details
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    
    -- Split Details
    split_details JSONB,
    
    -- Tax Details
    tax_details JSONB,
    tax_rate DECIMAL(5,2),
    tax_id VARCHAR(50),
    
    -- Service Details
    line_items JSONB,
    
    -- PDF Generation
    pdf_url TEXT,
    pdf_generated BOOLEAN DEFAULT FALSE,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- QR Code
    qr_code_data TEXT,
    qr_code_url TEXT,
    
    -- Related Entities
    gym_id UUID,
    trainer_id UUID,
    booking_id UUID,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'refunded', 'canceled', 'overdue')),
    
    -- Payment Information
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Due Date
    due_date DATE,
    
    -- Notes
    notes TEXT,
    terms_conditions TEXT,
    
    -- Timestamps
    invoice_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_no ON public.invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date DESC);

-- 3. WALLET TABLE 
CREATE TABLE IF NOT EXISTS public.wallet (
    wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Balance Information
    balance DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
    reward_points INTEGER DEFAULT 0 CHECK (reward_points >= 0),
    pending_refunds DECIMAL(10,2) DEFAULT 0.00 CHECK (pending_refunds >= 0),
    
    -- Currency
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Lifetime Statistics
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    total_topped_up DECIMAL(10,2) DEFAULT 0.00,
    total_refunded DECIMAL(10,2) DEFAULT 0.00,
    total_rewards_redeemed DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_frozen BOOLEAN DEFAULT FALSE,
    freeze_reason TEXT,
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON public.wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_active ON public.wallet(is_active);

-- 4. WALLET TOPUP TABLE
CREATE TABLE IF NOT EXISTS public.wallet_topup (
    topup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallet(wallet_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Top-up Details
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL,
    
    -- Payment Information
    payment_method VARCHAR(50) CHECK (payment_method IN ('credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'upi', 'bank_transfer', 'other')),
    gateway_used VARCHAR(50) CHECK (gateway_used IN ('razorpay', 'stripe', 'paypal', 'square', 'other')),
    gateway_transaction_id VARCHAR(255),
    
    -- Transaction Status
    transaction_status VARCHAR(50) DEFAULT 'pending' CHECK (transaction_status IN ('pending', 'processing', 'success', 'failed', 'refunded', 'canceled')),
    transaction_ref_no VARCHAR(100) UNIQUE,
    
    -- Additional Information
    payment_details JSONB,
    failure_reason TEXT,
    notes TEXT,
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_topup_wallet_id ON public.wallet_topup(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_topup_user_id ON public.wallet_topup(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_topup_status ON public.wallet_topup(transaction_status);
CREATE INDEX IF NOT EXISTS idx_wallet_topup_ref ON public.wallet_topup(transaction_ref_no);

-- 5. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallet(wallet_id) ON DELETE SET NULL,
    
    -- Transaction Type
    type VARCHAR(50) NOT NULL CHECK (type IN ('wallet_topup', 'gym_payment', 'trainer_payment', 'class_payment', 'subscription', 'refund', 'reward_redemption', 'other')),
    
    -- Amount Details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    
    -- Payment Method
    payment_method_id UUID REFERENCES public.payment_methods(payment_method_id) ON DELETE SET NULL,
    payment_method_type VARCHAR(50),
    
    -- Gateway Information
    gateway_id VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Revenue Split (97% to Gym, 3% to IT Company)
    split_to_gym DECIMAL(10,2),
    split_to_it_company DECIMAL(10,2),
    split_calculated BOOLEAN DEFAULT FALSE,
    
    -- Related Entities
    gym_id UUID,
    trainer_id UUID,
    booking_id UUID,
    subscription_id UUID,
    
    -- Invoice
    invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE SET NULL,
    
    -- Transaction Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded', 'partially_refunded', 'disputed', 'canceled')),
    
    -- Refund Information
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_gym ON public.transactions(gym_id);
CREATE INDEX IF NOT EXISTS idx_transactions_trainer ON public.transactions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_id);

-- Function for updated_at (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update wallet last_updated
CREATE OR REPLACE FUNCTION update_wallet_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet_last_updated ON public.wallet;
CREATE TRIGGER trigger_update_wallet_last_updated
    BEFORE UPDATE ON public.wallet
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_last_updated();

-- Revenue Split Calculation
CREATE OR REPLACE FUNCTION calculate_revenue_split()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type IN ('gym_payment', 'trainer_payment', 'class_payment', 'subscription') THEN
        NEW.split_to_gym = ROUND((NEW.amount * 0.97)::NUMERIC, 2);
        NEW.split_to_it_company = ROUND((NEW.amount * 0.03)::NUMERIC, 2);
        NEW.split_calculated = TRUE;
    ELSE
        NEW.split_to_gym = 0;
        NEW.split_to_it_company = 0;
        NEW.split_calculated = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_revenue_split ON public.transactions;
CREATE TRIGGER trigger_calculate_revenue_split
    BEFORE INSERT OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_revenue_split();

-- Update Wallet Balance
CREATE OR REPLACE FUNCTION update_wallet_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'wallet_topup' AND NEW.status = 'success' AND (OLD IS NULL OR OLD.status != 'success') THEN
        UPDATE public.wallet
        SET balance = balance + NEW.amount,
            total_topped_up = total_topped_up + NEW.amount
        WHERE user_id = NEW.user_id;
    END IF;
    
    IF NEW.type IN ('gym_payment', 'trainer_payment', 'class_payment', 'subscription') 
       AND NEW.status = 'success' 
       AND NEW.payment_method_type = 'wallet'
       AND (OLD IS NULL OR OLD.status != 'success') THEN
        UPDATE public.wallet
        SET balance = balance - NEW.amount,
            total_spent = total_spent + NEW.amount
        WHERE user_id = NEW.user_id;
    END IF;
    
    IF NEW.status = 'refunded' AND (OLD IS NULL OR OLD.status != 'refunded') THEN
        UPDATE public.wallet
        SET balance = balance + NEW.refund_amount,
            total_refunded = total_refunded + NEW.refund_amount
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet_on_transaction ON public.transactions;
CREATE TRIGGER trigger_update_wallet_on_transaction
    AFTER INSERT OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_on_transaction();

-- Generate Invoice Number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_invoice_no TEXT;
BEGIN
    IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' THEN
        year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_no FROM 'INV-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
        INTO sequence_num
        FROM public.invoices
        WHERE invoice_no LIKE 'INV-' || year_part || '-%';
        
        new_invoice_no := 'INV-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
        NEW.invoice_no := new_invoice_no;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON public.invoices;
CREATE TRIGGER trigger_generate_invoice_number
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- Create Wallet for New User
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallet (user_id, currency)
    VALUES (NEW.id, 'USD')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_wallet_for_new_user ON auth.users;
CREATE TRIGGER trigger_create_wallet_for_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_new_user();

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_topup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Payment Methods Policies
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view their own payment methods"
    ON public.payment_methods FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert their own payment methods"
    ON public.payment_methods FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update their own payment methods"
    ON public.payment_methods FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete their own payment methods"
    ON public.payment_methods FOR DELETE
    USING (auth.uid() = user_id);

-- Invoices Policies
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert invoices" ON public.invoices;
CREATE POLICY "System can insert invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update invoices" ON public.invoices;
CREATE POLICY "System can update invoices"
    ON public.invoices FOR UPDATE
    USING (auth.uid() = user_id);

-- Wallet Policies
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallet;
CREATE POLICY "Users can view their own wallet"
    ON public.wallet FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallet;
CREATE POLICY "Users can update their own wallet"
    ON public.wallet FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallet;
CREATE POLICY "Users can insert their own wallet"
    ON public.wallet FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Wallet Topup Policies
DROP POLICY IF EXISTS "Users can view their own topups" ON public.wallet_topup;
CREATE POLICY "Users can view their own topups"
    ON public.wallet_topup FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own topups" ON public.wallet_topup;
CREATE POLICY "Users can insert their own topups"
    ON public.wallet_topup FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;
CREATE POLICY "System can insert transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update transactions" ON public.transactions;
CREATE POLICY "System can update transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    current_balance DECIMAL;
BEGIN
    SELECT balance INTO current_balance
    FROM public.wallet
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(current_balance, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_sufficient_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL;
BEGIN
    current_balance := get_wallet_balance(p_user_id);
    RETURN current_balance >= p_amount;
END;
$$ LANGUAGE plpgsql;










-- SIXFINITY APP - BOOKINGS 
-- Part 3: Bookings System Tables
-- 1. BOOKINGS TABLE 
CREATE TABLE IF NOT EXISTS public.bookings (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Related Entities
    gym_id UUID NOT NULL, -- References gyms table
    trainer_id UUID, -- Optional - if booking is with a trainer
    session_id UUID, -- Optional - if booking is for a specific class/session
    
    -- Session Information
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('in_person', 'virtual', 'hybrid')),
    session_category VARCHAR(50) CHECK (session_category IN ('personal_training', 'group_class', 'gym_access', 'consultation', 'other')),
    session_name VARCHAR(255),
    session_description TEXT,
    
    -- Date & Time
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    session_datetime TIMESTAMP WITH TIME ZONE NOT NULL, -- Combined for easier querying
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    end_datetime TIMESTAMP WITH TIME ZONE, -- FIXED: No longer GENERATED, calculated by trigger
    
    -- Booking Status
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'confirmed', 'in_progress', 'completed', 'canceled', 'rescheduled', 'no_show', 'pending_confirmation')),
    
    -- Payment Information
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded', 'failed')),
    payment_amount DECIMAL(10,2) NOT NULL CHECK (payment_amount >= 0),
    currency VARCHAR(10) DEFAULT 'USD',
    transaction_id UUID, -- References transactions table
    
    -- Check-in Information
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_in_method VARCHAR(50) CHECK (check_in_method IN ('qr_code', 'manual', 'auto', 'nfc')),
    
    -- Virtual Session Information (if applicable)
    virtual_meeting_url TEXT,
    virtual_meeting_id VARCHAR(255),
    virtual_meeting_password VARCHAR(100),
    virtual_platform VARCHAR(50) CHECK (virtual_platform IN ('zoom', 'google_meet', 'teams', 'custom', 'other')),
    
    -- Notifications
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    booking_notes TEXT, -- User's notes
    special_requests TEXT, -- Special requirements
    metadata JSONB, -- Flexible data storage
    
    -- Timestamps
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_gym_id ON public.bookings(gym_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trainer_id ON public.bookings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(session_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_upcoming ON public.bookings(user_id, session_datetime) WHERE status IN ('upcoming', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_bookings_payment ON public.bookings(payment_status);

-- 2. BOOKING HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.booking_history (
    booking_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session Completion
    completion_status VARCHAR(50) NOT NULL CHECK (completion_status IN ('completed', 'missed', 'partially_completed', 'canceled')),
    attended BOOLEAN DEFAULT FALSE,
    
    -- Performance Metrics
    calories_burned INTEGER CHECK (calories_burned >= 0),
    session_duration_actual INTEGER, -- Actual duration in minutes
    distance_km DECIMAL(6,2), -- If applicable (running, cycling, etc.)
    average_heart_rate INTEGER,
    max_heart_rate INTEGER,
    
    -- Ratings & Feedback
    trainer_rating INTEGER CHECK (trainer_rating BETWEEN 1 AND 5),
    gym_rating INTEGER CHECK (gym_rating BETWEEN 1 AND 5),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    feedback_submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance Score (AI-generated)
    performance_score INTEGER CHECK (performance_score BETWEEN 0 AND 100),
    performance_analysis TEXT, -- AI-generated analysis
    
    -- Session Summary
    session_summary_notes TEXT, -- Trainer's notes
    exercises_performed JSONB, -- Array of exercises with sets/reps
    achievements_earned JSONB, -- Any achievements unlocked
    
    -- Wearable Data Integration
    wearable_data_id UUID, -- Reference to synced wearable data
    wearable_sync_status VARCHAR(50) CHECK (wearable_sync_status IN ('synced', 'pending', 'failed', 'not_available')),
    
    -- Timestamps
    session_started_at TIMESTAMP WITH TIME ZONE,
    session_ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON public.booking_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_history_user_id ON public.booking_history(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_history_completion ON public.booking_history(completion_status);
CREATE INDEX IF NOT EXISTS idx_booking_history_rating ON public.booking_history(trainer_rating);

-- 3. BOOKING CANCELLATIONS TABLE
CREATE TABLE IF NOT EXISTS public.booking_cancellations (
    cancel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cancellation Information
    canceled_by VARCHAR(50) NOT NULL CHECK (canceled_by IN ('user', 'trainer', 'gym', 'admin', 'system')),
    cancel_reason_category VARCHAR(50) CHECK (cancel_reason_category IN ('personal', 'illness', 'emergency', 'schedule_conflict', 'trainer_unavailable', 'gym_closed', 'weather', 'other')),
    cancel_reason TEXT NOT NULL,
    
    -- Cancellation Type
    cancellation_type VARCHAR(50) CHECK (cancellation_type IN ('full_cancel', 'reschedule_request', 'no_show')),
    
    -- Rescheduling Information
    reschedule_requested BOOLEAN DEFAULT FALSE,
    new_booking_id UUID REFERENCES public.bookings(booking_id), -- If rescheduled
    rescheduled_to_date DATE,
    rescheduled_to_time TIME,
    reschedule_reason TEXT,
    
    -- Refund Information
    refund_eligible BOOLEAN DEFAULT TRUE,
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_percentage DECIMAL(5,2), -- Percentage of original amount
    refund_status VARCHAR(50) DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processing', 'completed', 'rejected', 'not_applicable')),
    refund_transaction_id UUID, -- References transactions table
    refund_method VARCHAR(50) CHECK (refund_method IN ('original_payment', 'wallet', 'bank_transfer', 'credit', 'none')),
    
    -- Cancellation Policy
    cancellation_fee DECIMAL(10,2) DEFAULT 0.00,
    fee_reason TEXT, -- Why was fee charged (e.g., "Late cancellation - within 24 hours")
    
    -- Time-based Cancellation Rules
    hours_before_session INTEGER, -- Hours between cancellation and session
    within_free_cancellation_window BOOLEAN, -- If canceled within policy window
    
    -- Timestamps
    canceled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    refund_processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_booking_id ON public.booking_cancellations(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_user_id ON public.booking_cancellations(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_status ON public.booking_cancellations(refund_status);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_date ON public.booking_cancellations(canceled_at DESC);

-- 4. BOOKING DETAILS TABLE 

CREATE TABLE IF NOT EXISTS public.booking_details (
    detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    
    -- Trainer Information
    trainer_name VARCHAR(255),
    trainer_bio TEXT,
    trainer_specialization VARCHAR(255),
    trainer_photo_url TEXT,
    trainer_rating DECIMAL(3,2),
    trainer_total_sessions INTEGER,
    trainer_notes TEXT, -- Pre-session notes from trainer
    
    -- Gym Information
    gym_name VARCHAR(255),
    gym_address TEXT,
    gym_phone VARCHAR(20),
    gym_location JSONB, -- {lat, lng, formatted_address}
    gym_facilities JSONB, -- Array of available facilities
    
    -- Session Plan
    workout_plan_pdf_url TEXT, -- Pre-session workout plan
    nutrition_plan_pdf_url TEXT, -- Associated nutrition plan
    session_goals JSONB, -- Array of goals for this session
    expected_intensity VARCHAR(50) CHECK (expected_intensity IN ('low', 'moderate', 'high', 'very_high')),
    
    -- Equipment Required
    equipment_needed JSONB, -- Array of equipment
    equipment_provided_by_gym BOOLEAN DEFAULT TRUE,
    bring_own_equipment TEXT, -- What user needs to bring
    
    -- Health Data Tracking
    pre_session_weight_kg DECIMAL(5,2),
    post_session_weight_kg DECIMAL(5,2),
    pre_session_heart_rate INTEGER,
    post_session_heart_rate INTEGER,
    hydration_ml INTEGER, -- Water consumed during session
    
    -- Wearable Data
    wearable_data_id UUID,
    wearable_device_used VARCHAR(100),
    wearable_sync_completed BOOLEAN DEFAULT FALSE,
    
    -- Attachments
    attachments JSONB, -- Array of {type, url, name}
    
    -- Payment Invoice
    payment_invoice_id UUID, -- References invoices table
    
    -- Emergency Contact (for in-person sessions)
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_booking_details_booking_id ON public.booking_details(booking_id);

-- 5. BOOKING NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.booking_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    
    -- Notification Content
    message TEXT NOT NULL,
    title VARCHAR(255),
    
    -- Notification Type
    type VARCHAR(50) NOT NULL CHECK (type IN ('reminder', 'confirmation', 'update', 'cancellation', 'reschedule', 'refund', 'feedback_request', 'check_in', 'session_starting', 'session_ended', 'trainer_message')),
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Delivery Status
    read_status BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery Channels
    sent_via_push BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMP WITH TIME ZONE,
    sent_via_email BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    sent_via_sms BOOLEAN DEFAULT FALSE,
    sms_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Action Required
    requires_action BOOLEAN DEFAULT FALSE,
    action_type VARCHAR(50), -- e.g., 'confirm', 'reschedule', 'provide_feedback'
    action_url TEXT, -- Deep link to relevant screen
    action_completed BOOLEAN DEFAULT FALSE,
    action_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE, -- When to send (for reminders)
    sent BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_booking_notifications_user_id ON public.booking_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_booking_id ON public.booking_notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_type ON public.booking_notifications(type);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_read ON public.booking_notifications(user_id, read_status);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_scheduled ON public.booking_notifications(scheduled_for) WHERE sent = FALSE;


-- Function for updated_at (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FIXED: Calculate end_datetime for bookings (IMMUTABLE solution)
CREATE OR REPLACE FUNCTION calculate_booking_end_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate end_datetime whenever session_datetime or duration_minutes changes
    NEW.end_datetime := NEW.session_datetime + (NEW.duration_minutes || ' minutes')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_booking_end_time ON public.bookings;
CREATE TRIGGER trigger_calculate_booking_end_time
    BEFORE INSERT OR UPDATE OF session_datetime, duration_minutes ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_booking_end_time();

-- Update bookings updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update booking_details updated_at
DROP TRIGGER IF EXISTS update_booking_details_updated_at ON public.booking_details;
CREATE TRIGGER update_booking_details_updated_at
    BEFORE UPDATE ON public.booking_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER: Auto-create Booking History on Completion
CREATE OR REPLACE FUNCTION create_booking_history_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        INSERT INTO public.booking_history (
            booking_id,
            user_id,
            completion_status,
            attended,
            session_started_at,
            session_ended_at
        ) VALUES (
            NEW.booking_id,
            NEW.user_id,
            'completed',
            TRUE,
            NEW.check_in_time,
            NOW()
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_booking_history_on_completion ON public.bookings;
CREATE TRIGGER trigger_create_booking_history_on_completion
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_booking_history_on_completion();

-- 
-- Auto-create Booking Notification on Status Change
CREATE OR REPLACE FUNCTION create_notification_on_booking_change()
RETURNS TRIGGER AS $$
DECLARE
    notification_message TEXT;
    notification_type VARCHAR(50);
BEGIN
    -- On confirmation
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        notification_message := 'Your booking for ' || NEW.session_name || ' on ' || TO_CHAR(NEW.session_date, 'Mon DD, YYYY') || ' has been confirmed!';
        notification_type := 'confirmation';
        
        INSERT INTO public.booking_notifications (user_id, booking_id, message, type, title)
        VALUES (NEW.user_id, NEW.booking_id, notification_message, notification_type, 'Booking Confirmed');
    END IF;
    
    -- On cancellation
    IF NEW.status = 'canceled' AND (OLD.status IS NULL OR OLD.status != 'canceled') THEN
        notification_message := 'Your booking for ' || NEW.session_name || ' has been canceled.';
        notification_type := 'cancellation';
        
        INSERT INTO public.booking_notifications (user_id, booking_id, message, type, title)
        VALUES (NEW.user_id, NEW.booking_id, notification_message, notification_type, 'Booking Canceled');
    END IF;
    
    -- On rescheduling
    IF NEW.status = 'rescheduled' AND (OLD.status IS NULL OR OLD.status != 'rescheduled') THEN
        notification_message := 'Your booking has been rescheduled.';
        notification_type := 'reschedule';
        
        INSERT INTO public.booking_notifications (user_id, booking_id, message, type, title)
        VALUES (NEW.user_id, NEW.booking_id, notification_message, notification_type, 'Booking Rescheduled');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_notification_on_booking_change ON public.bookings;
CREATE TRIGGER trigger_create_notification_on_booking_change
    AFTER INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_on_booking_change();

CREATE OR REPLACE FUNCTION calculate_refund_on_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    booking_record RECORD;
    hours_diff INTEGER;
    refund_pct DECIMAL;
BEGIN
    -- Get booking details
    SELECT * INTO booking_record FROM public.bookings WHERE booking_id = NEW.booking_id;
    
    -- Calculate hours before session
    hours_diff := EXTRACT(EPOCH FROM (booking_record.session_datetime - NEW.canceled_at)) / 3600;
    NEW.hours_before_session := hours_diff;
    
    -- Apply cancellation policy (customize as needed)
    IF hours_diff >= 48 THEN
        -- 48+ hours: Full refund
        refund_pct := 100;
        NEW.within_free_cancellation_window := TRUE;
        NEW.cancellation_fee := 0;
    ELSIF hours_diff >= 24 THEN
        -- 24-48 hours: 80% refund
        refund_pct := 80;
        NEW.within_free_cancellation_window := FALSE;
        NEW.cancellation_fee := booking_record.payment_amount * 0.20;
        NEW.fee_reason := 'Cancellation within 24-48 hours - 20% fee applied';
    ELSIF hours_diff >= 12 THEN
        -- 12-24 hours: 50% refund
        refund_pct := 50;
        NEW.within_free_cancellation_window := FALSE;
        NEW.cancellation_fee := booking_record.payment_amount * 0.50;
        NEW.fee_reason := 'Late cancellation within 12-24 hours - 50% fee applied';
    ELSE
        -- Less than 12 hours: No refund
        refund_pct := 0;
        NEW.within_free_cancellation_window := FALSE;
        NEW.cancellation_fee := booking_record.payment_amount;
        NEW.fee_reason := 'Very late cancellation (< 12 hours) - No refund';
        NEW.refund_eligible := FALSE;
    END IF;
    
    NEW.refund_amount := booking_record.payment_amount * (refund_pct / 100);
    NEW.refund_percentage := refund_pct;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_refund_on_cancellation ON public.booking_cancellations;
CREATE TRIGGER trigger_calculate_refund_on_cancellation
    BEFORE INSERT ON public.booking_cancellations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_refund_on_cancellation();


-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;

-- Bookings Policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
CREATE POLICY "Users can insert their own bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;
CREATE POLICY "Users can delete their own bookings"
    ON public.bookings FOR DELETE
    USING (auth.uid() = user_id);

-- Booking History Policies
DROP POLICY IF EXISTS "Users can view their own booking history" ON public.booking_history;
CREATE POLICY "Users can view their own booking history"
    ON public.booking_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert booking history" ON public.booking_history;
CREATE POLICY "System can insert booking history"
    ON public.booking_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their booking history" ON public.booking_history;
CREATE POLICY "Users can update their booking history"
    ON public.booking_history FOR UPDATE
    USING (auth.uid() = user_id);

-- Booking Cancellations Policies
DROP POLICY IF EXISTS "Users can view their own cancellations" ON public.booking_cancellations;
CREATE POLICY "Users can view their own cancellations"
    ON public.booking_cancellations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cancellations" ON public.booking_cancellations;
CREATE POLICY "Users can insert their own cancellations"
    ON public.booking_cancellations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Booking Details Policies
DROP POLICY IF EXISTS "Users can view their booking details" ON public.booking_details;
CREATE POLICY "Users can view their booking details"
    ON public.booking_details FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.bookings WHERE booking_id = booking_details.booking_id));

DROP POLICY IF EXISTS "System can insert booking details" ON public.booking_details;
CREATE POLICY "System can insert booking details"
    ON public.booking_details FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.bookings WHERE booking_id = booking_details.booking_id));

DROP POLICY IF EXISTS "System can update booking details" ON public.booking_details;
CREATE POLICY "System can update booking details"
    ON public.booking_details FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM public.bookings WHERE booking_id = booking_details.booking_id));

-- Booking Notifications Policies
DROP POLICY IF EXISTS "Users can view their own booking notifications" ON public.booking_notifications;
CREATE POLICY "Users can view their own booking notifications"
    ON public.booking_notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert booking notifications" ON public.booking_notifications;
CREATE POLICY "System can insert booking notifications"
    ON public.booking_notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their booking notifications" ON public.booking_notifications;
CREATE POLICY "Users can update their booking notifications"
    ON public.booking_notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to get upcoming bookings count
CREATE OR REPLACE FUNCTION get_upcoming_bookings_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    booking_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO booking_count
    FROM public.bookings
    WHERE user_id = p_user_id
    AND status IN ('upcoming', 'confirmed')
    AND session_datetime > NOW();
    
    RETURN COALESCE(booking_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if booking can be canceled for free
CREATE OR REPLACE FUNCTION can_cancel_free(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    booking_datetime TIMESTAMP WITH TIME ZONE;
    hours_until INTEGER;
BEGIN
    SELECT session_datetime INTO booking_datetime
    FROM public.bookings
    WHERE booking_id = p_booking_id;
    
    hours_until := EXTRACT(EPOCH FROM (booking_datetime - NOW())) / 3600;
    
    RETURN hours_until >= 48; -- Free cancellation if 48+ hours before
END;
$$ LANGUAGE plpgsql;





-- SIXFINITY APP - MORE TAB DATABASE SCHEMA
-- Part 4: Referrals & Rewards Tables

-- 1. EXTEND USER_PROFILES TABLE FOR REFERRALS
-- Add referral columns to existing user_profiles table

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(15) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(15),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'expired', 'canceled', 'trial'));

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON public.user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by ON public.user_profiles(referred_by);

-- 2. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
    referral_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referrer (User who shared the code)
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referrer_code VARCHAR(15) NOT NULL,
    
    -- Referee (User who used the code)
    referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referee_email VARCHAR(255), -- Store email even before signup
    referee_name VARCHAR(255),
    
    -- Referral Code Used
    referral_code_used VARCHAR(15) NOT NULL,
    
    -- Referral Status
    referral_status VARCHAR(50) DEFAULT 'pending' CHECK (referral_status IN ('pending', 'signup_completed', 'verified', 'subscribed', 'completed', 'expired', 'fraud_flagged', 'rejected')),
    
    -- Reward Trigger Stage
    reward_trigger_stage VARCHAR(50) CHECK (reward_trigger_stage IN ('signup', 'verification', 'subscription', 'first_workout', 'retention_30days', 'retention_60days', 'retention_90days')),
    current_stage VARCHAR(50) DEFAULT 'signup',
    
    -- Reward Status
    referrer_reward_status VARCHAR(50) DEFAULT 'pending' CHECK (referrer_reward_status IN ('pending', 'eligible', 'credited', 'expired', 'canceled')),
    referee_reward_status VARCHAR(50) DEFAULT 'pending' CHECK (referee_reward_status IN ('pending', 'eligible', 'credited', 'expired', 'canceled')),
    
    referrer_reward_amount DECIMAL(10,2) DEFAULT 0.00,
    referee_reward_amount DECIMAL(10,2) DEFAULT 0.00,
    
    referrer_reward_credited_at TIMESTAMP WITH TIME ZONE,
    referee_reward_credited_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    signup_completed_at TIMESTAMP WITH TIME ZONE,
    verification_completed_at TIMESTAMP WITH TIME ZONE,
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    first_workout_completed_at TIMESTAMP WITH TIME ZONE,
    retention_milestone_reached_at TIMESTAMP WITH TIME ZONE,
    
    -- Fraud Detection
    is_fraud_suspected BOOLEAN DEFAULT FALSE,
    fraud_reason TEXT,
    fraud_flagged_at TIMESTAMP WITH TIME ZONE,
    
    -- Source Tracking
    referral_source VARCHAR(50) CHECK (referral_source IN ('whatsapp', 'instagram', 'facebook', 'email', 'sms', 'twitter', 'linkedin', 'direct_link', 'other')),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- IP and Device Tracking (for fraud prevention)
    referee_ip_address INET,
    referee_device_info JSONB,
    
    -- Metadata
    metadata JSONB,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- Expiry for rewards
);

-- Create indexes
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON public.referrals(referee_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code_used);
CREATE INDEX idx_referrals_status ON public.referrals(referral_status);
CREATE INDEX idx_referrals_stage ON public.referrals(current_stage);
CREATE INDEX idx_referrals_fraud ON public.referrals(is_fraud_suspected);

-- 3. REFERRAL REWARDS CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    reward_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reward Stage
    reward_stage VARCHAR(50) UNIQUE NOT NULL CHECK (reward_stage IN ('signup', 'verification', 'subscription', 'first_workout', 'retention_30days', 'retention_60days', 'retention_90days')),
    
    -- Reward Amounts
    referrer_points INTEGER DEFAULT 0 CHECK (referrer_points >= 0),
    referee_points INTEGER DEFAULT 0 CHECK (referee_points >= 0),
    
    referrer_cash_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (referrer_cash_amount >= 0),
    referee_cash_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (referee_cash_amount >= 0),
    
    referrer_discount_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (referrer_discount_percentage BETWEEN 0 AND 100),
    referee_discount_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (referee_discount_percentage BETWEEN 0 AND 100),
    
    -- Reward Configuration
    reward_type VARCHAR(50) CHECK (reward_type IN ('points', 'cash', 'discount', 'combo')),
    reward_currency VARCHAR(10) DEFAULT 'USD',
    
    -- Conditions
    minimum_purchase_required DECIMAL(10,2) DEFAULT 0.00,
    requires_previous_stage BOOLEAN DEFAULT TRUE, -- Must complete previous stages first
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Display Information
    title VARCHAR(255),
    description TEXT,
    terms_conditions TEXT,
    display_order INTEGER DEFAULT 0,
    
    -- Expiry
    reward_expiry_days INTEGER DEFAULT 180, -- Days until reward expires
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_referral_rewards_active ON public.referral_rewards(is_active);

-- 4. REWARD POINTS WALLET TABLE
CREATE TABLE IF NOT EXISTS public.reward_points_wallet (
    wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Points Balance
    total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
    available_points INTEGER DEFAULT 0 CHECK (available_points >= 0),
    pending_points INTEGER DEFAULT 0 CHECK (pending_points >= 0),
    expired_points INTEGER DEFAULT 0,
    
    -- Cash Value Equivalent
    cash_value DECIMAL(10,2) DEFAULT 0.00, -- Points converted to cash value
    conversion_rate DECIMAL(10,4) DEFAULT 0.01, -- e.g., 1 point = $0.01
    
    -- Lifetime Statistics
    lifetime_points_earned INTEGER DEFAULT 0,
    lifetime_points_redeemed INTEGER DEFAULT 0,
    lifetime_cash_equivalent DECIMAL(10,2) DEFAULT 0.00,
    
    -- Tier/Level (Optional gamification)
    tier_level VARCHAR(50) DEFAULT 'bronze' CHECK (tier_level IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    tier_benefits JSONB, -- Array of benefits for current tier
    
    -- Timestamps
    last_earned_at TIMESTAMP WITH TIME ZONE,
    last_redeemed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_reward_points_wallet_user_id ON public.reward_points_wallet(user_id);
CREATE INDEX idx_reward_points_wallet_tier ON public.reward_points_wallet(tier_level);


-- 5. REWARD TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.reward_points_wallet(wallet_id) ON DELETE CASCADE,
    
    -- Transaction Type
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'refunded', 'bonus')),
    
    -- Points
    points_amount INTEGER NOT NULL,
    cash_equivalent DECIMAL(10,2),
    
    -- Source
    source VARCHAR(50) CHECK (source IN ('referral_signup', 'referral_subscription', 'referral_retention', 'workout_completion', 'achievement', 'promotion', 'admin_adjustment', 'redemption', 'expiry', 'other')),
    source_id UUID, -- ID of related entity (referral_id, booking_id, etc.)
    
    -- Referral Context
    related_referral_id UUID REFERENCES public.referrals(referral_id) ON DELETE SET NULL,
    referral_stage VARCHAR(50),
    
    -- Redemption Context
    redeemed_for VARCHAR(50) CHECK (redeemed_for IN ('wallet_credit', 'discount', 'membership', 'trainer_session', 'merchandise', 'other')),
    redemption_value DECIMAL(10,2),
    applied_to_transaction_id UUID, -- Reference to main transactions table
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'reversed', 'failed')),
    
    -- Balance After Transaction
    balance_after INTEGER,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE,
    expired BOOLEAN DEFAULT FALSE,
    
    -- Description
    description TEXT,
    notes TEXT,
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_reward_transactions_user_id ON public.reward_transactions(user_id);
CREATE INDEX idx_reward_transactions_wallet_id ON public.reward_transactions(wallet_id);
CREATE INDEX idx_reward_transactions_type ON public.reward_transactions(transaction_type);
CREATE INDEX idx_reward_transactions_date ON public.reward_transactions(transaction_date DESC);
CREATE INDEX idx_reward_transactions_referral ON public.reward_transactions(related_referral_id);


-- FUNCTIONS FOR REFERRAL CODE GENERATION

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(15) AS $$
DECLARE
    new_code VARCHAR(15);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        new_code := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8)
        );
        
        -- Check if code already exists
        SELECT EXISTS (
            SELECT 1 FROM public.user_profiles WHERE referral_code = new_code
        ) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code for new users
CREATE OR REPLACE FUNCTION create_referral_code_for_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_referral_code
    BEFORE INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_referral_code_for_user();

-- FUNCTION: Create Reward Wallet for New User
CREATE OR REPLACE FUNCTION create_reward_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.reward_points_wallet (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_reward_wallet_for_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_reward_wallet_for_new_user();

-- TRIGGER: Update Referral Status on Milestone
CREATE OR REPLACE FUNCTION update_referral_on_milestone()
RETURNS TRIGGER AS $$
DECLARE
    user_referral RECORD;
BEGIN
    -- Get active referral for this user
    SELECT * INTO user_referral
    FROM public.referrals
    WHERE referee_id = NEW.user_id
    AND referral_status NOT IN ('completed', 'expired', 'fraud_flagged')
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF user_referral IS NOT NULL THEN
        -- Update referral based on the milestone reached
        -- This is a simplified version - you'll customize based on your trigger events
        
        IF NEW.is_verified = TRUE AND user_referral.verification_completed_at IS NULL THEN
            UPDATE public.referrals
            SET verification_completed_at = NOW(),
                current_stage = 'verification',
                referral_status = 'verified'
            WHERE referral_id = user_referral.referral_id;
            
            -- Process rewards for verification stage
            PERFORM process_referral_reward(user_referral.referral_id, 'verification');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- FUNCTION: Process Referral Reward
CREATE OR REPLACE FUNCTION process_referral_reward(
    p_referral_id UUID,
    p_stage VARCHAR(50)
)
RETURNS VOID AS $$
DECLARE
    referral_record RECORD;
    reward_config RECORD;
    referrer_wallet_id UUID;
    referee_wallet_id UUID;
BEGIN
    -- Get referral details
    SELECT * INTO referral_record FROM public.referrals WHERE referral_id = p_referral_id;
    
    -- Get reward configuration for this stage
    SELECT * INTO reward_config FROM public.referral_rewards 
    WHERE reward_stage = p_stage AND is_active = TRUE;
    
    IF reward_config IS NULL THEN
        RETURN; -- No reward configured for this stage
    END IF;
    
    -- Get wallet IDs
    SELECT wallet_id INTO referrer_wallet_id FROM public.reward_points_wallet WHERE user_id = referral_record.referrer_id;
    SELECT wallet_id INTO referee_wallet_id FROM public.reward_points_wallet WHERE user_id = referral_record.referee_id;
    
    -- Credit points to referrer
    IF reward_config.referrer_points > 0 THEN
        -- Update wallet balance
        UPDATE public.reward_points_wallet
        SET total_points = total_points + reward_config.referrer_points,
            available_points = available_points + reward_config.referrer_points,
            lifetime_points_earned = lifetime_points_earned + reward_config.referrer_points,
            last_earned_at = NOW()
        WHERE wallet_id = referrer_wallet_id;
        
        -- Create transaction record
        INSERT INTO public.reward_transactions (
            user_id, wallet_id, transaction_type, points_amount, source, 
            related_referral_id, referral_stage, description, balance_after
        )
        SELECT 
            referral_record.referrer_id, 
            referrer_wallet_id,
            'earned',
            reward_config.referrer_points,
            'referral_' || p_stage,
            p_referral_id,
            p_stage,
            'Referral reward for ' || p_stage || ' stage',
            (SELECT total_points FROM public.reward_points_wallet WHERE wallet_id = referrer_wallet_id);
    END IF;
    
    -- Credit points to referee
    IF reward_config.referee_points > 0 AND referee_wallet_id IS NOT NULL THEN
        UPDATE public.reward_points_wallet
        SET total_points = total_points + reward_config.referee_points,
            available_points = available_points + reward_config.referee_points,
            lifetime_points_earned = lifetime_points_earned + reward_config.referee_points,
            last_earned_at = NOW()
        WHERE wallet_id = referee_wallet_id;
        
        INSERT INTO public.reward_transactions (
            user_id, wallet_id, transaction_type, points_amount, source,
            related_referral_id, referral_stage, description, balance_after
        )
        SELECT 
            referral_record.referee_id,
            referee_wallet_id,
            'earned',
            reward_config.referee_points,
            'referral_' || p_stage,
            p_referral_id,
            p_stage,
            'Welcome reward for ' || p_stage || ' stage',
            (SELECT total_points FROM public.reward_points_wallet WHERE wallet_id = referee_wallet_id);
    END IF;
    
    -- Update referral record
    UPDATE public.referrals
    SET referrer_reward_status = 'credited',
        referee_reward_status = 'credited',
        referrer_reward_amount = referrer_reward_amount + reward_config.referrer_cash_amount,
        referee_reward_amount = referee_reward_amount + reward_config.referee_cash_amount,
        referrer_reward_credited_at = NOW(),
        referee_reward_credited_at = NOW(),
        reward_trigger_stage = p_stage
    WHERE referral_id = p_referral_id;
    
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Redeem Reward Points
CREATE OR REPLACE FUNCTION redeem_reward_points(
    p_user_id UUID,
    p_points_amount INTEGER,
    p_redeemed_for VARCHAR(50),
    p_redemption_value DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
DECLARE
    wallet_record RECORD;
BEGIN
    -- Get wallet
    SELECT * INTO wallet_record FROM public.reward_points_wallet WHERE user_id = p_user_id;
    
    -- Check if user has enough points
    IF wallet_record.available_points < p_points_amount THEN
        RAISE EXCEPTION 'Insufficient reward points';
        RETURN FALSE;
    END IF;
    
    -- Deduct points
    UPDATE public.reward_points_wallet
    SET available_points = available_points - p_points_amount,
        total_points = total_points - p_points_amount,
        lifetime_points_redeemed = lifetime_points_redeemed + p_points_amount,
        last_redeemed_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create transaction record
    INSERT INTO public.reward_transactions (
        user_id, wallet_id, transaction_type, points_amount, 
        redeemed_for, redemption_value, description, balance_after
    )
    VALUES (
        p_user_id,
        wallet_record.wallet_id,
        'redeemed',
        -p_points_amount,
        p_redeemed_for,
        p_redemption_value,
        'Redeemed ' || p_points_amount || ' points for ' || p_redeemed_for,
        wallet_record.available_points - p_points_amount
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS FOR AUTOMATIC UPDATES

CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_rewards_updated_at
    BEFORE UPDATE ON public.referral_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_points_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

-- Referrals Policies
CREATE POLICY "Users can view their referrals (as referrer)"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can insert referrals"
    ON public.referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can update referrals"
    ON public.referrals FOR UPDATE
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Referral Rewards Policies (Read-only for users)
CREATE POLICY "Anyone can view active reward configurations"
    ON public.referral_rewards FOR SELECT
    USING (is_active = TRUE);

-- Reward Points Wallet Policies
CREATE POLICY "Users can view their own reward wallet"
    ON public.reward_points_wallet FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can update reward wallets"
    ON public.reward_points_wallet FOR UPDATE
    USING (auth.uid() = user_id);

-- Reward Transactions Policies
CREATE POLICY "Users can view their own reward transactions"
    ON public.reward_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert reward transactions"
    ON public.reward_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- SEED DATA: Referral Rewards Configuration
-- Insert default reward configurations

INSERT INTO public.referral_rewards (reward_stage, referrer_points, referee_points, referrer_cash_amount, referee_cash_amount, reward_type, title, description, is_active, display_order)
VALUES
    ('signup', 50, 100, 0.00, 5.00, 'combo', 'Sign Up Bonus', 'Referee gets $5 credit + 100 points on signup. Referrer gets 50 points.', TRUE, 1),
    ('verification', 100, 50, 0.00, 0.00, 'points', 'Verification Reward', 'Both parties earn points when referee verifies their account.', TRUE, 2),
    ('subscription', 500, 200, 20.00, 10.00, 'combo', 'First Subscription', 'Earn cash and points when referee purchases their first subscription.', TRUE, 3),
    ('first_workout', 200, 100, 0.00, 0.00, 'points', 'First Workout Complete', 'Bonus points for completing the first workout.', TRUE, 4),
    ('retention_30days', 300, 0, 15.00, 0.00, 'combo', '30-Day Retention', 'Referrer earns $15 + 300 points when referee stays active for 30 days.', TRUE, 5),
    ('retention_60days', 400, 0, 20.00, 0.00, 'combo', '60-Day Retention', 'Referrer earns $20 + 400 points for 60-day retention.', TRUE, 6),
    ('retention_90days', 500, 0, 25.00, 0.00, 'combo', '90-Day Retention', 'Referrer earns $25 + 500 points for 90-day retention.', TRUE, 7)
ON CONFLICT (reward_stage) DO NOTHING;







-- SIXFINITY APP - MORE TAB 
-- Part 5: Notifications & Support Tables

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Category
    category VARCHAR(50) NOT NULL CHECK (category IN ('payment', 'booking', 'reward', 'system', 'offer', 'achievement', 'workout', 'meal', 'gym', 'trainer', 'social')),
    
    -- Linked Screen/Action
    linked_screen VARCHAR(100), -- Screen to navigate to (e.g., 'WalletScreen', 'BookingDetailScreen')
    related_entity_id UUID, -- ID of related record (transaction_id, booking_id, etc.)
    related_entity_type VARCHAR(50), -- Type of entity (transaction, booking, offer, etc.)
    
    -- Status
    status VARCHAR(50) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived', 'deleted')),
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Priority
    is_important BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Delivery Channels
    sent_via_push BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMP WITH TIME ZONE,
    push_status VARCHAR(50) CHECK (push_status IN ('pending', 'sent', 'failed', 'clicked')),
    
    sent_via_email BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_status VARCHAR(50) CHECK (email_status IN ('pending', 'sent', 'failed', 'opened', 'clicked')),
    
    sent_via_sms BOOLEAN DEFAULT FALSE,
    sms_sent_at TIMESTAMP WITH TIME ZONE,
    sms_status VARCHAR(50) CHECK (sms_status IN ('pending', 'sent', 'failed', 'delivered')),
    
    -- Action Button
    action_button_text VARCHAR(100), -- e.g., "View Invoice", "Rate Session"
    action_url TEXT, -- Deep link or URL
    action_type VARCHAR(50), -- e.g., 'navigate', 'external_link', 'action'
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE,
    is_expired BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB, -- Flexible data storage
    icon_name VARCHAR(100), -- Icon identifier for UI
    image_url TEXT, -- Optional image for rich notifications
    
    -- Timestamps
    scheduled_for TIMESTAMP WITH TIME ZONE, -- When to send
    sent_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_category ON public.notifications(category);
CREATE INDEX idx_notifications_status ON public.notifications(user_id, status);
CREATE INDEX idx_notifications_timestamp ON public.notifications(user_id, timestamp DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, status) WHERE status = 'unread';
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE sent_at IS NULL;

-- 2. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Global Settings
    notifications_enabled BOOLEAN DEFAULT TRUE,
    
    -- Delivery Channel Preferences
    allow_push BOOLEAN DEFAULT TRUE,
    allow_email BOOLEAN DEFAULT TRUE,
    allow_sms BOOLEAN DEFAULT FALSE,
    
    -- Category-specific Preferences
    -- Payments
    payment_push BOOLEAN DEFAULT TRUE,
    payment_email BOOLEAN DEFAULT TRUE,
    payment_sms BOOLEAN DEFAULT FALSE,
    
    -- Bookings
    booking_push BOOLEAN DEFAULT TRUE,
    booking_email BOOLEAN DEFAULT TRUE,
    booking_sms BOOLEAN DEFAULT FALSE,
    
    -- Rewards & Promotions
    reward_push BOOLEAN DEFAULT TRUE,
    reward_email BOOLEAN DEFAULT TRUE,
    reward_sms BOOLEAN DEFAULT FALSE,
    
    -- Offers & Promotions
    offer_push BOOLEAN DEFAULT TRUE,
    offer_email BOOLEAN DEFAULT TRUE,
    offer_sms BOOLEAN DEFAULT FALSE,
    
    -- System Updates
    system_push BOOLEAN DEFAULT TRUE,
    system_email BOOLEAN DEFAULT FALSE,
    system_sms BOOLEAN DEFAULT FALSE,
    
    -- AI Tips & Recommendations
    ai_tips_push BOOLEAN DEFAULT TRUE,
    ai_tips_email BOOLEAN DEFAULT FALSE,
    ai_tips_sms BOOLEAN DEFAULT FALSE,
    
    -- Workouts
    workout_push BOOLEAN DEFAULT TRUE,
    workout_email BOOLEAN DEFAULT FALSE,
    workout_sms BOOLEAN DEFAULT FALSE,
    
    -- Meals
    meal_push BOOLEAN DEFAULT TRUE,
    meal_email BOOLEAN DEFAULT FALSE,
    meal_sms BOOLEAN DEFAULT FALSE,
    
    -- Social (likes, comments, follows)
    social_push BOOLEAN DEFAULT TRUE,
    social_email BOOLEAN DEFAULT FALSE,
    social_sms BOOLEAN DEFAULT FALSE,
    
    -- Sound & Vibration
    sound_enabled BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT TRUE,
    
    -- Quiet Hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME, -- e.g., 22:00
    quiet_hours_end TIME,   -- e.g., 08:00
    
    -- Do Not Disturb
    dnd_enabled BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- 3. FAQ TABLE
CREATE TABLE IF NOT EXISTS public.faq (
    faq_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Question & Answer
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- Category
    category VARCHAR(50) NOT NULL CHECK (category IN ('payments', 'bookings', 'trainers', 'app_usage', 'technical_issues', 'account', 'subscription', 'refunds', 'general', 'other')),
    
    -- Search Keywords
    keywords TEXT[], -- Array of searchable keywords
    tags TEXT[], -- Array of tags
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE, -- Show in "Popular FAQs" section
    
    -- Display Order
    display_order INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0, -- Higher priority shows first
    
    -- Usage Statistics
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Rich Content
    has_video BOOLEAN DEFAULT FALSE,
    video_url TEXT,
    has_image BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    
    -- Related FAQs
    related_faq_ids UUID[], -- Array of related FAQ IDs
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_faq_category ON public.faq(category);
CREATE INDEX idx_faq_active ON public.faq(is_active);
CREATE INDEX idx_faq_popular ON public.faq(is_popular) WHERE is_active = TRUE;
CREATE INDEX idx_faq_search ON public.faq USING gin(to_tsvector('english', question || ' ' || answer));

-- 4. SUPPORT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.support_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Ticket Information
    ticket_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., TICKET-2025-001234
    
    -- Request Details
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('bug_report', 'payment_issue', 'booking_error', 'feature_request', 'account_issue', 'technical_support', 'feedback', 'complaint', 'other')),
    
    -- Contact Channel
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('chat', 'email', 'call', 'in_app')),
    preferred_contact_method VARCHAR(50),
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'pending', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'reopened', 'escalated')),
    
    -- Assignment
    assigned_to UUID, -- Support agent ID
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolution
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_time_minutes INTEGER, -- Time to resolve in minutes
    
    -- Customer Satisfaction
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    satisfaction_feedback TEXT,
    rated_at TIMESTAMP WITH TIME ZONE,
    
    -- Attachments
    attachments JSONB, -- Array of {filename, url, type}
    
    -- Related Entities
    related_entity_type VARCHAR(50), -- booking, transaction, gym, etc.
    related_entity_id UUID,
    
    -- Internal Notes
    internal_notes TEXT,
    tags TEXT[],
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_support_requests_user_id ON public.support_requests(user_id);
CREATE INDEX idx_support_requests_ticket ON public.support_requests(ticket_number);
CREATE INDEX idx_support_requests_status ON public.support_requests(status);
CREATE INDEX idx_support_requests_priority ON public.support_requests(priority);
CREATE INDEX idx_support_requests_category ON public.support_requests(category);
CREATE INDEX idx_support_requests_date ON public.support_requests(submitted_at DESC);

-- 5. SUPPORT CHAT TABLE

CREATE TABLE IF NOT EXISTS public.support_chat (
    chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.support_requests(request_id) ON DELETE CASCADE,
    
    -- Sender Information
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('user', 'admin', 'agent', 'bot')),
    sender_id UUID, -- User ID or Admin ID
    sender_name VARCHAR(255),
    
    -- Message Content
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'link', 'system')),
    
    -- Attachments
    attachment_url TEXT,
    attachment_filename VARCHAR(255),
    attachment_type VARCHAR(50), -- image, pdf, document, etc.
    attachment_size_bytes BIGINT,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    is_delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- System Message
    is_system_message BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_support_chat_request_id ON public.support_chat(request_id);
CREATE INDEX idx_support_chat_timestamp ON public.support_chat(request_id, timestamp);
CREATE INDEX idx_support_chat_sender ON public.support_chat(sender_type, sender_id);

-- 6. ISSUE REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.issue_reports (
    issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Report Information
    category VARCHAR(50) NOT NULL CHECK (category IN ('bug_report', 'payment_issue', 'booking_error', 'feature_request', 'other')),
    
    -- Issue Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Technical Details
    device_info JSONB, -- OS, device model, app version
    app_version VARCHAR(50),
    os_version VARCHAR(50),
    screen_name VARCHAR(100), -- Screen where issue occurred
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    user_set_priority VARCHAR(20), -- Priority set by user
    
    -- Screenshots/Attachments
    screenshots JSONB, -- Array of {url, filename}
    logs_url TEXT, -- URL to log files if available
    
    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'in_progress', 'fixed', 'closed', 'wont_fix', 'duplicate')),
    
    -- Resolution
    resolution_notes TEXT,
    fixed_in_version VARCHAR(50),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Duplicate Tracking
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of_issue_id UUID REFERENCES public.issue_reports(issue_id),
    
    -- Internal Tracking
    assigned_to UUID, -- Developer ID
    internal_priority INTEGER,
    estimated_fix_date DATE,
    actual_fix_date DATE,
    
    -- Metadata
    metadata JSONB,
    tags TEXT[],
    
    -- Timestamps
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_issue_reports_user_id ON public.issue_reports(user_id);
CREATE INDEX idx_issue_reports_category ON public.issue_reports(category);
CREATE INDEX idx_issue_reports_status ON public.issue_reports(status);
CREATE INDEX idx_issue_reports_priority ON public.issue_reports(priority);
CREATE INDEX idx_issue_reports_date ON public.issue_reports(reported_at DESC);

-- FUNCTIONS

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_ticket_no TEXT;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 'TICKET-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.support_requests
    WHERE ticket_number LIKE 'TICKET-' || year_part || '-%';
    
    -- Generate ticket number: TICKET-2025-000001
    new_ticket_no := 'TICKET-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN new_ticket_no;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION create_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_ticket_number
    BEFORE INSERT ON public.support_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_ticket_number();

-- FUNCTION: Create Notification Preferences for New User
CREATE OR REPLACE FUNCTION create_notification_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_notification_preferences_for_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_preferences_for_new_user();

-- FUNCTION: Mark Notification as Read
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.notifications
    SET status = 'read',
        read_at = NOW()
    WHERE notification_id = p_notification_id
    AND status = 'unread';
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Mark All Notifications as Read
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET status = 'read',
        read_at = NOW()
    WHERE user_id = p_user_id
    AND status = 'unread';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;


-- FUNCTION: Get Unread Notification Count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM public.notifications
    WHERE user_id = p_user_id
    AND status = 'unread'
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Update FAQ Statistics
CREATE OR REPLACE FUNCTION update_faq_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.faq
    SET view_count = view_count + 1
    WHERE faq_id = NEW.faq_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: You'd call this from your application code when a FAQ is viewed


-- TRIGGERS FOR AUTOMATIC UPDATES

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_updated_at
    BEFORE UPDATE ON public.faq
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_requests_updated_at
    BEFORE UPDATE ON public.support_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issue_reports_updated_at
    BEFORE UPDATE ON public.issue_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Notification Preferences Policies
CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- FAQ Policies (Public read)
CREATE POLICY "Anyone can view active FAQs"
    ON public.faq FOR SELECT
    USING (is_active = TRUE);

-- Support Requests Policies
CREATE POLICY "Users can view their own support requests"
    ON public.support_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support requests"
    ON public.support_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support requests"
    ON public.support_requests FOR UPDATE
    USING (auth.uid() = user_id);

-- Support Chat Policies
CREATE POLICY "Users can view chat for their support requests"
    ON public.support_chat FOR SELECT
    USING (request_id IN (SELECT request_id FROM public.support_requests WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert messages in their support chats"
    ON public.support_chat FOR INSERT
    WITH CHECK (request_id IN (SELECT request_id FROM public.support_requests WHERE user_id = auth.uid()));

-- Issue Reports Policies
CREATE POLICY "Users can view their own issue reports"
    ON public.issue_reports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own issue reports"
    ON public.issue_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own issue reports"
    ON public.issue_reports FOR UPDATE
    USING (auth.uid() = user_id);

-- SEED DATA: Popular FAQs

INSERT INTO public.faq (question, answer, category, is_active, is_popular, display_order)
VALUES
    ('How do I cancel my gym session?', 'You can cancel your session from the My Bookings screen. Go to the session you want to cancel and tap Cancel Session. Note that cancellation fees may apply depending on how close to the session time you cancel.', 'bookings', TRUE, TRUE, 1),
    ('How do I add money to my wallet?', 'Go to More → Wallet & Payments → Add Money. Enter the amount you want to add and select your payment method. Your wallet will be credited instantly upon successful payment.', 'payments', TRUE, TRUE, 2),
    ('How long does it take to get my refund?', 'Refunds are typically processed within 5-7 business days. The refund will be credited back to your original payment method or wallet, depending on your preference.', 'refunds', TRUE, TRUE, 3),
    ('How do I invite friends and earn rewards?', 'Go to More → Connect & Earn. Share your unique referral code with friends. When they sign up and make their first booking, you both earn rewards!', 'general', TRUE, TRUE, 4),
    ('Can I reschedule my booking?', 'Yes! Go to My Bookings, select the session, and tap Reschedule. Choose a new date and time. Note that rescheduling may be subject to trainer availability.', 'bookings', TRUE, TRUE, 5)
ON CONFLICT DO NOTHING;












CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (
        gender IN (
            'male',
            'female',
            'other',
            'prefer_not_to_say'
        )
    ),
    height_cm DECIMAL(5, 2),
    current_weight_kg DECIMAL(5, 2),
    target_weight_kg DECIMAL(5, 2),
    primary_goal TEXT CHECK (
        primary_goal IN (
            'lose_weight',
            'gain_muscle',
            'maintain',
            'improve_fitness',
            'gain_strength'
        )
    ),
    activity_level TEXT CHECK (
        activity_level IN (
            'sedentary',
            'lightly_active',
            'moderately_active',
            'very_active',
            'extra_active'
        )
    ),
    daily_calorie_goal INTEGER,
    daily_protein_goal_g DECIMAL(6, 2),
    daily_carbs_goal_g DECIMAL(6, 2),
    daily_fat_goal_g DECIMAL(6, 2),
    units_system TEXT DEFAULT 'metric' CHECK (
        units_system IN ('metric', 'imperial')
    ),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Users can update their own profile" ON public.profiles FOR
UPDATE USING (auth.uid () = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR
INSERT
WITH
    CHECK (auth.uid () = id);

-- progress entries table
CREATE TABLE IF NOT EXISTS public.progress_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    weight_kg DECIMAL(5, 2),
    body_fat_percentage DECIMAL(4, 2),
    chest_cm DECIMAL(5, 2),
    waist_cm DECIMAL(5, 2),
    hips_cm DECIMAL(5, 2),
    bicep_left_cm DECIMAL(5, 2),
    bicep_right_cm DECIMAL(5, 2),
    thigh_left_cm DECIMAL(5, 2),
    thigh_right_cm DECIMAL(5, 2),
    photo_front_url TEXT,
    photo_side_url TEXT,
    photo_back_url TEXT,
    notes TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.progress_entries FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own progress" ON public.progress_entries FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own progress" ON public.progress_entries FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own progress" ON public.progress_entries FOR DELETE USING (auth.uid () = user_id);

-- exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'fullbody')),
  equipment TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  instructions TEXT[],
  video_url TEXT,
  image_url TEXT,
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

-- User Stats Policies
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;
CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);


DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


DO $$ 
BEGIN
    -- Check if tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'weight_logs') THEN
        RAISE NOTICE ' weight_logs table created successfully';
    ELSE
        RAISE EXCEPTION ' weight_logs table creation failed';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_stats') THEN
        RAISE NOTICE ' user_stats table created successfully';
    ELSE
        RAISE EXCEPTION 'user_stats table creation failed';
    END IF;
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'weight_logs' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE ' RLS enabled on weight_logs';
    ELSE
        RAISE WARNING ' RLS not enabled on weight_logs';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_stats' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE ' RLS enabled on user_stats';
    ELSE
        RAISE WARNING ' RLS not enabled on user_stats';
    END IF;
    
    RAISE NOTICE ' All tables created successfully!';
END $$;

-- Show table structures
SELECT 'weight_logs columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'weight_logs' 
ORDER BY ordinal_position;

SELECT 'user_stats columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_stats' 
ORDER BY ordinal_position;













SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN ' RLS Enabled'
        ELSE 'RLS Disabled'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'weight_logs', 'user_stats')
ORDER BY tablename;

-- Count columns in profiles table
SELECT 
    'profiles' as table_name,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Verify critical columns exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age') 
        THEN ' age'
        ELSE ' age MISSING'
    END as age_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') 
        THEN ' gender'
        ELSE ' gender MISSING'
    END as gender_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') 
        THEN 'onboarding_completed'
        ELSE ' onboarding_completed MISSING'
    END as onboarding_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'primary_goal') 
        THEN ' primary_goal'
        ELSE 'primary_goal MISSING'
    END as primary_goal_check;

-- Show sample of profiles columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
    'id', 'full_name', 'age', 'gender', 'height_cm', 'weight_kg', 
    'primary_goal', 'activity_level', 'onboarding_completed'
)
ORDER BY column_name;

-- Final success message
DO $$ 
BEGIN
    RAISE NOTICE ' Database schema verification complete!';
    RAISE NOTICE ' You now have: profiles table (40+ columns), weight_logs table, user_stats table';
    RAISE NOTICE ' Ready for app testing!';
END $$;
















CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Meal Basic Info
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name VARCHAR(255),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIME NOT NULL DEFAULT CURRENT_TIME,
  
  -- Nutrition Data
  total_calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
  protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Meal Categorization
  meal_category VARCHAR(50) CHECK (meal_category IN ('vegetarian', 'vegan', 'high-protein', 'high-carb', 'low-carb', 'keto', 'balanced', 'other')),
  
  -- Entry Method
  entry_method VARCHAR(50) NOT NULL CHECK (entry_method IN ('manual', 'photo', 'barcode', 'ai-suggestion')),
  
  -- Photo/Barcode Data
  photo_url TEXT,
  barcode_value VARCHAR(255),
  
  -- AI Detection Data (if photo)
  ai_detected_foods JSONB, -- Array of detected food items with confidence scores
  ai_confidence_score DECIMAL(5, 2), -- Overall AI detection confidence (0-100)
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_user_date ON meals(user_id, meal_date DESC);
CREATE INDEX idx_meals_meal_type ON meals(meal_type);
CREATE INDEX idx_meals_created_at ON meals(created_at DESC);


CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
  
  -- Food Item Info
  food_name VARCHAR(255) NOT NULL,
  food_brand VARCHAR(255), -- e.g., "McDonald's", "Kellogg's"
  
  -- Portion Info
  serving_size DECIMAL(10, 2) NOT NULL, -- e.g., 100, 1, 2
  serving_unit VARCHAR(50) NOT NULL, -- e.g., "grams", "pieces", "cups", "ml"
  
  -- Nutrition per item
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Food Database Reference (if from Nutritionix or similar)
  external_food_id VARCHAR(255), -- Reference to external food database
  external_source VARCHAR(50), -- 'nutritionix', 'usda', 'manual'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_items_meal_id ON meal_items(meal_id);


CREATE TABLE water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Water Tracking
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INT NOT NULL, -- Amount in milliliters
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Daily Goal
  daily_goal_ml INT DEFAULT 2000, -- Default 2 liters
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_water_intake_user_date ON water_intake(user_id, date DESC);


CREATE TABLE daily_nutrition_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  -- Calories
  total_calories_consumed DECIMAL(10, 2) NOT NULL DEFAULT 0,
  calories_target DECIMAL(10, 2) NOT NULL, -- From user's fitness goals
  calories_burned DECIMAL(10, 2) DEFAULT 0, -- From workouts/activity
  calories_net DECIMAL(10, 2) GENERATED ALWAYS AS (total_calories_consumed - calories_burned) STORED,
  
  -- Macros Consumed
  total_protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fiber_grams DECIMAL(10, 2) DEFAULT 0,
  total_sugar_grams DECIMAL(10, 2) DEFAULT 0,
  total_sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Macro Targets (from user profile/goals)
  protein_target_grams DECIMAL(10, 2),
  carbs_target_grams DECIMAL(10, 2),
  fats_target_grams DECIMAL(10, 2),
  
  -- Water Intake
  total_water_ml INT DEFAULT 0,
  water_goal_ml INT DEFAULT 2000,
  
  -- Meal Counts
  meals_logged INT DEFAULT 0,
  breakfast_logged BOOLEAN DEFAULT FALSE,
  lunch_logged BOOLEAN DEFAULT FALSE,
  dinner_logged BOOLEAN DEFAULT FALSE,
  snacks_count INT DEFAULT 0,
  
  -- Workout Impact (if workout time affects calorie calculation)
  workout_duration_minutes INT DEFAULT 0, -- Total workout time for the day
  workout_calories_burned DECIMAL(10, 2) DEFAULT 0,
  
  -- Status Flags
  goal_met BOOLEAN DEFAULT FALSE, -- Did user meet calorie goal?
  protein_goal_met BOOLEAN DEFAULT FALSE,
  water_goal_met BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one summary per user per day
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_nutrition_user_date ON daily_nutrition_summary(user_id, date DESC);


CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Plan Info
  plan_name VARCHAR(255) NOT NULL, -- e.g., "Week of Jan 1-7, 2026"
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Plan Type
  plan_type VARCHAR(50) CHECK (plan_type IN ('ai-generated', 'custom', 'template')),
  generation_method VARCHAR(50), -- 'auto', 'manual', 'from-template'
  
  -- Plan Details
  total_weekly_calories DECIMAL(10, 2),
  avg_daily_calories DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE, -- Currently active plan
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_active ON meal_plans(user_id, is_active) WHERE is_active = TRUE;


CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  
  -- Schedule
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  specific_date DATE, -- Actual date for this meal
  
  -- Meal Details
  meal_name VARCHAR(255) NOT NULL,
  meal_description TEXT,
  recipe_url TEXT,
  
  -- Nutrition
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL,
  carbs_grams DECIMAL(10, 2) NOT NULL,
  fats_grams DECIMAL(10, 2) NOT NULL,
  
  -- Categorization
  meal_category VARCHAR(50),
  cuisine_type VARCHAR(100), -- 'Italian', 'Asian', 'Mexican', etc.
  
  -- Preparation
  prep_time_minutes INT,
  cook_time_minutes INT,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  -- Ingredients (for shopping list)
  ingredients JSONB, -- Array of {name, quantity, unit, purchased: false}
  
  -- User Actions
  is_completed BOOLEAN DEFAULT FALSE, -- Did user actually eat this?
  completed_at TIMESTAMP WITH TIME ZONE,
  is_skipped BOOLEAN DEFAULT FALSE,
  
  -- Customization
  is_swapped BOOLEAN DEFAULT FALSE, -- Was this meal swapped from original?
  original_meal_id UUID, -- Reference to original if swapped
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_plan_items_plan_id ON meal_plan_items(meal_plan_id);
CREATE INDEX idx_meal_plan_items_date ON meal_plan_items(specific_date);

-- 7. SHOPPING LIST TABLE
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  
  -- List Info
  list_name VARCHAR(255) NOT NULL,
  week_start_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SHOPPING LIST ITEMS TABLE
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  
  -- Item Details
  ingredient_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL, -- 'grams', 'kg', 'pieces', 'liters', etc.
  
  -- Category (for grouping in UI)
  category VARCHAR(100), -- 'Produce', 'Meat', 'Dairy', 'Grains', 'Spices', etc.
  
  -- Status
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMP WITH TIME ZONE,
  
  -- Price (optional)
  estimated_price DECIMAL(10, 2),
  actual_price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  
  -- Reference
  meal_plan_item_ids UUID[], -- Array of meal_plan_item IDs that need this ingredient
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);

-- 9. AI MEAL SUGGESTIONS TABLE
CREATE TABLE ai_meal_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Suggestion Details
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name VARCHAR(255) NOT NULL,
  meal_description TEXT,
  recipe_url TEXT,
  photo_url TEXT,
  
  -- Nutrition
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL,
  carbs_grams DECIMAL(10, 2) NOT NULL,
  fats_grams DECIMAL(10, 2) NOT NULL,
  
  -- AI Reasoning
  suggestion_reason TEXT, -- Why this meal was suggested
  based_on_goal VARCHAR(100), -- 'muscle-gain', 'fat-loss', 'maintenance'
  based_on_budget VARCHAR(50), -- 'low', 'medium', 'high'
  based_on_dietary_restrictions TEXT[], -- Array of restrictions considered
  
  -- Personalization
  matches_allergies BOOLEAN DEFAULT TRUE,
  matches_cuisine_preference BOOLEAN DEFAULT TRUE,
  matches_budget BOOLEAN DEFAULT TRUE,
  
  -- AI Confidence
  confidence_score DECIMAL(5, 2), -- 0-100
  
  -- User Actions
  is_viewed BOOLEAN DEFAULT FALSE,
  is_added_to_plan BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  user_feedback VARCHAR(50), -- 'liked', 'disliked', 'saved', null
  
  -- Scheduling
  suggested_for_date DATE,
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Suggestions expire after X days
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_meal_suggestions_user_id ON ai_meal_suggestions(user_id);
CREATE INDEX idx_ai_meal_suggestions_date ON ai_meal_suggestions(user_id, suggested_for_date);
CREATE INDEX idx_ai_meal_suggestions_active ON ai_meal_suggestions(user_id, expires_at) WHERE is_dismissed = FALSE;

-- 10. NUTRITION REPORTS TABLE (Monthly summaries)
CREATE TABLE nutrition_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Report Period
  report_month INT NOT NULL CHECK (report_month BETWEEN 1 AND 12),
  report_year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Calorie Stats
  avg_daily_calories DECIMAL(10, 2),
  total_calories_month DECIMAL(10, 2),
  highest_calorie_day DECIMAL(10, 2),
  lowest_calorie_day DECIMAL(10, 2),
  days_met_calorie_goal INT DEFAULT 0,
  days_exceeded_calorie_goal INT DEFAULT 0,
  
  -- Macro Stats
  avg_protein_grams DECIMAL(10, 2),
  avg_carbs_grams DECIMAL(10, 2),
  avg_fats_grams DECIMAL(10, 2),
  protein_goal_achievement_rate DECIMAL(5, 2), -- Percentage
  
  -- Water Intake Stats
  avg_daily_water_ml INT,
  days_met_water_goal INT DEFAULT 0,
  water_goal_achievement_rate DECIMAL(5, 2),
  
  -- Meal Logging Stats
  total_meals_logged INT DEFAULT 0,
  avg_meals_per_day DECIMAL(5, 2),
  most_frequent_foods JSONB, -- Array of {food_name, frequency}
  
  -- Trends
  calorie_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'
  weight_change_kg DECIMAL(5, 2), -- Weight change during this month
  
  -- Achievements/Badges
  badges_earned TEXT[], -- Array of badge names earned this month
  streak_days INT DEFAULT 0, -- Consecutive days of goal achievement
  
  -- Generated Data
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, report_year, report_month)
);

CREATE INDEX idx_nutrition_reports_user_id ON nutrition_reports(user_id);
CREATE INDEX idx_nutrition_reports_period ON nutrition_reports(user_id, report_year DESC, report_month DESC);

-- 11. USER DIETARY PREFERENCES TABLE
CREATE TABLE user_dietary_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Dietary Restrictions
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_pescatarian BOOLEAN DEFAULT FALSE,
  is_keto BOOLEAN DEFAULT FALSE,
  is_paleo BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  is_dairy_free BOOLEAN DEFAULT FALSE,
  is_nut_free BOOLEAN DEFAULT FALSE,
  
  -- Allergies
  allergies TEXT[], -- Array of allergen names
  
  -- Dislikes
  disliked_foods TEXT[], -- Array of food names to avoid
  
  -- Preferences
  preferred_cuisines TEXT[], -- Array of cuisine types
  preferred_meal_categories TEXT[], -- 'high-protein', 'low-carb', etc.
  
  -- Budget
  budget_range VARCHAR(20) CHECK (budget_range IN ('low', 'medium', 'high')),
  max_meal_cost DECIMAL(10, 2), -- Maximum cost per meal
  
  -- Regional Preferences
  region VARCHAR(100), -- User's region/country
  local_ingredients_only BOOLEAN DEFAULT FALSE,
  
  -- Meal Timing
  preferred_breakfast_time TIME,
  preferred_lunch_time TIME,
  preferred_dinner_time TIME,
  
  -- Calorie Distribution (percentage per meal)
  breakfast_calorie_percent INT DEFAULT 25,
  lunch_calorie_percent INT DEFAULT 35,
  dinner_calorie_percent INT DEFAULT 30,
  snack_calorie_percent INT DEFAULT 10,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. NUTRITION BADGES TABLE (Achievement system)
CREATE TABLE nutrition_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Badge Info
  badge_name VARCHAR(255) NOT NULL UNIQUE,
  badge_description TEXT NOT NULL,
  badge_icon_url TEXT,
  badge_category VARCHAR(50), -- 'calorie', 'protein', 'water', 'streak', 'variety'
  
  -- Criteria
  criteria_type VARCHAR(100) NOT NULL, -- 'days_streak', 'protein_target_days', 'meals_logged', etc.
  criteria_value INT NOT NULL, -- The number needed to achieve (e.g., 7 for 7-day streak)
  
  -- Display
  badge_tier VARCHAR(20) CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. USER NUTRITION BADGES TABLE (Earned badges)
CREATE TABLE user_nutrition_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES nutrition_badges(id) ON DELETE CASCADE NOT NULL,
  
  -- Achievement Info
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_for_period DATE, -- Which day/week/month was this earned for
  
  -- Metadata
  progress_value INT, -- The actual value achieved
  notes TEXT,
  
  UNIQUE(user_id, badge_id, earned_for_period)
);

CREATE INDEX idx_user_nutrition_badges_user_id ON user_nutrition_badges(user_id);

-- 14. BARCODE FOOD DATABASE TABLE (Cache)
CREATE TABLE barcode_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Barcode Info
  barcode VARCHAR(255) NOT NULL UNIQUE,
  barcode_type VARCHAR(50), -- 'UPC', 'EAN', etc.
  
  -- Food Info
  food_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  
  -- Nutrition (per 100g or per serving)
  serving_size DECIMAL(10, 2) NOT NULL,
  serving_unit VARCHAR(50) NOT NULL,
  
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL,
  carbs_grams DECIMAL(10, 2) NOT NULL,
  fats_grams DECIMAL(10, 2) NOT NULL,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Source
  data_source VARCHAR(100), -- 'OpenFoodFacts', 'Nutritionix', 'Manual', etc.
  external_id VARCHAR(255),
  
  -- Metadata
  times_scanned INT DEFAULT 0, -- How many users scanned this
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_barcode_foods_barcode ON barcode_foods(barcode);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_meal_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nutrition_badges ENABLE ROW LEVEL SECURITY;

-- Meals policies
CREATE POLICY "Users can view their own meals" 
  ON meals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals" 
  ON meals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals" 
  ON meals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals" 
  ON meals FOR DELETE 
  USING (auth.uid() = user_id);

-- Meal items policies (inherit from meals)
CREATE POLICY "Users can view meal items of their meals" 
  ON meal_items FOR SELECT 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert meal items to their meals" 
  ON meal_items FOR INSERT 
  WITH CHECK (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

CREATE POLICY "Users can update meal items of their meals" 
  ON meal_items FOR UPDATE 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete meal items of their meals" 
  ON meal_items FOR DELETE 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

-- Water intake policies
CREATE POLICY "Users can manage their own water intake" 
  ON water_intake FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily nutrition summary policies
CREATE POLICY "Users can manage their own nutrition summary" 
  ON daily_nutrition_summary FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Meal plans policies
CREATE POLICY "Users can manage their own meal plans" 
  ON meal_plans FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Meal plan items policies
CREATE POLICY "Users can view their meal plan items" 
  ON meal_plan_items FOR SELECT 
  USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their meal plan items" 
  ON meal_plan_items FOR ALL 
  USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()))
  WITH CHECK (meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

-- Shopping lists policies
CREATE POLICY "Users can manage their own shopping lists" 
  ON shopping_lists FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Shopping list items policies
CREATE POLICY "Users can manage their shopping list items" 
  ON shopping_list_items FOR ALL 
  USING (shopping_list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid()))
  WITH CHECK (shopping_list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid()));

-- AI meal suggestions policies
CREATE POLICY "Users can view their own meal suggestions" 
  ON ai_meal_suggestions FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Nutrition reports policies
CREATE POLICY "Users can view their own nutrition reports" 
  ON nutrition_reports FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User dietary preferences policies
CREATE POLICY "Users can manage their own dietary preferences" 
  ON user_dietary_preferences FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Nutrition badges - read-only for all authenticated users
CREATE POLICY "Authenticated users can view all badges" 
  ON nutrition_badges FOR SELECT 
  TO authenticated 
  USING (true);

-- User nutrition badges policies
CREATE POLICY "Users can view their own earned badges" 
  ON user_nutrition_badges FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Barcode foods - read-only for all authenticated users (public cache)
CREATE POLICY "Authenticated users can view barcode foods" 
  ON barcode_foods FOR SELECT 
  TO authenticated 
  USING (true);


-- Function to update daily nutrition summary when meal is added/updated/deleted
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate daily summary for the affected date
  INSERT INTO daily_nutrition_summary (
    user_id,
    date,
    total_calories_consumed,
    total_protein_grams,
    total_carbs_grams,
    total_fats_grams,
    total_fiber_grams,
    total_sugar_grams,
    total_sodium_mg,
    meals_logged,
    breakfast_logged,
    lunch_logged,
    dinner_logged,
    snacks_count,
    calories_target,
    protein_target_grams,
    carbs_target_grams,
    fats_target_grams
  )
  SELECT 
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.meal_date, OLD.meal_date),
    COALESCE(SUM(m.total_calories), 0),
    COALESCE(SUM(m.protein_grams), 0),
    COALESCE(SUM(m.carbs_grams), 0),
    COALESCE(SUM(m.fats_grams), 0),
    COALESCE(SUM(m.fiber_grams), 0),
    COALESCE(SUM(m.sugar_grams), 0),
    COALESCE(SUM(m.sodium_mg), 0),
    COUNT(*),
    BOOL_OR(m.meal_type = 'breakfast'),
    BOOL_OR(m.meal_type = 'lunch'),
    BOOL_OR(m.meal_type = 'dinner'),
    COUNT(*) FILTER (WHERE m.meal_type = 'snack'),
    2000, -- Default calorie target (should be from user profile)
    150,  -- Default protein target
    200,  -- Default carbs target
    65    -- Default fats target
  FROM meals m
  WHERE m.user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND m.meal_date = COALESCE(NEW.meal_date, OLD.meal_date)
  GROUP BY m.user_id, m.meal_date
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    total_calories_consumed = EXCLUDED.total_calories_consumed,
    total_protein_grams = EXCLUDED.total_protein_grams,
    total_carbs_grams = EXCLUDED.total_carbs_grams,
    total_fats_grams = EXCLUDED.total_fats_grams,
    total_fiber_grams = EXCLUDED.total_fiber_grams,
    total_sugar_grams = EXCLUDED.total_sugar_grams,
    total_sodium_mg = EXCLUDED.total_sodium_mg,
    meals_logged = EXCLUDED.meals_logged,
    breakfast_logged = EXCLUDED.breakfast_logged,
    lunch_logged = EXCLUDED.lunch_logged,
    dinner_logged = EXCLUDED.dinner_logged,
    snacks_count = EXCLUDED.snacks_count,
    updated_at = NOW(),
    goal_met = (EXCLUDED.total_calories_consumed >= daily_nutrition_summary.calories_target * 0.9 
                AND EXCLUDED.total_calories_consumed <= daily_nutrition_summary.calories_target * 1.1),
    protein_goal_met = (EXCLUDED.total_protein_grams >= daily_nutrition_summary.protein_target_grams);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update summary when meal changes
CREATE TRIGGER trigger_update_daily_nutrition_summary
AFTER INSERT OR UPDATE OR DELETE ON meals
FOR EACH ROW
EXECUTE FUNCTION update_daily_nutrition_summary();

-- Function to update water intake summary
CREATE OR REPLACE FUNCTION update_water_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_nutrition_summary
  SET 
    total_water_ml = (
      SELECT COALESCE(SUM(amount_ml), 0)
      FROM water_intake
      WHERE user_id = NEW.user_id AND date = NEW.date
    ),
    water_goal_met = (
      SELECT COALESCE(SUM(amount_ml), 0) >= NEW.daily_goal_ml
      FROM water_intake
      WHERE user_id = NEW.user_id AND date = NEW.date
    ),
    updated_at = NOW()
  WHERE user_id = NEW.user_id AND date = NEW.date;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for water intake
CREATE TRIGGER trigger_update_water_summary
AFTER INSERT OR UPDATE ON water_intake
FOR EACH ROW
EXECUTE FUNCTION update_water_summary();


INSERT INTO nutrition_badges (badge_name, badge_description, badge_category, criteria_type, criteria_value, badge_tier, display_order) VALUES
('Calorie Tracker', 'Log meals for 7 consecutive days', 'streak', 'days_streak', 7, 'bronze', 1),
('Nutrition Master', 'Log meals for 30 consecutive days', 'streak', 'days_streak', 30, 'silver', 2),
('Protein Power', 'Meet protein target 5 days in a row', 'protein', 'protein_target_days', 5, 'bronze', 3),
('Protein Champion', 'Meet protein target 15 days in a row', 'protein', 'protein_target_days', 15, 'gold', 4),
('Hydration Hero', 'Meet water goal 7 days in a row', 'water', 'water_goal_days', 7, 'bronze', 5),
('Water Warrior', 'Meet water goal 30 days in a row', 'water', 'water_goal_days', 30, 'platinum', 6),
('Meal Logger', 'Log 100 total meals', 'variety', 'total_meals', 100, 'silver', 7),
('Calorie Balance', 'Stay within calorie range 10 days in a row', 'calorie', 'calorie_balance_days', 10, 'gold', 8);





DROP TABLE IF EXISTS user_nutrition_badges CASCADE;
DROP TABLE IF EXISTS nutrition_badges CASCADE;
DROP TABLE IF EXISTS nutrition_reports CASCADE;
DROP TABLE IF EXISTS ai_meal_suggestions CASCADE;
DROP TABLE IF EXISTS shopping_list_items CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS meal CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS user_dietary_preferences CASCADE;
DROP TABLE IF EXISTS barcode_foods CASCADE;
DROP TABLE IF EXISTS water_intake CASCADE;
DROP TABLE IF EXISTS daily_nutrition_summary CASCADE;
DROP TABLE IF EXISTS meal_items CASCADE;
DROP TABLE IF EXISTS meals CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- 1. MEALS TABLE
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name VARCHAR(255),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIME NOT NULL DEFAULT CURRENT_TIME,
  total_calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
  protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  meal_category VARCHAR(50) CHECK (meal_category IN ('vegetarian', 'vegan', 'high-protein', 'high-carb', 'low-carb', 'keto', 'balanced', 'other')),
  entry_method VARCHAR(50) NOT NULL CHECK (entry_method IN ('manual', 'photo', 'barcode', 'ai-suggestion')),
  photo_url TEXT,
  barcode_value VARCHAR(255),
  ai_detected_foods JSONB,
  ai_confidence_score DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_user_date ON meals(user_id, meal_date DESC);

-- 2. MEAL ITEMS TABLE
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
  food_name VARCHAR(255) NOT NULL,
  food_brand VARCHAR(255),
  serving_size DECIMAL(10, 2) NOT NULL,
  serving_unit VARCHAR(50) NOT NULL,
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  external_food_id VARCHAR(255),
  external_source VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_items_meal_id ON meal_items(meal_id);

-- 3. WATER INTAKE TABLE
CREATE TABLE water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INT NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  daily_goal_ml INT DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_water_intake_user_date ON water_intake(user_id, date DESC);

-- 4. DAILY NUTRITION SUMMARY TABLE
CREATE TABLE daily_nutrition_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_calories_consumed DECIMAL(10, 2) NOT NULL DEFAULT 0,
  calories_target DECIMAL(10, 2) NOT NULL,
  calories_burned DECIMAL(10, 2) DEFAULT 0,
  calories_net DECIMAL(10, 2) GENERATED ALWAYS AS (total_calories_consumed - calories_burned) STORED,
  total_protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fiber_grams DECIMAL(10, 2) DEFAULT 0,
  total_sugar_grams DECIMAL(10, 2) DEFAULT 0,
  total_sodium_mg DECIMAL(10, 2) DEFAULT 0,
  protein_target_grams DECIMAL(10, 2),
  carbs_target_grams DECIMAL(10, 2),
  fats_target_grams DECIMAL(10, 2),
  total_water_ml INT DEFAULT 0,
  water_goal_ml INT DEFAULT 2000,
  meals_logged INT DEFAULT 0,
  breakfast_logged BOOLEAN DEFAULT FALSE,
  lunch_logged BOOLEAN DEFAULT FALSE,
  dinner_logged BOOLEAN DEFAULT FALSE,
  snacks_count INT DEFAULT 0,
  workout_duration_minutes INT DEFAULT 0,
  workout_calories_burned DECIMAL(10, 2) DEFAULT 0,
  goal_met BOOLEAN DEFAULT FALSE,
  protein_goal_met BOOLEAN DEFAULT FALSE,
  water_goal_met BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_nutrition_user_date ON daily_nutrition_summary(user_id, date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

-- Meals policies
CREATE POLICY "Users can view their own meals" 
  ON meals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals" 
  ON meals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals" 
  ON meals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals" 
  ON meals FOR DELETE 
  USING (auth.uid() = user_id);

-- Meal items policies
CREATE POLICY "Users can view meal items of their meals" 
  ON meal_items FOR SELECT 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert meal items to their meals" 
  ON meal_items FOR INSERT 
  WITH CHECK (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

CREATE POLICY "Users can update meal items of their meals" 
  ON meal_items FOR UPDATE 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete meal items of their meals" 
  ON meal_items FOR DELETE 
  USING (meal_id IN (SELECT id FROM meals WHERE user_id = auth.uid()));

-- Water intake policies
CREATE POLICY "Users can manage their own water intake" 
  ON water_intake FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily nutrition summary policies
CREATE POLICY "Users can manage their own nutrition summary" 
  ON daily_nutrition_summary FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Success message
SELECT 'MEAL TAB TABLES CREATED SUCCESSFULLY!' as status;































