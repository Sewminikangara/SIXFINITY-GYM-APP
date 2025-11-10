-- SIXFINITY FITNESS APP - DATABASE SCHEMA
-- PostgreSQL + Supabase

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
