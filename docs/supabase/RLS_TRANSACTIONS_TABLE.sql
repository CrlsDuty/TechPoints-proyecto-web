-- Check RLS policies on transactions table
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'transactions'
ORDER BY policyname;

-- If no policies show up, we need to create them
-- Create policies to allow authenticated users to INSERT and SELECT their transactions

-- Allow authenticated users to insert transactions
CREATE POLICY "Allow authenticated users to insert own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own transactions
CREATE POLICY "Allow users to view own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = usuario_id OR usuario_id IS NULL);

-- Allow tienda users to view all transactions
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
