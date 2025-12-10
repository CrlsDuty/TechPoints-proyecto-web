-- ============================================================================
-- LIMPIAR POLÍTICAS RLS CONFLICTIVAS
-- ============================================================================
-- Problema: La política 'profiles_insert_own' y 'stores_insert_own' 
-- requieren auth.uid() = id, lo que falla para usuarios anónimos
-- 
-- Solución: Eliminar esas políticas específicas que están en conflicto
-- ============================================================================

-- Eliminar la política que requiere autenticación
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Eliminar la política que requiere autenticación en stores
DROP POLICY IF EXISTS "stores_insert_own" ON stores;

-- Verificar que quedaron las políticas correctas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'stores')
ORDER BY tablename, policyname;
