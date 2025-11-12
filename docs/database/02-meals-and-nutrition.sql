-- 1. MEALS TABLE

CREATE TABLE IF NOT EXISTS public.meals (
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
  ai_detected_foods JSONB,
  ai_confidence_score DECIMAL(5, 2),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_meals_user_id ON public.meals(user_id);
CREATE INDEX idx_meals_user_date ON public.meals(user_id, meal_date DESC);
CREATE INDEX idx_meals_meal_type ON public.meals(meal_type);
CREATE INDEX idx_meals_created_at ON public.meals(created_at DESC);

-- 2. MEAL ITEMS TABLE
-- Individual food items within a meal
CREATE TABLE IF NOT EXISTS public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  
  -- Food Item Info
  food_name VARCHAR(255) NOT NULL,
  food_brand VARCHAR(255),
  
  -- Portion Info
  serving_size DECIMAL(10, 2) NOT NULL,
  serving_unit VARCHAR(50) NOT NULL,
  
  -- Nutrition per item
  calories DECIMAL(10, 2) NOT NULL,
  protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber_grams DECIMAL(10, 2) DEFAULT 0,
  sugar_grams DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Food Database Reference
  external_food_id VARCHAR(255),
  external_source VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_items_meal_id ON public.meal_items(meal_id);

-- 3. WATER INTAKE TABLE
-- Daily water consumption tracking
CREATE TABLE IF NOT EXISTS public.water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Water Tracking
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INT NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Daily Goal
  daily_goal_ml INT DEFAULT 2000,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_water_intake_user_date ON public.water_intake(user_id, date DESC);

-- 4. DAILY NUTRITION SUMMARY TABLE
-- Aggregated daily nutrition data
CREATE TABLE IF NOT EXISTS public.daily_nutrition_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  -- Calories
  total_calories_consumed DECIMAL(10, 2) NOT NULL DEFAULT 0,
  calories_target DECIMAL(10, 2) NOT NULL,
  calories_burned DECIMAL(10, 2) DEFAULT 0,
  calories_net DECIMAL(10, 2) GENERATED ALWAYS AS (total_calories_consumed - calories_burned) STORED,
  
  -- Macros Consumed
  total_protein_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_carbs_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fats_grams DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fiber_grams DECIMAL(10, 2) DEFAULT 0,
  total_sugar_grams DECIMAL(10, 2) DEFAULT 0,
  total_sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Macro Targets
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
  
  -- Workout Impact
  workout_duration_minutes INT DEFAULT 0,
  workout_calories_burned DECIMAL(10, 2) DEFAULT 0,
  
  -- Status Flags
  goal_met BOOLEAN DEFAULT FALSE,
  protein_goal_met BOOLEAN DEFAULT FALSE,
  water_goal_met BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_nutrition_user_date ON public.daily_nutrition_summary(user_id, date DESC);

-- 5. MEAL PLANS TABLE
-- Weekly meal planning
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Plan Info
  plan_name VARCHAR(255) NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Plan Type
  plan_type VARCHAR(50) CHECK (plan_type IN ('ai-generated', 'custom', 'template')),
  generation_method VARCHAR(50),
  
  -- Plan Details
  total_weekly_calories DECIMAL(10, 2),
  avg_daily_calories DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX idx_meal_plans_active ON public.meal_plans(user_id, is_active) WHERE is_active = TRUE;

-- 6. MEAL PLAN ITEMS TABLE
-- Individual meals in a meal plan
CREATE TABLE IF NOT EXISTS public.meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE CASCADE NOT NULL,
  
  -- Schedule
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  specific_date DATE,
  
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
  cuisine_type VARCHAR(100),
  
  -- Preparation
  prep_time_minutes INT,
  cook_time_minutes INT,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  -- Ingredients (for shopping list)
  ingredients JSONB,
  
  -- User Actions
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_skipped BOOLEAN DEFAULT FALSE,
  
  -- Customization
  is_swapped BOOLEAN DEFAULT FALSE,
  original_meal_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meal_plan_items_plan_id ON public.meal_plan_items(meal_plan_id);
CREATE INDEX idx_meal_plan_items_date ON public.meal_plan_items(specific_date);

-- 7. SHOPPING LISTS TABLE
-- Grocery shopping lists
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  
  -- List Info
  list_name VARCHAR(255) NOT NULL,
  week_start_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SHOPPING LIST ITEMS TABLE
-- Individual items in shopping list
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  
  -- Item Details
  ingredient_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  
  -- Category
  category VARCHAR(100),
  
  -- Status
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMP WITH TIME ZONE,
  
  -- Price
  estimated_price DECIMAL(10, 2),
  actual_price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  
  -- Reference
  meal_plan_item_ids UUID[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_list_id ON public.shopping_list_items(shopping_list_id);

-- 9. AI MEAL SUGGESTIONS TABLE
-- AI-generated meal recommendations
CREATE TABLE IF NOT EXISTS public.ai_meal_suggestions (
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
  suggestion_reason TEXT,
  based_on_goal VARCHAR(100),
  based_on_budget VARCHAR(50),
  based_on_dietary_restrictions TEXT[],
  
  -- Personalization
  matches_allergies BOOLEAN DEFAULT TRUE,
  matches_cuisine_preference BOOLEAN DEFAULT TRUE,
  matches_budget BOOLEAN DEFAULT TRUE,
  
  -- AI Confidence
  confidence_score DECIMAL(5, 2),
  
  -- User Actions
  is_viewed BOOLEAN DEFAULT FALSE,
  is_added_to_plan BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  user_feedback VARCHAR(50),
  
  -- Scheduling
  suggested_for_date DATE,
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_meal_suggestions_user_id ON public.ai_meal_suggestions(user_id);
CREATE INDEX idx_ai_meal_suggestions_date ON public.ai_meal_suggestions(user_id, suggested_for_date);
CREATE INDEX idx_ai_meal_suggestions_active ON public.ai_meal_suggestions(user_id, expires_at) WHERE is_dismissed = FALSE;

-- 10. NUTRITION REPORTS TABLE
-- Monthly nutrition summaries
CREATE TABLE IF NOT EXISTS public.nutrition_reports (
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
  protein_goal_achievement_rate DECIMAL(5, 2),
  
  -- Water Intake Stats
  avg_daily_water_ml INT,
  days_met_water_goal INT DEFAULT 0,
  water_goal_achievement_rate DECIMAL(5, 2),
  
  -- Meal Logging Stats
  total_meals_logged INT DEFAULT 0,
  avg_meals_per_day DECIMAL(5, 2),
  most_frequent_foods JSONB,
  
  -- Trends
  calorie_trend VARCHAR(20),
  weight_change_kg DECIMAL(5, 2),
  
  -- Achievements/Badges
  badges_earned TEXT[],
  streak_days INT DEFAULT 0,
  
  -- Generated Data
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, report_year, report_month)
);

CREATE INDEX idx_nutrition_reports_user_id ON public.nutrition_reports(user_id);
CREATE INDEX idx_nutrition_reports_period ON public.nutrition_reports(user_id, report_year DESC, report_month DESC);


-- 11. USER DIETARY PREFERENCES TABLE
-- User's dietary restrictions and preferences
CREATE TABLE IF NOT EXISTS public.user_dietary_preferences (
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
  allergies TEXT[],
  
  -- Dislikes
  disliked_foods TEXT[],
  
  -- Preferences
  preferred_cuisines TEXT[],
  preferred_meal_categories TEXT[],
  
  -- Budget
  budget_range VARCHAR(20) CHECK (budget_range IN ('low', 'medium', 'high')),
  max_meal_cost DECIMAL(10, 2),
  
  -- Regional Preferences
  region VARCHAR(100),
  local_ingredients_only BOOLEAN DEFAULT FALSE,
  
  -- Meal Timing
  preferred_breakfast_time TIME,
  preferred_lunch_time TIME,
  preferred_dinner_time TIME,
  
  -- Calorie Distribution
  breakfast_calorie_percent INT DEFAULT 25,
  lunch_calorie_percent INT DEFAULT 35,
  dinner_calorie_percent INT DEFAULT 30,
  snack_calorie_percent INT DEFAULT 10,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. NUTRITION BADGES TABLE
-- Achievement badges for nutrition goals
CREATE TABLE IF NOT EXISTS public.nutrition_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Badge Info
  badge_name VARCHAR(255) NOT NULL UNIQUE,
  badge_description TEXT NOT NULL,
  badge_icon_url TEXT,
  badge_category VARCHAR(50),
  
  -- Criteria
  criteria_type VARCHAR(100) NOT NULL,
  criteria_value INT NOT NULL,
  
  -- Display
  badge_tier VARCHAR(20) CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. USER NUTRITION BADGES TABLE
-- User's earned nutrition badges
CREATE TABLE IF NOT EXISTS public.user_nutrition_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.nutrition_badges(id) ON DELETE CASCADE NOT NULL,
  
  -- Achievement Info
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_for_period DATE,
  
  -- Metadata
  progress_value INT,
  notes TEXT,
  
  UNIQUE(user_id, badge_id, earned_for_period)
);

CREATE INDEX idx_user_nutrition_badges_user_id ON public.user_nutrition_badges(user_id);

-- 14. BARCODE FOOD DATABASE TABLE
-- Cached barcode food data
CREATE TABLE IF NOT EXISTS public.barcode_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Barcode Info
  barcode VARCHAR(255) NOT NULL UNIQUE,
  barcode_type VARCHAR(50),
  
  -- Food Info
  food_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  
  -- Nutrition
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
  data_source VARCHAR(100),
  external_id VARCHAR(255),
  
  -- Metadata
  times_scanned INT DEFAULT 0,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_barcode_foods_barcode ON public.barcode_foods(barcode);


-- (RLS) 

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_meal_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nutrition_badges ENABLE ROW LEVEL SECURITY;

-- Meals Policies
CREATE POLICY "Users can view their own meals" ON public.meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meals" ON public.meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- Meal Items Policies
CREATE POLICY "Users can view meal items of their meals" ON public.meal_items FOR SELECT 
  USING (meal_id IN (SELECT id FROM public.meals WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert meal items to their meals" ON public.meal_items FOR INSERT 
  WITH CHECK (meal_id IN (SELECT id FROM public.meals WHERE user_id = auth.uid()));
CREATE POLICY "Users can update meal items of their meals" ON public.meal_items FOR UPDATE 
  USING (meal_id IN (SELECT id FROM public.meals WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete meal items of their meals" ON public.meal_items FOR DELETE 
  USING (meal_id IN (SELECT id FROM public.meals WHERE user_id = auth.uid()));

-- Water Intake Policies
CREATE POLICY "Users can manage their own water intake" ON public.water_intake FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily Nutrition Summary Policies
CREATE POLICY "Users can manage their own nutrition summary" ON public.daily_nutrition_summary FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Meal Plans Policies
CREATE POLICY "Users can manage their own meal plans" ON public.meal_plans FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Meal Plan Items Policies
CREATE POLICY "Users can view their meal plan items" ON public.meal_plan_items FOR SELECT 
  USING (meal_plan_id IN (SELECT id FROM public.meal_plans WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their meal plan items" ON public.meal_plan_items FOR ALL 
  USING (meal_plan_id IN (SELECT id FROM public.meal_plans WHERE user_id = auth.uid()))
  WITH CHECK (meal_plan_id IN (SELECT id FROM public.meal_plans WHERE user_id = auth.uid()));

-- Shopping Lists Policies
CREATE POLICY "Users can manage their own shopping lists" ON public.shopping_lists FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shopping List Items Policies
CREATE POLICY "Users can manage their shopping list items" ON public.shopping_list_items FOR ALL 
  USING (shopping_list_id IN (SELECT id FROM public.shopping_lists WHERE user_id = auth.uid()))
  WITH CHECK (shopping_list_id IN (SELECT id FROM public.shopping_lists WHERE user_id = auth.uid()));

-- AI Meal Suggestions Policies
CREATE POLICY "Users can view their own meal suggestions" ON public.ai_meal_suggestions FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Nutrition Reports Policies
CREATE POLICY "Users can view their own nutrition reports" ON public.nutrition_reports FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Dietary Preferences Policies
CREATE POLICY "Users can manage their own dietary preferences" ON public.user_dietary_preferences FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Nutrition Badges - Public Read
CREATE POLICY "Authenticated users can view all badges" ON public.nutrition_badges FOR SELECT 
  TO authenticated USING (true);

-- User Nutrition Badges Policies
CREATE POLICY "Users can view their own earned badges" ON public.user_nutrition_badges FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Barcode Foods - Public Read
CREATE POLICY "Authenticated users can view barcode foods" ON public.barcode_foods FOR SELECT 
  TO authenticated USING (true);

-- TRIGGERS & FUNCTIONS

-- Auto-update daily nutrition summary
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.daily_nutrition_summary (
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
  FROM public.meals m
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
AFTER INSERT OR UPDATE OR DELETE ON public.meals
FOR EACH ROW EXECUTE FUNCTION update_daily_nutrition_summary();

-- Update water summary
CREATE OR REPLACE FUNCTION update_water_summary()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.daily_nutrition_summary SET 
    total_water_ml = (SELECT COALESCE(SUM(amount_ml), 0) FROM public.water_intake WHERE user_id = NEW.user_id AND date = NEW.date),
    water_goal_met = (SELECT COALESCE(SUM(amount_ml), 0) >= NEW.daily_goal_ml FROM public.water_intake WHERE user_id = NEW.user_id AND date = NEW.date),
    updated_at = NOW()
  WHERE user_id = NEW.user_id AND date = NEW.date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_water_summary
AFTER INSERT OR UPDATE ON public.water_intake
FOR EACH ROW EXECUTE FUNCTION update_water_summary();

-- SEED DATA: Nutrition Badges
INSERT INTO public.nutrition_badges (badge_name, badge_description, badge_category, criteria_type, criteria_value, badge_tier, display_order) VALUES
('Calorie Tracker', 'Log meals for 7 consecutive days', 'streak', 'days_streak', 7, 'bronze', 1),
('Nutrition Master', 'Log meals for 30 consecutive days', 'streak', 'days_streak', 30, 'silver', 2),
('Protein Power', 'Meet protein target 5 days in a row', 'protein', 'protein_target_days', 5, 'bronze', 3),
('Protein Champion', 'Meet protein target 15 days in a row', 'protein', 'protein_target_days', 15, 'gold', 4),
('Hydration Hero', 'Meet water goal 7 days in a row', 'water', 'water_goal_days', 7, 'bronze', 5),
('Water Warrior', 'Meet water goal 30 days in a row', 'water', 'water_goal_days', 30, 'platinum', 6),
('Meal Logger', 'Log 100 total meals', 'variety', 'total_meals', 100, 'silver', 7),
('Calorie Balance', 'Stay within calorie range 10 days in a row', 'calorie', 'calorie_balance_days', 10, 'gold', 8)
ON CONFLICT (badge_name) DO NOTHING;

-- COMMENTS
COMMENT ON TABLE public.meals IS 'User meal entries with nutrition tracking';
COMMENT ON TABLE public.water_intake IS 'Daily water consumption tracking';
COMMENT ON TABLE public.daily_nutrition_summary IS 'Aggregated daily nutrition statistics';
COMMENT ON TABLE public.meal_plans IS 'Weekly meal planning';
COMMENT ON TABLE public.ai_meal_suggestions IS 'AI-generated meal recommendations';
COMMENT ON TABLE public.nutrition_reports IS 'Monthly nutrition summary reports';
