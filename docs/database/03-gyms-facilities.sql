-- GYMS & FACILITIES MANAGEMENT

-- 1. GYMS TABLE 
CREATE TABLE IF NOT EXISTS public.gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_photo_url TEXT,
    
    -- Location (PostGIS)
    location GEOGRAPHY(POINT, 4326), -- Lat/Long coordinates
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Contact Information
    phone VARCHAR(20),
    email VARCHAR(255),
    website TEXT,
    
    -- Operating Hours
    operating_hours JSONB, -- {monday: {open: "06:00", close: "22:00"}, ...}
    
    -- Amenities & Features
    amenities TEXT[], -- ['parking', 'showers', 'lockers', 'wifi', 'cafe', etc.]
    equipment_list TEXT[], -- ['treadmills', 'dumbbells', 'squat_racks', etc.]
    
    -- Pricing
    membership_plans JSONB, -- Array of {plan_name, price, duration, features}
    day_pass_price DECIMAL(10, 2),
    
    -- Ratings & Stats
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    total_members INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index for location-based queries
CREATE INDEX IF NOT EXISTS idx_gyms_location ON public.gyms USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_gyms_city ON public.gyms(city);
CREATE INDEX IF NOT EXISTS idx_gyms_rating ON public.gyms(rating DESC);
CREATE INDEX IF NOT EXISTS idx_gyms_active ON public.gyms(is_active) WHERE is_active = TRUE;

