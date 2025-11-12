-- SIXFINITY APP - USER PROFILE & MORE TAB
-- File: 09-user-profile-more.sql
-- 9 tables: user_profiles, fitness_goals, body_stats, ai_fitness_summary, wearable_devices, achievements, health_risk, user_documents, user_preferences

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
