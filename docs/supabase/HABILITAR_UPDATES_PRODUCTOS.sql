-- ========================================================================
-- POLÍTICA RLS PERMISIVA PARA ACTUALIZACIONES DE PRODUCTOS
-- Ejecuta este script en el SQL Editor de Supabase Console
-- ========================================================================

-- IMPORTANTE: Esta política es necesaria porque usamos database-direct login
-- (no usamos Supabase Auth), por lo que auth.uid() siempre es NULL

-- Crear política permisiva que permite UPDATE en products
-- sin requerir auth.uid() (ya que no tenemos sesión de auth)
CREATE POLICY "products_update_anonymous" ON products FOR UPDATE
USING (true)
WITH CHECK (true);

-- También permitir INSERT para que la tienda pueda crear productos
CREATE POLICY "products_insert_anonymous" ON products FOR INSERT
WITH CHECK (true);

-- También permitir DELETE para que la tienda pueda eliminar productos
CREATE POLICY "products_delete_anonymous" ON products FOR DELETE
USING (true);

-- ========================================================================
-- VERIFICACIÓN: Ejecuta esta query para confirmar las políticas
-- ========================================================================
-- SELECT * FROM pg_policies WHERE tablename = 'products';
