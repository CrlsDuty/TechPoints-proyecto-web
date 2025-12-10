-- ============================================================================
-- VERIFICAR ESTADO RLS Y POLÍTICAS EXISTENTES
-- ============================================================================

-- Verificar si RLS está habilitado en 'profiles'
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Listar todas las políticas RLS en 'profiles'
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';

-- Listar todas las políticas RLS en 'stores'
SELECT * FROM pg_policies 
WHERE tablename = 'stores';

-- Verificar si RLS está habilitado en 'stores'
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'stores';
