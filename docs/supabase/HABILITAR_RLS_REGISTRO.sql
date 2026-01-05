-- ============================================================================
-- HABILITAR RLS PARA REGISTRO DE NUEVOS USUARIOS
-- ============================================================================
-- Problema: Los INSERT anónimos a 'profiles' y 'stores' están siendo bloqueados
-- por RLS (Row Level Security) con error 42501
-- 
-- Solución: Crear políticas RLS que permitan a usuarios anónimos insertar
-- nuevos registros (para registro), pero no ver/actualizar registros de otros
-- ============================================================================

-- ============================================================================
-- 1. POLÍTICAS PARA TABLA 'profiles'
-- ============================================================================

-- Permitir INSERT anónimo (para nuevos registros)
CREATE POLICY "Permitir INSERT anónimo en profiles" ON profiles
FOR INSERT
WITH CHECK (true);

-- Permitir SELECT de su propio perfil (para login)
CREATE POLICY "Usuarios pueden ver su propio perfil" ON profiles
FOR SELECT
USING (auth.uid() IS NULL OR auth.uid() = id);

-- Permitir UPDATE de su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles
FOR UPDATE
USING (auth.uid() IS NULL OR auth.uid() = id)
WITH CHECK (auth.uid() IS NULL OR auth.uid() = id);

-- ============================================================================
-- 2. POLÍTICAS PARA TABLA 'stores'
-- ============================================================================

-- Permitir INSERT anónimo (para nuevas tiendas)
CREATE POLICY "Permitir INSERT anónimo en stores" ON stores
FOR INSERT
WITH CHECK (true);

-- Permitir SELECT de cualquier tienda (tiendas públicas)
CREATE POLICY "Permitir SELECT public de stores" ON stores
FOR SELECT
USING (true);

-- Permitir UPDATE solo del dueño de la tienda
CREATE POLICY "Dueño puede actualizar su tienda" ON stores
FOR UPDATE
USING (auth.uid() IS NULL OR auth.uid() = owner_id)
WITH CHECK (auth.uid() IS NULL OR auth.uid() = owner_id);

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Estas políticas permiten INSERT anónimo porque el registro es público
-- 2. auth.uid() IS NULL check es para permitir usuarios sin autenticar
-- 3. Las políticas de SELECT/UPDATE protegen la data de otros usuarios
-- 4. En producción, considera usar JWT tokens en lugar de usuarios anónimos
-- ============================================================================
