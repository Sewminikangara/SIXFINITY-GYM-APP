-- HOME DASHBOARD TABLES

-- Daily Activity Tracking Table
CREATE TABLE IF NOT EXISTS daily_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    steps INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    workouts_completed INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    water_intake INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date 
    ON daily_activity(user_id, date DESC);

-- Weight Logs Table
CREATE TABLE IF NOT EXISTS weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    weight DECIMAL(5, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create index for weight logs
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date 
    ON weight_logs(user_id, date DESC);

-- Workout Logs Table  
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workout_name VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    calories_burned INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for workout logs
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date 
    ON workout_logs(user_id, date DESC);

-- Planned Workouts Table
CREATE TABLE IF NOT EXISTS planned_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workout_name VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    planned_date DATE NOT NULL,
    planned_time TIME,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for planned workouts
CREATE INDEX IF NOT EXISTS idx_planned_workouts_user_date 
    ON planned_workouts(user_id, planned_date);

-- Enable Row Level Security
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
-- Daily Activity Policies
CREATE POLICY "Users can view their own daily activity"
    ON daily_activity FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily activity"
    ON daily_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily activity"
    ON daily_activity FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily activity"
    ON daily_activity FOR DELETE
    USING (auth.uid() = user_id);

-- Weight Logs Policies
CREATE POLICY "Users can view their own weight logs"
    ON weight_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight logs"
    ON weight_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs"
    ON weight_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs"
    ON weight_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Workout Logs Policies
CREATE POLICY "Users can view their own workout logs"
    ON workout_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs"
    ON workout_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
    ON workout_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs"
    ON workout_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Planned Workouts Policies
CREATE POLICY "Users can view their own planned workouts"
    ON planned_workouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planned workouts"
    ON planned_workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planned workouts"
    ON planned_workouts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planned workouts"
    ON planned_workouts FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_daily_activity_updated_at
    BEFORE UPDATE ON daily_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planned_workouts_updated_at
    BEFORE UPDATE ON planned_workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
