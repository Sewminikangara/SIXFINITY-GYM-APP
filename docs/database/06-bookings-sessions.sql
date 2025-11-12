--  BOOKINGS & SESSIONS SYSTEM  

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

-- ============================================================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- ============================================================================
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

-- ============================================================================
-- 3. FAQ TABLE
-- ============================================================================
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

-- ============================================================================
-- 4. SUPPORT REQUESTS TABLE
-- ============================================================================
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

-- ============================================================================
-- 5. SUPPORT CHAT TABLE
-- ============================================================================
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

-- ============================================================================
-- 6. ISSUE REPORTS TABLE
-- ============================================================================
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

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

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
