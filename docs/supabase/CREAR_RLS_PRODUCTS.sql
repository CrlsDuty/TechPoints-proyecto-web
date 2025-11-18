-- ========================================================================
-- VERIFICAR Y CREAR RLS POLICIES PARA PRODUCTOS
-- Ejecuta en Supabase SQL Editor
-- ========================================================================

-- 1. Ver políticas actuales en products
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- 2. Si no existen, crear las siguientes políticas:

-- Permitir lectura pública de productos
CREATE POLICY "products_select_public" ON products
  FOR SELECT
  USING (true);

-- Permitir que tienda inserte sus propios productos (usando email desde metadata)
CREATE POLICY "products_insert_own_store" ON products
  FOR INSERT
  WITH CHECK (true);  -- Por ahora permitir; debería validarse en backend

-- Permitir que tienda actualice sus propios productos (RLS permisivo para ahora)
CREATE POLICY "products_update_own_store" ON products
  FOR UPDATE
  USING (true)  -- Por ahora permitir; debería validarse en backend con email
  WITH CHECK (true);

-- Permitir que tienda elimine sus propios productos (RLS permisivo para ahora)
CREATE POLICY "products_delete_own_store" ON products
  FOR DELETE
  USING (true);  -- Por ahora permitir; debería validarse en backend con email

-- 3. Verificar que las políticas fueron creadas
SELECT policyname, permissive FROM pg_policies WHERE tablename = 'products' ORDER BY policyname;
