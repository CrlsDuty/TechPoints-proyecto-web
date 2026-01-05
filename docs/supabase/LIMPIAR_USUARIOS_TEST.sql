-- Limpiar usuarios de test que tienen problemas
-- EJECUTAR EN: Supabase Dashboard > SQL Editor

-- 1. Ver los usuarios en auth.users
SELECT id, email, created_at FROM auth.users WHERE email LIKE '%user-test%' ORDER BY created_at DESC;

-- 2. Eliminar usuarios duplicados (CUIDADO: esto elimina de auth.users)
-- Supabase controla automáticamente las restricciones de FK, así que eliminar de auth.users
-- también eliminará los perfiles asociados

DELETE FROM auth.users 
WHERE email LIKE '%user-test%' 
AND email NOT LIKE '%debug%';

-- 3. Verificar que se eliminaron
SELECT id, email FROM auth.users WHERE email LIKE '%user-test%';

-- 4. Ver perfiles que quedan (debería estar vacío si el FK funcionó)
SELECT id, email, role FROM public.profiles 
WHERE email LIKE '%user-test%' 
AND email NOT LIKE '%debug%';

-- Si necesitas eliminar perfiles específicos manualmente:
-- DELETE FROM public.profiles WHERE email = 'user-test00221@gmail.com';
-- DELETE FROM public.profiles WHERE email = 'user-test0022@gmail.com';
