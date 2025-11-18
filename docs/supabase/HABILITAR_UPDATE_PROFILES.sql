-- ========================================================================
-- POLÍTICAS RLS PERMISIVAS PARA PROFILES (Puntos)
-- Ejecuta este script en el SQL Editor de Supabase Console
-- ========================================================================

-- Crear política permisiva que permite UPDATE en profiles sin auth.uid()
CREATE POLICY "profiles_update_anonymous" ON profiles FOR UPDATE
USING (true)
WITH CHECK (true);

-- ========================================================================
-- VERIFICACIÓN: Ejecuta esta query para confirmar las políticas
-- ========================================================================
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
