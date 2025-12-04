-- =====================================================
-- TRAINERS SYSTEM DATABASE SCHEMA
-- =====================================================
-- This file creates all tables for the trainers feature including:
-- - trainers (profiles, certifications, specializations)
-- - trainer_sessions (bookings with status tracking)
-- - trainer_reviews (ratings and feedback)
-- - trainer_availability (schedule management)
-- - reschedule_requests (policy enforcement)
-- - trainer_messages (chat system)
-- =====================================================

-- Drop existing tables if they exist (for fresh migration)
DROP TABLE IF EXISTS trainer_messages CASCADE;
DROP TABLE IF EXISTS reschedule_requests CASCADE;
DROP TABLE IF EXISTS trainer_availability CASCADE;
DROP TABLE IF EXISTS trainer_reviews CASCADE;
DROP TABLE IF EXISTS trainer_sessions CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;

-- =====================================================
-- 1. TRAINERS TABLE
-- =====================================================
CREATE TABLE trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    profile_image_url TEXT,
    cover_image_url TEXT,
    bio TEXT,
    specializations TEXT[] DEFAULT '{}', -- e.g., ['Strength', 'Cardio', 'Yoga']
    certifications TEXT[] DEFAULT '{}', -- e.g., ['NASM CPT', 'ACE Personal Trainer']
    achievements TEXT[] DEFAULT '{}', -- e.g., ['10+ Years Experience', 'Competition Winner']
    experience_years INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00, -- Average rating (0.00 - 5.00)
    reviews_count INTEGER DEFAULT 0,
    price_per_session DECIMAL(10, 2) DEFAULT 0.00,
    price_monthly DECIMAL(10, 2) DEFAULT 0.00, -- Monthly package price
    availability TEXT[] DEFAULT '{}', -- e.g., ['Morning', 'Afternoon', 'Evening', 'Weekends']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TRAINER SESSIONS TABLE
-- =====================================================
CREATE TABLE trainer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    session_type VARCHAR(50) DEFAULT 'Personal Training', -- 'Personal Training', 'Group Class', 'Virtual'
    duration_minutes INTEGER DEFAULT 60,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
    payment_transaction_id UUID,
    notes TEXT, -- Special requests or session notes
    workout_data JSONB, -- Store workout details after session
    completion_rating INTEGER, -- Member's rating after session (1-5)
    completion_feedback TEXT,
    cancelled_by VARCHAR(20), -- 'member' or 'trainer'
    cancellation_reason TEXT,
    cancellation_fee DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    CONSTRAINT valid_rating CHECK (completion_rating BETWEEN 1 AND 5)
);

-- =====================================================
-- 3. TRAINER REVIEWS TABLE
-- =====================================================
CREATE TABLE trainer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES trainer_sessions(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false, -- True if from a completed session
    helpful_count INTEGER DEFAULT 0, -- How many found this review helpful
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_id, session_id) -- One review per session
);

-- =====================================================
-- 4. TRAINER AVAILABILITY TABLE
-- =====================================================
CREATE TABLE trainer_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- =====================================================
-- 5. RESCHEDULE REQUESTS TABLE
-- =====================================================
CREATE TABLE reschedule_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES trainer_sessions(id) ON DELETE CASCADE,
    requested_by VARCHAR(20) NOT NULL, -- 'member' or 'trainer'
    original_date DATE NOT NULL,
    original_time TIME NOT NULL,
    new_date DATE NOT NULL,
    new_time TIME NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'declined'
    response_by VARCHAR(20), -- 'member' or 'trainer' (who responded)
    response_message TEXT,
    reschedule_fee DECIMAL(10, 2) DEFAULT 0.00,
    policy_applied VARCHAR(50), -- e.g., 'within_24_hours', 'within_48_hours', 'more_than_48_hours'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT valid_requested_by CHECK (requested_by IN ('member', 'trainer')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'declined'))
);

