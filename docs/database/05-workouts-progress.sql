-- WORKOUTS & PROGRESS TRACKING

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
