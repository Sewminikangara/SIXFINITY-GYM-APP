-- TRAIN TAB DATABASE SCHEMA -

-- 1. TRAINERS TABLE
CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    
    -- Basic Info
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    profile_photo_url TEXT,
    cover_image_url TEXT,
    bio TEXT,
    
    -- Professional Details
    specializations TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    achievements TEXT[] DEFAULT '{}',
    
    -- Pricing
    price_per_session DECIMAL(10, 2) NOT NULL,
    monthly_package_price DECIMAL(10, 2),
    monthly_package_sessions INTEGER DEFAULT 8,
    
    -- Rating & Reviews
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_sessions_completed INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    availability_status TEXT DEFAULT 'available',
    
    -- Associated Gym
    gym_id UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TRAINER AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS trainer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID,
    
    -- Time Slot
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Specific Date Overrides
    specific_date DATE,
    is_available BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. WORKOUTS TABLE
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    difficulty_level TEXT DEFAULT 'intermediate',
    duration_minutes INTEGER NOT NULL,
    
    -- Categories
    category TEXT NOT NULL,
    muscle_groups TEXT[] DEFAULT '{}',
    equipment_needed TEXT[] DEFAULT '{}',
    
    -- Workout Details
    total_exercises INTEGER DEFAULT 0,
    estimated_calories DECIMAL(6, 2),
    
    -- AI Recommendation Metadata
    goal_tags TEXT[] DEFAULT '{}',
    intensity_level INTEGER DEFAULT 5,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Created By
    created_by UUID,
    trainer_id UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. WORKOUT EXERCISES TABLE
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID,
    
    -- Exercise Details
    exercise_name TEXT NOT NULL,
    exercise_order INTEGER NOT NULL,
    sets INTEGER DEFAULT 3,
    reps INTEGER DEFAULT 10,
    rest_seconds INTEGER DEFAULT 60,
    
    -- Media
    gif_url TEXT,
    video_url TEXT,
    
    -- Instructions
    instructions TEXT,
    tips TEXT,
    muscle_groups TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. USER WORKOUT PLANS TABLE
CREATE TABLE IF NOT EXISTS user_workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    
    -- Plan Details
    plan_name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER,
    workouts_per_week INTEGER,
    
    -- Progress
    total_workouts INTEGER DEFAULT 0,
    completed_workouts INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5, 2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. USER WORKOUT PLAN ITEMS TABLE