-- =====================================================
-- 6. TRAINER MESSAGES TABLE
-- =====================================================
CREATE TABLE trainer_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    session_id UUID REFERENCES trainer_sessions(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(message)) > 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Trainers indexes
CREATE INDEX idx_trainers_gym_id ON trainers(gym_id);
CREATE INDEX idx_trainers_specializations ON trainers USING GIN(specializations);
CREATE INDEX idx_trainers_rating ON trainers(rating DESC);
CREATE INDEX idx_trainers_active ON trainers(is_active) WHERE is_active = true;

-- Trainer sessions indexes
CREATE INDEX idx_trainer_sessions_member_id ON trainer_sessions(member_id);
CREATE INDEX idx_trainer_sessions_trainer_id ON trainer_sessions(trainer_id);
CREATE INDEX idx_trainer_sessions_gym_id ON trainer_sessions(gym_id);
CREATE INDEX idx_trainer_sessions_date_time ON trainer_sessions(session_date, session_time);
CREATE INDEX idx_trainer_sessions_status ON trainer_sessions(status);
CREATE INDEX idx_trainer_sessions_upcoming ON trainer_sessions(session_date, session_time) 
    WHERE status IN ('pending', 'confirmed');

-- Trainer reviews indexes
CREATE INDEX idx_trainer_reviews_trainer_id ON trainer_reviews(trainer_id);
CREATE INDEX idx_trainer_reviews_member_id ON trainer_reviews(member_id);
CREATE INDEX idx_trainer_reviews_session_id ON trainer_reviews(session_id);
CREATE INDEX idx_trainer_reviews_verified ON trainer_reviews(is_verified) WHERE is_verified = true;

-- Trainer availability indexes
CREATE INDEX idx_trainer_availability_trainer_id ON trainer_availability(trainer_id);
CREATE INDEX idx_trainer_availability_day ON trainer_availability(day_of_week);
CREATE INDEX idx_trainer_availability_effective ON trainer_availability(effective_from, effective_until);

-- Reschedule requests indexes
CREATE INDEX idx_reschedule_requests_session_id ON reschedule_requests(session_id);
CREATE INDEX idx_reschedule_requests_status ON reschedule_requests(status);
CREATE INDEX idx_reschedule_requests_pending ON reschedule_requests(status) WHERE status = 'pending';

-- Trainer messages indexes
CREATE INDEX idx_trainer_messages_sender_id ON trainer_messages(sender_id);
CREATE INDEX idx_trainer_messages_receiver_id ON trainer_messages(receiver_id);
CREATE INDEX idx_trainer_messages_trainer_id ON trainer_messages(trainer_id);
CREATE INDEX idx_trainer_messages_unread ON trainer_messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_trainer_messages_created_at ON trainer_messages(created_at DESC);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trainers_updated_at
    BEFORE UPDATE ON trainers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainer_sessions_updated_at
    BEFORE UPDATE ON trainer_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainer_reviews_updated_at
    BEFORE UPDATE ON trainer_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainer_availability_updated_at
    BEFORE UPDATE ON trainer_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reschedule_requests_updated_at
    BEFORE UPDATE ON reschedule_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update trainer rating when new review is added
CREATE OR REPLACE FUNCTION update_trainer_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trainers
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM trainer_reviews
        WHERE trainer_id = NEW.trainer_id
    ),
    reviews_count = (
        SELECT COUNT(*)
        FROM trainer_reviews
        WHERE trainer_id = NEW.trainer_id
    ),
    updated_at = NOW()
    WHERE id = NEW.trainer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trainer_rating_on_review
    AFTER INSERT OR UPDATE OR DELETE ON trainer_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_trainer_rating();

-- Mark message as read timestamp
CREATE OR REPLACE FUNCTION set_message_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_trainer_message_read_at
    BEFORE UPDATE ON trainer_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_message_read_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_messages ENABLE ROW LEVEL SECURITY;

-- Trainers: Public read access, restricted write
CREATE POLICY "Trainers are viewable by everyone" ON trainers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Trainers can update their own profile" ON trainers
    FOR UPDATE USING (auth.uid() IN (
        SELECT id FROM profiles WHERE email = trainers.email
    ));

