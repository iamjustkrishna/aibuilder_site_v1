-- =====================================================
-- RESOURCES PAYMENT SYSTEM - DATABASE SCHEMA
-- =====================================================

-- 0. Update users table (add is_admin column if it doesn't exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 1. Update resources table (add purchasable fields)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_purchasable BOOLEAN DEFAULT false;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS price_inr INTEGER; -- in paise (49900 = ₹499)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS price_usd INTEGER; -- in cents (799 = $7.99)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_storage_path TEXT; -- path in Supabase Storage
ALTER TABLE resources ADD COLUMN IF NOT EXISTS preview_url TEXT; -- optional preview link

-- 2. Create purchased_resources table
CREATE TABLE IF NOT EXISTS purchased_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  amount_paid INTEGER NOT NULL, -- actual amount paid
  currency TEXT NOT NULL, -- 'INR' or 'USD'
  payment_gateway TEXT NOT NULL, -- 'razorpay' or 'stripe'
  transaction_id TEXT NOT NULL, -- gateway transaction ID
  payment_status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
  purchased_at TIMESTAMP DEFAULT now(),

  -- Prevent duplicate purchases
  UNIQUE(user_id, resource_id)
);

-- 3. Create resource_downloads table (tracking)
CREATE TABLE IF NOT EXISTS resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP DEFAULT now()
);

-- 4. Create payments table (complete transaction history)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  payment_gateway TEXT NOT NULL,
  gateway_order_id TEXT NOT NULL,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  status TEXT DEFAULT 'created', -- 'created', 'authorized', 'captured', 'failed'
  metadata JSONB, -- store any additional data
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_purchased_resources_user_id ON purchased_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_resources_resource_id ON purchased_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_user_id ON resource_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE purchased_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- purchased_resources policies
CREATE POLICY "Users can view their own purchases"
  ON purchased_resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON purchased_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- resource_downloads policies
CREATE POLICY "Users can view their own downloads"
  ON resource_downloads FOR SELECT
  USING (auth.uid() = user_id);

-- payments policies
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has purchased a resource
CREATE OR REPLACE FUNCTION has_purchased_resource(p_user_id UUID, p_resource_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM purchased_resources
    WHERE user_id = p_user_id
    AND resource_id = p_resource_id
    AND payment_status = 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's purchased resources count
CREATE OR REPLACE FUNCTION get_user_purchases_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM purchased_resources
    WHERE user_id = p_user_id
    AND payment_status = 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