CREATE TABLE IF NOT EXISTS user_workout_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID,
    workout_id UUID,
    
    -- Schedule
    day_of_week INTEGER,
    week_number INTEGER,
    workout_order INTEGER,
    
    -- Status
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TRAINER BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS trainer_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    trainer_id UUID,
    gym_id UUID,
    
    -- Session Details
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    
    -- Booking Type
    booking_type TEXT DEFAULT 'single',
    package_sessions_total INTEGER,
    package_sessions_remaining INTEGER,
    
    -- Pricing
    price_paid DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    
    -- Payment
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    transaction_id UUID,
    
    -- Status
    status TEXT DEFAULT 'confirmed',
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Reschedule Info
    original_booking_id UUID,
    rescheduled_from_date DATE,
    rescheduled_from_time TIME,
    reschedule_fee DECIMAL(10, 2) DEFAULT 0,
    rescheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Policy Enforcement
    can_reschedule BOOLEAN DEFAULT true,
    can_cancel BOOLEAN DEFAULT true,
    reschedule_deadline TIMESTAMP WITH TIME ZONE,
    cancellation_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Session Notes
    trainer_notes TEXT,
    user_feedback TEXT,
    user_rating DECIMAL(3, 2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. WORKOUT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    workout_id UUID,
    plan_id UUID,
    
    -- Session Details
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Progress
    total_exercises INTEGER,
    completed_exercises INTEGER,
    total_sets INTEGER,
    completed_sets INTEGER,
    
    -- Performance
    calories_burned DECIMAL(6, 2),
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    
    -- Status
    status TEXT DEFAULT 'in_progress',
    
    -- Notes
    session_notes TEXT,
    fatigue_level INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. WORKOUT SESSION EXERCISES TABLE
CREATE TABLE IF NOT EXISTS workout_session_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    exercise_id UUID,
    
    -- Exercise Details
    exercise_name TEXT NOT NULL,
    exercise_order INTEGER,
    
    -- Sets Performance
    sets_completed INTEGER DEFAULT 0,
    sets_data JSONB,
    
    -- Timing
    rest_time_seconds INTEGER,
    exercise_duration_seconds INTEGER,
    
    -- Status
    is_completed BOOLEAN DEFAULT false,
    skipped BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TRAINER REVIEWS TABLE
CREATE TABLE IF NOT EXISTS trainer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID,
    user_id UUID,
    booking_id UUID,
    
    -- Review Details
    rating DECIMAL(3, 2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    review_text TEXT,
    
    -- Helpful Votes
    helpful_count INTEGER DEFAULT 0,
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: ADD FOREIGN KEY CONSTRAINTS
-- =============================================

-- Trainers table foreign keys
ALTER TABLE trainers 
    ADD CONSTRAINT fk_trainers_user 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE trainers 
    ADD CONSTRAINT fk_trainers_gym 
    FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE SET NULL;

-- Trainer availability foreign keys
ALTER TABLE trainer_availability 
    ADD CONSTRAINT fk_availability_trainer 
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;

-- Workouts table foreign keys
ALTER TABLE workouts 
    ADD CONSTRAINT fk_workouts_created_by 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE workouts 
    ADD CONSTRAINT fk_workouts_trainer 
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL;

-- Workout exercises foreign keys
ALTER TABLE workout_exercises 
    ADD CONSTRAINT fk_workout_exercises_workout 
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE;

-- User workout plans foreign keys
ALTER TABLE user_workout_plans 
    ADD CONSTRAINT fk_workout_plans_user 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User workout plan items foreign keys
ALTER TABLE user_workout_plan_items 
    ADD CONSTRAINT fk_plan_items_plan 
    FOREIGN KEY (plan_id) REFERENCES user_workout_plans(id) ON DELETE CASCADE;

ALTER TABLE user_workout_plan_items 
    ADD CONSTRAINT fk_plan_items_workout 
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE;

-- Trainer bookings foreign keys
ALTER TABLE trainer_bookings 
    ADD CONSTRAINT fk_bookings_user 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE trainer_bookings 
    ADD CONSTRAINT fk_bookings_trainer 
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;

ALTER TABLE trainer_bookings 
    ADD CONSTRAINT fk_bookings_gym 
    FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE SET NULL;

ALTER TABLE trainer_bookings 
    ADD CONSTRAINT fk_bookings_original 
    FOREIGN KEY (original_booking_id) REFERENCES trainer_bookings(id);

-- Workout sessions foreign keys
ALTER TABLE workout_sessions 
    ADD CONSTRAINT fk_sessions_user 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE workout_sessions 
    ADD CONSTRAINT fk_sessions_workout 
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL;

ALTER TABLE workout_sessions 
    ADD CONSTRAINT fk_sessions_plan 
    FOREIGN KEY (plan_id) REFERENCES user_workout_plans(id) ON DELETE SET NULL;

-- Workout session exercises foreign keys
ALTER TABLE workout_session_exercises 
    ADD CONSTRAINT fk_session_exercises_session 
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE;

ALTER TABLE workout_session_exercises 
    ADD CONSTRAINT fk_session_exercises_exercise 
    FOREIGN KEY (exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE;

-- Trainer reviews foreign keys
ALTER TABLE trainer_reviews 
    ADD CONSTRAINT fk_reviews_trainer 
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;

ALTER TABLE trainer_reviews 
    ADD CONSTRAINT fk_reviews_user 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE trainer_reviews 
    ADD CONSTRAINT fk_reviews_booking 
    FOREIGN KEY (booking_id) REFERENCES trainer_bookings(id) ON DELETE SET NULL;

-- =============================================
-- STEP 3: ADD UNIQUE CONSTRAINTS
-- =============================================

ALTER TABLE trainer_availability 
    ADD CONSTRAINT unique_trainer_availability 
    UNIQUE(trainer_id, day_of_week, start_time, specific_date);

ALTER TABLE workout_exercises 
    ADD CONSTRAINT unique_workout_exercise_order 
    UNIQUE(workout_id, exercise_order);

ALTER TABLE trainer_reviews 
    ADD CONSTRAINT unique_user_booking_review 
    UNIQUE(user_id, booking_id);

-- =============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Trainers indexes
CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers(gym_id);
CREATE INDEX IF NOT EXISTS idx_trainers_rating ON trainers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_trainers_is_active ON trainers(is_active);
CREATE INDEX IF NOT EXISTS idx_trainers_specializations ON trainers USING GIN(specializations);

-- Trainer availability indexes
CREATE INDEX IF NOT EXISTS idx_trainer_availability_trainer_id ON trainer_availability(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_availability_day ON trainer_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_trainer_availability_date ON trainer_availability(specific_date);

-- Workouts indexes
CREATE INDEX IF NOT EXISTS idx_workouts_category ON workouts(category);
CREATE INDEX IF NOT EXISTS idx_workouts_difficulty ON workouts(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_workouts_is_active ON workouts(is_active);
CREATE INDEX IF NOT EXISTS idx_workouts_is_featured ON workouts(is_featured);
CREATE INDEX IF NOT EXISTS idx_workouts_muscle_groups ON workouts USING GIN(muscle_groups);

-- Workout exercises indexes
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);

-- Trainer bookings indexes
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_user_id ON trainer_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_trainer_id ON trainer_bookings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_session_date ON trainer_bookings(session_date);
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_status ON trainer_bookings(status);

-- Workout sessions indexes
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_id ON workout_sessions(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed_at ON workout_sessions(completed_at);

-- Trainer reviews indexes
CREATE INDEX IF NOT EXISTS idx_trainer_reviews_trainer_id ON trainer_reviews(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_reviews_rating ON trainer_reviews(rating DESC);

-- =============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_reviews ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: CREATE RLS POLICIES
-- =============================================

-- Trainers policies
CREATE POLICY "Trainers are viewable by everyone" 
    ON trainers FOR SELECT 
    USING (true);

CREATE POLICY "Trainers can update own profile" 
    ON trainers FOR UPDATE 
    USING (auth.uid() = user_id);

-- Workouts policies
CREATE POLICY "Workouts are viewable by everyone" 
    ON workouts FOR SELECT 
    USING (is_active = true);

-- Workout exercises policies
CREATE POLICY "Workout exercises are viewable by everyone" 
    ON workout_exercises FOR SELECT 
    USING (true);

-- User workout plans policies
CREATE POLICY "Users can view own workout plans" 
    ON user_workout_plans FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workout plans" 
    ON user_workout_plans FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans" 
    ON user_workout_plans FOR UPDATE 
    USING (auth.uid() = user_id);

-- User workout plan items policies
CREATE POLICY "Users can view own plan items" 
    ON user_workout_plan_items FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM user_workout_plans WHERE id = plan_id));

-- Trainer bookings policies
CREATE POLICY "Users can view own bookings" 
    ON trainer_bookings FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM trainers WHERE id = trainer_id));

CREATE POLICY "Users can create bookings" 
    ON trainer_bookings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" 
    ON trainer_bookings FOR UPDATE 
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM trainers WHERE id = trainer_id));

