-- COMPLETE TRAIN TAB SCHEMA 

CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    profile_photo_url TEXT,
    cover_image_url TEXT,
    bio TEXT,
    specializations TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    achievements TEXT[] DEFAULT '{}',
    price_per_session DECIMAL(10, 2) NOT NULL,
    monthly_package_price DECIMAL(10, 2),
    monthly_package_sessions INTEGER DEFAULT 8,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_sessions_completed INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    availability_status TEXT DEFAULT 'available',
    gym_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trainer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    specific_date DATE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    difficulty_level TEXT DEFAULT 'intermediate',
    duration_minutes INTEGER NOT NULL,
    category TEXT NOT NULL,
    muscle_groups TEXT[] DEFAULT '{}',
    equipment_needed TEXT[] DEFAULT '{}',
    total_exercises INTEGER DEFAULT 0,
    estimated_calories DECIMAL(6, 2),
    goal_tags TEXT[] DEFAULT '{}',
    intensity_level INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID,
    trainer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID,
    exercise_name TEXT NOT NULL,
    exercise_order INTEGER NOT NULL,
    sets INTEGER DEFAULT 3,
    reps INTEGER DEFAULT 10,
    rest_seconds INTEGER DEFAULT 60,
    gif_url TEXT,
    video_url TEXT,
    instructions TEXT,
    tips TEXT,
    muscle_groups TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    plan_name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER,
    workouts_per_week INTEGER,
    total_workouts INTEGER DEFAULT 0,
    completed_workouts INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_workout_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID,
    workout_id UUID,
    day_of_week INTEGER,
    week_number INTEGER,
    workout_order INTEGER,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trainer_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    trainer_id UUID,
    gym_id UUID,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    booking_type TEXT DEFAULT 'single',
    package_sessions_total INTEGER,
    package_sessions_remaining INTEGER,
    price_paid DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    transaction_id UUID,
    status TEXT DEFAULT 'confirmed',
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    original_booking_id UUID,
    rescheduled_from_date DATE,
    rescheduled_from_time TIME,
    reschedule_fee DECIMAL(10, 2) DEFAULT 0,
    rescheduled_at TIMESTAMP WITH TIME ZONE,
    can_reschedule BOOLEAN DEFAULT true,
    can_cancel BOOLEAN DEFAULT true,
    reschedule_deadline TIMESTAMP WITH TIME ZONE,
    cancellation_deadline TIMESTAMP WITH TIME ZONE,
    trainer_notes TEXT,
    user_feedback TEXT,
    user_rating DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    workout_id UUID,
    plan_id UUID,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    total_exercises INTEGER,
    completed_exercises INTEGER,
    total_sets INTEGER,
    completed_sets INTEGER,
    calories_burned DECIMAL(6, 2),
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    status TEXT DEFAULT 'in_progress',
    session_notes TEXT,
    fatigue_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_session_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    exercise_id UUID,
    exercise_name TEXT NOT NULL,
    exercise_order INTEGER,
    sets_completed INTEGER DEFAULT 0,
    sets_data JSONB,
    rest_time_seconds INTEGER,
    exercise_duration_seconds INTEGER,
    is_completed BOOLEAN DEFAULT false,
    skipped BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trainer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID,
    user_id UUID,
    booking_id UUID,
    rating DECIMAL(3, 2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    review_text TEXT,
    helpful_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: ADD FOREIGN KEY CONSTRAINTS (INTERNAL ONLY)
-- =============================================

ALTER TABLE trainer_availability 
    ADD CONSTRAINT fk_availability_trainer 
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;

ALTER TABLE workout_exercises 
    ADD CONSTRAINT fk_workout_exercises_workout 
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE;

ALTER TABLE user_workout_plan_items 
    ADD CONSTRAINT fk_plan_items_plan 
    FOREIGN KEY (plan_id) REFERENCES user_workout_plans(id) ON DELETE CASCADE;

ALTER TABLE user_workout_plan_items 
    ADD CONSTRAINT fk_plan_items_workout 
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE;

ALTER TABLE trainer_bookings 
    ADD CONSTRAINT fk_bookings_trainer 
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;

ALTER TABLE trainer_bookings 
    ADD CONSTRAINT fk_bookings_original 
    FOREIGN KEY (original_booking_id) REFERENCES trainer_bookings(id) ON DELETE SET NULL;

ALTER TABLE workout_sessions 
    ADD CONSTRAINT fk_sessions_workout 
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL;

ALTER TABLE workout_sessions 
    ADD CONSTRAINT fk_sessions_plan 
    FOREIGN KEY (plan_id) REFERENCES user_workout_plans(id) ON DELETE SET NULL;

ALTER TABLE workout_session_exercises 
    ADD CONSTRAINT fk_session_exercises_session 
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE;

ALTER TABLE workout_session_exercises 
    ADD CONSTRAINT fk_session_exercises_exercise 
    FOREIGN KEY (exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE;

ALTER TABLE trainer_reviews 
    ADD CONSTRAINT fk_reviews_trainer 
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;

ALTER TABLE trainer_reviews 
    ADD CONSTRAINT fk_reviews_booking 
    FOREIGN KEY (booking_id) REFERENCES trainer_bookings(id) ON DELETE SET NULL;

-- =============================================
-- STEP 3: ADD INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers(gym_id);
CREATE INDEX IF NOT EXISTS idx_trainers_rating ON trainers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_trainers_is_active ON trainers(is_active);
CREATE INDEX IF NOT EXISTS idx_trainers_specializations ON trainers USING GIN(specializations);

CREATE INDEX IF NOT EXISTS idx_trainer_availability_trainer_id ON trainer_availability(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_availability_day ON trainer_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_trainer_availability_date ON trainer_availability(specific_date);

CREATE INDEX IF NOT EXISTS idx_workouts_category ON workouts(category);
CREATE INDEX IF NOT EXISTS idx_workouts_difficulty ON workouts(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_workouts_is_active ON workouts(is_active);
CREATE INDEX IF NOT EXISTS idx_workouts_is_featured ON workouts(is_featured);
CREATE INDEX IF NOT EXISTS idx_workouts_muscle_groups ON workouts USING GIN(muscle_groups);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);

CREATE INDEX IF NOT EXISTS idx_trainer_bookings_user_id ON trainer_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_trainer_id ON trainer_bookings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_session_date ON trainer_bookings(session_date);
CREATE INDEX IF NOT EXISTS idx_trainer_bookings_status ON trainer_bookings(status);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_id ON workout_sessions(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed_at ON workout_sessions(completed_at);

CREATE INDEX IF NOT EXISTS idx_trainer_reviews_trainer_id ON trainer_reviews(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_reviews_rating ON trainer_reviews(rating DESC);

-- =============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
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
-- STEP 5: CREATE RLS POLICIES
-- =============================================

-- Trainers: viewable by everyone
CREATE POLICY "Trainers viewable by everyone" 
    ON trainers FOR SELECT 
    USING (true);

CREATE POLICY "Trainers can insert" 
    ON trainers FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Trainers can update own profile" 
    ON trainers FOR UPDATE 
    USING (auth.uid() = user_id);

-- Trainer availability: viewable by everyone
CREATE POLICY "Trainer availability viewable by everyone" 
    ON trainer_availability FOR SELECT 
    USING (true);

-- Workouts: viewable by everyone
CREATE POLICY "Workouts viewable by everyone" 
    ON workouts FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Workouts can be inserted" 
    ON workouts FOR INSERT 
    WITH CHECK (true);

-- Workout exercises: viewable by everyone
CREATE POLICY "Workout exercises viewable by everyone" 
    ON workout_exercises FOR SELECT 
    USING (true);

CREATE POLICY "Workout exercises can be inserted" 
    ON workout_exercises FOR INSERT 
    WITH CHECK (true);

-- User workout plans: users can manage their own
CREATE POLICY "Users can view own workout plans" 
    ON user_workout_plans FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workout plans" 
    ON user_workout_plans FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans" 
    ON user_workout_plans FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans" 
    ON user_workout_plans FOR DELETE 
    USING (auth.uid() = user_id);

-- User workout plan items: users can view their plan items
CREATE POLICY "Users can view own plan items" 
    ON user_workout_plan_items FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM user_workout_plans WHERE id = plan_id));

CREATE POLICY "Users can insert own plan items" 
    ON user_workout_plan_items FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM user_workout_plans WHERE id = plan_id));

-- Trainer bookings: users can view/manage their own
CREATE POLICY "Users can view own bookings" 
    ON trainer_bookings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" 
    ON trainer_bookings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" 
    ON trainer_bookings FOR UPDATE 
    USING (auth.uid() = user_id);

-- Workout sessions: users can manage their own
CREATE POLICY "Users can view own sessions" 
    ON workout_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" 
    ON workout_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
    ON workout_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

-- Workout session exercises: users can view their session exercises
CREATE POLICY "Users can view own session exercises" 
    ON workout_session_exercises FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM workout_sessions WHERE id = session_id));