-- Trainer sessions: Members can see their own, trainers can see theirs
CREATE POLICY "Members can view their own sessions" ON trainer_sessions
    FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Members can create sessions" ON trainer_sessions
    FOR INSERT WITH CHECK (member_id = auth.uid());

CREATE POLICY "Members can update their own sessions" ON trainer_sessions
    FOR UPDATE USING (member_id = auth.uid());

-- Trainer reviews: Public read, verified write
CREATE POLICY "Reviews are viewable by everyone" ON trainer_reviews
    FOR SELECT USING (true);

CREATE POLICY "Members can create reviews for their sessions" ON trainer_reviews
    FOR INSERT WITH CHECK (member_id = auth.uid());

CREATE POLICY "Members can update their own reviews" ON trainer_reviews
    FOR UPDATE USING (member_id = auth.uid());

-- Trainer availability: Public read
CREATE POLICY "Trainer availability is viewable by everyone" ON trainer_availability
    FOR SELECT USING (is_available = true);

-- Reschedule requests: Members can see their own
CREATE POLICY "Members can view their reschedule requests" ON reschedule_requests
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM trainer_sessions WHERE member_id = auth.uid()
        )
    );

CREATE POLICY "Members can create reschedule requests" ON reschedule_requests
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM trainer_sessions WHERE member_id = auth.uid()
        )
    );

-- Trainer messages: Sender/receiver can view
CREATE POLICY "Users can view their messages" ON trainer_messages
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON trainer_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Receivers can update read status" ON trainer_messages
    FOR UPDATE USING (receiver_id = auth.uid());

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample trainers (replace gym_id with actual gym IDs from your database)
INSERT INTO trainers (full_name, gym_id, bio, specializations, certifications, achievements, experience_years, rating, reviews_count, price_per_session, price_monthly, availability, profile_image_url, cover_image_url) VALUES
('John Smith', (SELECT id FROM gyms LIMIT 1), 'Certified personal trainer with 10+ years of experience specializing in strength training and functional fitness.', 
 ARRAY['Strength', 'Functional', 'HIIT'], 
 ARRAY['NASM CPT', 'Certified Strength Coach', 'Functional Movement Screen'], 
 ARRAY['10+ Years Experience', 'Competition Coach', '500+ Transformations'],
 10, 4.8, 127, 75.00, 500.00, 
 ARRAY['Morning', 'Afternoon', 'Evening'],
 'https://images.unsplash.com/photo-1567415309355-1f08c32fa2d4?w=400',
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),

('Sarah Johnson', (SELECT id FROM gyms LIMIT 1), 'Yoga and pilates instructor focused on mind-body wellness and flexibility training.',
 ARRAY['Yoga', 'Pilates', 'Flexibility'],
 ARRAY['RYT 500 Yoga Alliance', 'Pilates Mat Certification'],
 ARRAY['8 Years Experience', 'Wellness Coach', 'Mindfulness Expert'],
 8, 4.9, 89, 60.00, 420.00,
 ARRAY['Morning', 'Afternoon', 'Weekends'],
 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800'),

('Mike Rodriguez', (SELECT id FROM gyms LIMIT 1), 'Former athlete specializing in sports performance and CrossFit training.',
 ARRAY['CrossFit', 'HIIT', 'Sports Performance'],
 ARRAY['CrossFit Level 2', 'CSCS Certified', 'Sports Nutrition Specialist'],
 ARRAY['12 Years Experience', 'Former Pro Athlete', 'Competition Coach'],
 12, 4.7, 203, 85.00, 600.00,
 ARRAY['Afternoon', 'Evening'],
 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Trainers system tables created successfully!';
    RAISE NOTICE 'Tables created: trainers, trainer_sessions, trainer_reviews, trainer_availability, reschedule_requests, trainer_messages';
    RAISE NOTICE 'Sample data inserted: 3 trainers';
    RAISE NOTICE 'Next steps: Update gym_id references and add more trainers as needed.';
END
$$;