-- Workout sessions policies
CREATE POLICY "Users can view own sessions" 
    ON workout_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" 
    ON workout_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
    ON workout_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

-- Workout session exercises policies
CREATE POLICY "Users can view own session exercises" 
    ON workout_session_exercises FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM workout_sessions WHERE id = session_id));

-- Trainer reviews policies
CREATE POLICY "Reviews are viewable by everyone" 
    ON trainer_reviews FOR SELECT 
    USING (is_visible = true);

CREATE POLICY "Users can create reviews" 
    ON trainer_reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" 
    ON trainer_reviews FOR UPDATE 
    USING (auth.uid() = user_id);

-- =============================================
-- STEP 7: CREATE FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update trainer rating
CREATE OR REPLACE FUNCTION update_trainer_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trainers
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM trainer_reviews
        WHERE trainer_id = NEW.trainer_id AND is_visible = true
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM trainer_reviews
        WHERE trainer_id = NEW.trainer_id AND is_visible = true
    ),
    updated_at = NOW()
    WHERE id = NEW.trainer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trainer rating on new review
CREATE TRIGGER trigger_update_trainer_rating
AFTER INSERT OR UPDATE ON trainer_reviews
FOR EACH ROW
EXECUTE FUNCTION update_trainer_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_trainers_updated_at 
    BEFORE UPDATE ON trainers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at 
    BEFORE UPDATE ON workouts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainer_bookings_updated_at 
    BEFORE UPDATE ON trainer_bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at 
    BEFORE UPDATE ON workout_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

