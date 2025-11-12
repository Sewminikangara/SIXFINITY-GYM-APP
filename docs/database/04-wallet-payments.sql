-- WALLET & PAYMENTS SYSTEM

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



-- BOOKINGS 
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





-- MORE TAB DATABASE SCHEMA
-- Part 4: Referrals & Rewards Tables

-- 1. EXTEND USER_PROFILES TABLE FOR REFERRALS

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
