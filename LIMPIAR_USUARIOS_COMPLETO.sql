-- Limpiar TODOS los usuarios de test (EXCEPTO los oficiales)
-- EJECUTAR EN: Supabase Dashboard > SQL Editor

-- 1. Ver todos los usuarios actuales
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- 2. Eliminar TODOS los usuarios EXCEPTO los oficiales
-- CUIDADO: Esto es irreversible
DELETE FROM auth.users 
WHERE email NOT IN ('ana@mail.com', 'tienda@mail.com');

-- 3. Verificar que solo quedan los usuarios oficiales
SELECT id, email FROM auth.users;

-- 4. Ver perfiles que quedaron
SELECT id, email, role FROM public.profiles ORDER BY created_at DESC;

-- 5. Ver tiendas que quedaron
SELECT id, owner_id, nombre FROM public.stores ORDER BY created_at DESC;
