-- Supabase SQL Schema for FinSpark PS2 Fraud Detection System

-- 1. Create fraud_alerts table
CREATE TABLE public.fraud_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id TEXT UNIQUE NOT NULL,
    risk_score FLOAT NOT NULL,
    is_fraud BOOLEAN NOT NULL,
    model_confidence FLOAT NOT NULL,
    top_features JSONB,
    shap_values JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create model_metrics table
CREATE TABLE public.model_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_name TEXT NOT NULL,
    auc_score FLOAT,
    f1_score FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Indexes
CREATE INDEX idx_fraud_alerts_transaction_id ON public.fraud_alerts (transaction_id);
CREATE INDEX idx_fraud_alerts_created_at ON public.fraud_alerts (created_at DESC);
CREATE INDEX idx_fraud_alerts_is_fraud ON public.fraud_alerts (is_fraud);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Allow authenticated users and service roles to read alerts
CREATE POLICY "Allow read access to authenticated users" 
    ON public.fraud_alerts FOR SELECT 
    TO authenticated, service_role 
    USING (true);

-- Allow service role to insert/update alerts
CREATE POLICY "Allow insert access to service role" 
    ON public.fraud_alerts FOR INSERT 
    TO service_role 
    WITH CHECK (true);

CREATE POLICY "Allow update access to service role" 
    ON public.fraud_alerts FOR UPDATE 
    TO service_role 
    USING (true)
    WITH CHECK (true);
