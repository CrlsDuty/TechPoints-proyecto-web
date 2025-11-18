-- Trigger: crear perfil al insertar en auth.users
-- Ejecutar en SQL Editor de Supabase (Database -> SQL Editor)

-- 1) Función trigger: inserta en public.profiles cuando se crea un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, nombre, puntos, creado_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, '')::text,
    'cliente', -- el rol por defecto; ajustar según flujo (tienda/admin)
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')::text,
    0,
    now()
  )
  ON CONFLICT (id) DO NOTHING; -- evita duplicados si ya existe perfil

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Trigger sobre auth.users
CREATE TRIGGER auth_user_created_to_profiles
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3) Backfill: crear perfiles para usuarios existentes que no tengan perfil
-- (ejecuta esto una sola vez)
INSERT INTO public.profiles (id, email, role, nombre, puntos, creado_at)
SELECT
  u.id,
  COALESCE(u.email, ''),
  'cliente',
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  0,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 4) Ejemplo para insertar manualmente un perfil (si necesitas hacerlo desde el Table Editor)
-- Sustituye <USER_UUID> por el id que ves en la tabla auth.users
-- IMPORTANTE: usa ON CONFLICT para evitar inserciones duplicadas

-- INSERT INTO public.profiles (id, email, role, nombre, puntos)
-- VALUES ('<USER_UUID>', 'user@mail.com', 'cliente', 'Nombre Apellido', 0)
-- ON CONFLICT (id) DO NOTHING;

-- 5) Consultas de verificación
-- SELECT id, email, role, nombre, puntos, creado_at FROM public.profiles ORDER BY creado_at DESC LIMIT 50;
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 50;

-- Notas:
-- - Si hay usuarios que deben ser 'tienda' o 'admin', tendrás que actualizar su rol en `profiles`
--   y crear la fila correspondiente en `stores` (owner_id = id del usuario) cuando corresponda.
-- - El trigger usa ON CONFLICT DO NOTHING para evitar duplicados si ya existe profile.
-- - Ejecuta primero el backfill y/o el trigger; si ya tienes perfiles manuales verifica que no haya IDs duplicados.
-- - Si prefieres que el cliente cree el `profiles` durante `signUp()` (desde la app), la trigger es útil
--   para cubrir el caso en que creas usuarios desde la consola (Add user) que no pasan por tu frontend.
