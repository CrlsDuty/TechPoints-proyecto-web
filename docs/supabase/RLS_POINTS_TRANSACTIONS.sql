-- Fix RLS for points_transactions table
-- Allow authenticated users to insert their own transaction records

-- First, check if RLS is enabled
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON points_transactions;
DROP POLICY IF EXISTS "Allow users to view their own transactions" ON points_transactions;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON points_transactions;

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert"
  ON points_transactions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy to allow users to view their own transactions
CREATE POLICY "Allow users to view their own transactions"
  ON points_transactions
  FOR SELECT
  USING (auth.uid() = perfil_id);

-- Create policy to allow tienda to view all transactions (optional)
CREATE POLICY "Allow tienda to view all transactions"
  ON points_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'tienda'
    )
  );

-- ============================================================

-- Fix RLS for transactions table
-- Allow authenticated users to insert transaction records

-- First, check if RLS is enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON transactions;
DROP POLICY IF EXISTS "Allow users to view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow admin to view all transactions" ON transactions;

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy to allow users to view their own transactions
CREATE POLICY "Allow users to view their own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = usuario_id);

-- Create policy to allow tienda to view all transactions
CREATE POLICY "Allow tienda to view all transactions"
  ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'tienda'
    )
  );