-- 2. GYM MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.gym_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    
    -- Membership Details
    membership_type VARCHAR(100) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'day_pass'
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled', 'suspended')),
    
    -- Visit Tracking
    total_visits INTEGER DEFAULT 0,
    last_visited TIMESTAMP WITH TIME ZONE,
    
    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT FALSE,
    
    -- Payment Reference
    payment_transaction_id UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_memberships_user_id ON public.gym_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_gym_id ON public.gym_memberships(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_status ON public.gym_memberships(status);

-- 3. CHECK-INS TABLE
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES public.gym_memberships(id) ON DELETE SET NULL,
    
    -- Check-in Details
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Check-in Method
    check_in_method VARCHAR(50) CHECK (check_in_method IN ('qr_code', 'nfc', 'manual', 'bluetooth')),
    
    -- Location Verification
    check_in_location GEOGRAPHY(POINT, 4326),
    is_verified BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_gym_id ON public.check_ins(gym_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON public.check_ins(check_in_time DESC);

-- 4. EQUIPMENT TABLE
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    
    -- Equipment Details
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'cardio', 'strength', 'free_weights', 'machines', etc.
    description TEXT,
    image_url TEXT,
    
    -- Availability
    total_count INTEGER NOT NULL DEFAULT 1,
    available_count INTEGER NOT NULL DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_gym_id ON public.equipment(gym_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_active ON public.equipment(is_active);

-- 5. EQUIPMENT USAGE TABLE
CREATE TABLE IF NOT EXISTS public.equipment_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    
    -- Usage Details
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'in_use' CHECK (status IN ('in_use', 'completed', 'abandoned')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_usage_equipment_id ON public.equipment_usage(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_user_id ON public.equipment_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_status ON public.equipment_usage(status);

-- 6. EQUIPMENT QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.equipment_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    
    -- Queue Details
    position INTEGER NOT NULL,
    estimated_wait_minutes INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'using', 'expired', 'canceled')),
    
    -- Notifications
    notified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_queue_equipment_id ON public.equipment_queue(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_queue_user_id ON public.equipment_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_queue_status ON public.equipment_queue(status);

-- 7. TRAINERS TABLE
CREATE TABLE IF NOT EXISTS public.trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    
    -- Trainer Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    bio TEXT,
    profile_photo_url TEXT,
    
    -- Specializations
    specializations TEXT[], -- ['weight_loss', 'muscle_building', 'yoga', 'crossfit', etc.]
    certifications TEXT[], -- ['ACE', 'NASM', 'ISSA', etc.]
    
    -- Experience
    years_of_experience INTEGER,
    
    -- Availability
    availability JSONB, -- {monday: [{start: "09:00", end: "12:00"}, ...], ...}
    
    -- Pricing
    hourly_rate DECIMAL(10, 2),
    session_packages JSONB, -- [{sessions: 5, price: 200, discount: 10%}, ...]
    
    -- Ratings & Stats
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON public.trainers(gym_id);
CREATE INDEX IF NOT EXISTS idx_trainers_rating ON public.trainers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_trainers_active ON public.trainers(is_active);

-- 8. TRAINING SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    
    -- Session Details
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Session Type
    session_type VARCHAR(50) CHECK (session_type IN ('personal', 'group', 'consultation')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'no_show')),
    
    -- Payment
    price DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    
    -- Notes
    trainer_notes TEXT,
    user_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer_id ON public.training_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON public.training_sessions(session_date);

-- 9. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
    
    -- Class Details
    class_name VARCHAR(255) NOT NULL,
    description TEXT,
    class_type VARCHAR(100), -- 'yoga', 'zumba', 'spinning', 'hiit', etc.
    
    -- Schedule
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Capacity
    max_capacity INTEGER NOT NULL,
    current_bookings INTEGER DEFAULT 0,
    
    -- Difficulty
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
    
    -- Pricing
    price_per_session DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_gym_id ON public.classes(gym_id);
CREATE INDEX IF NOT EXISTS idx_classes_trainer_id ON public.classes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_classes_day ON public.classes(day_of_week);

-- 10. CLASS BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.class_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Booking Details
    booking_date DATE NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'attended', 'missed', 'canceled')),
    
    -- Check-in
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_bookings_class_id ON public.class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_user_id ON public.class_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_date ON public.class_bookings(booking_date);

-- 11. GYM REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.gym_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    
    -- Review Categories
    cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
    equipment_rating INTEGER CHECK (equipment_rating BETWEEN 1 AND 5),
    staff_rating INTEGER CHECK (staff_rating BETWEEN 1 AND 5),
    value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
    
    -- Media
    photos TEXT[], -- Array of photo URLs
    
    -- Helpfulness
    helpful_count INTEGER DEFAULT 0,
    
    -- Status
    is_verified_visit BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_reviews_gym_id ON public.gym_reviews(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_reviews_user_id ON public.gym_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_reviews_rating ON public.gym_reviews(rating DESC);

-- 12. REVIEW HELPFUL VOTES TABLE
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.gym_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Vote
    is_helpful BOOLEAN NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON public.review_helpful_votes(review_id);

-- 13. TRAINER REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.trainer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    training_session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL,
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    
    -- Review Categories
    professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
    knowledge_rating INTEGER CHECK (knowledge_rating BETWEEN 1 AND 5),
    motivation_rating INTEGER CHECK (motivation_rating BETWEEN 1 AND 5),
    results_rating INTEGER CHECK (results_rating BETWEEN 1 AND 5),
    
    -- Helpfulness
    helpful_count INTEGER DEFAULT 0,
    
    -- Status
    is_verified_session BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainer_reviews_trainer_id ON public.trainer_reviews(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_reviews_user_id ON public.trainer_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_reviews_rating ON public.trainer_reviews(rating DESC);

-- TRIGGERS

-- Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_gyms_updated_at ON public.gyms;
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON public.gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gym_memberships_updated_at ON public.gym_memberships;
CREATE TRIGGER update_gym_memberships_updated_at BEFORE UPDATE ON public.gym_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipment_updated_at ON public.equipment;
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trainers_updated_at ON public.trainers;
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON public.trainers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Calculate check-in duration
CREATE OR REPLACE FUNCTION calculate_checkin_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_checkin_duration ON public.check_ins;
CREATE TRIGGER trigger_calculate_checkin_duration
    BEFORE UPDATE ON public.check_ins
    FOR EACH ROW
    EXECUTE FUNCTION calculate_checkin_duration();

-- Trigger: Update gym rating when review is added
CREATE OR REPLACE FUNCTION update_gym_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.gyms
    SET rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.gym_reviews
        WHERE gym_id = NEW.gym_id AND is_approved = TRUE
    ),
    review_count = (
        SELECT COUNT(*)
        FROM public.gym_reviews
        WHERE gym_id = NEW.gym_id AND is_approved = TRUE
    )
    WHERE id = NEW.gym_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gym_rating ON public.gym_reviews;
CREATE TRIGGER trigger_update_gym_rating
    AFTER INSERT OR UPDATE ON public.gym_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_gym_rating();

-- Trigger: Update trainer rating
CREATE OR REPLACE FUNCTION update_trainer_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.trainers
    SET rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.trainer_reviews
        WHERE trainer_id = NEW.trainer_id AND is_approved = TRUE
    ),
    review_count = (
        SELECT COUNT(*)
        FROM public.trainer_reviews
        WHERE trainer_id = NEW.trainer_id AND is_approved = TRUE
    )
    WHERE id = NEW.trainer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trainer_rating ON public.trainer_reviews;
CREATE TRIGGER trigger_update_trainer_rating
    AFTER INSERT OR UPDATE ON public.trainer_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_trainer_rating();

-- FUNCTIONS

-- Function: Find nearby gyms using PostGIS
CREATE OR REPLACE FUNCTION find_nearby_gyms(
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
    FROM public.gyms g
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
    FROM public.gym_memberships gm
    JOIN public.gyms g ON g.id = gm.gym_id
    WHERE 
        gm.user_id = p_user_id
        AND gm.status = 'active'
        AND g.is_active = true
    ORDER BY gm.last_visited DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function: Get equipment live status
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
            FROM public.equipment_queue eq
            WHERE eq.equipment_id = e.id AND eq.status = 'waiting'
        ) AS queue_count
    FROM public.equipment e
    WHERE 
        e.gym_id = p_gym_id
        AND e.is_active = true
    ORDER BY e.category, e.name;
END;
$$ LANGUAGE plpgsql;

-- (RLS)

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_reviews ENABLE ROW LEVEL SECURITY;

-- Gyms: Public read access
DROP POLICY IF EXISTS "Anyone can view active gyms" ON public.gyms;
CREATE POLICY "Anyone can view active gyms" ON public.gyms FOR SELECT 
    USING (is_active = TRUE);

-- Gym Memberships
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.gym_memberships;
CREATE POLICY "Users can view their own memberships" ON public.gym_memberships FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own memberships" ON public.gym_memberships;
CREATE POLICY "Users can insert their own memberships" ON public.gym_memberships FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own memberships" ON public.gym_memberships;
CREATE POLICY "Users can update their own memberships" ON public.gym_memberships FOR UPDATE 
    USING (auth.uid() = user_id);

-- Check-ins
DROP POLICY IF EXISTS "Users can manage their own check-ins" ON public.check_ins;
CREATE POLICY "Users can manage their own check-ins" ON public.check_ins FOR ALL 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Equipment: Public read access
DROP POLICY IF EXISTS "Anyone can view equipment" ON public.equipment;
CREATE POLICY "Anyone can view equipment" ON public.equipment FOR SELECT 
    USING (is_active = TRUE);

-- Equipment Usage
DROP POLICY IF EXISTS "Users can manage their equipment usage" ON public.equipment_usage;
CREATE POLICY "Users can manage their equipment usage" ON public.equipment_usage FOR ALL 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Equipment Queue
DROP POLICY IF EXISTS "Users can manage their queue entries" ON public.equipment_queue;
CREATE POLICY "Users can manage their queue entries" ON public.equipment_queue FOR ALL 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trainers: Public read access
DROP POLICY IF EXISTS "Anyone can view active trainers" ON public.trainers;
CREATE POLICY "Anyone can view active trainers" ON public.trainers FOR SELECT 
    USING (is_active = TRUE);

-- Training Sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.training_sessions;
CREATE POLICY "Users can view their own sessions" ON public.training_sessions FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create sessions" ON public.training_sessions;
CREATE POLICY "Users can create sessions" ON public.training_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their sessions" ON public.training_sessions;
CREATE POLICY "Users can update their sessions" ON public.training_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

-- Classes: Public read access
DROP POLICY IF EXISTS "Anyone can view active classes" ON public.classes;
CREATE POLICY "Anyone can view active classes" ON public.classes FOR SELECT 
    USING (is_active = TRUE);

-- Class Bookings
DROP POLICY IF EXISTS "Users can manage their class bookings" ON public.class_bookings;
CREATE POLICY "Users can manage their class bookings" ON public.class_bookings FOR ALL 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Gym Reviews
DROP POLICY IF EXISTS "Anyone can view approved gym reviews" ON public.gym_reviews;
CREATE POLICY "Anyone can view approved gym reviews" ON public.gym_reviews FOR SELECT 
    USING (is_approved = TRUE);

DROP POLICY IF EXISTS "Users can create gym reviews" ON public.gym_reviews;
CREATE POLICY "Users can create gym reviews" ON public.gym_reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their gym reviews" ON public.gym_reviews;
CREATE POLICY "Users can update their gym reviews" ON public.gym_reviews FOR UPDATE 
    USING (auth.uid() = user_id);

-- Review Helpful Votes
DROP POLICY IF EXISTS "Users can vote on reviews" ON public.review_helpful_votes;
CREATE POLICY "Users can vote on reviews" ON public.review_helpful_votes FOR ALL 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trainer Reviews
DROP POLICY IF EXISTS "Anyone can view approved trainer reviews" ON public.trainer_reviews;
CREATE POLICY "Anyone can view approved trainer reviews" ON public.trainer_reviews FOR SELECT 
    USING (is_approved = TRUE);

DROP POLICY IF EXISTS "Users can create trainer reviews" ON public.trainer_reviews;
CREATE POLICY "Users can create trainer reviews" ON public.trainer_reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their trainer reviews" ON public.trainer_reviews;
CREATE POLICY "Users can update their trainer reviews" ON public.trainer_reviews FOR UPDATE 
    USING (auth.uid() = user_id);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE ' Gyms & Facilities tables created successfully!';
    RAISE NOTICE '   - 13 tables with PostGIS spatial queries';
    RAISE NOTICE '   - Equipment tracking & queue system';
    RAISE NOTICE '   - Trainer & class management';
    RAISE NOTICE '   - Review system with ratings';
    RAISE NOTICE '   - RLS policies enabled';
END $$;