CREATE POLICY "Users can insert own session exercises" 
    ON workout_session_exercises FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM workout_sessions WHERE id = session_id));

CREATE POLICY "Users can update own session exercises" 
    ON workout_session_exercises FOR UPDATE 
    USING (auth.uid() IN (SELECT user_id FROM workout_sessions WHERE id = session_id));

-- Trainer reviews: viewable by everyone, users can create/update own
CREATE POLICY "Reviews viewable by everyone" 
    ON trainer_reviews FOR SELECT 
    USING (is_visible = true);

CREATE POLICY "Users can create reviews" 
    ON trainer_reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" 
    ON trainer_reviews FOR UPDATE 
    USING (auth.uid() = user_id);

-- =============================================
-- STEP 6: CREATE FUNCTIONS & TRIGGERS
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
DROP TRIGGER IF EXISTS trigger_update_trainer_rating ON trainer_reviews;
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
DROP TRIGGER IF EXISTS update_trainers_updated_at ON trainers;
CREATE TRIGGER update_trainers_updated_at 
    BEFORE UPDATE ON trainers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workouts_updated_at ON workouts;
CREATE TRIGGER update_workouts_updated_at 
    BEFORE UPDATE ON workouts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trainer_bookings_updated_at ON trainer_bookings;
CREATE TRIGGER update_trainer_bookings_updated_at 
    BEFORE UPDATE ON trainer_bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at 
    BEFORE UPDATE ON workout_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

