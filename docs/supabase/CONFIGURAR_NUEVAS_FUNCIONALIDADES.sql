-- ==================================================
-- CONFIGURACIÓN PARA NUEVAS FUNCIONALIDADES
-- ==================================================

-- 1. Agregar campo avatar_url a la tabla profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Crear política RLS para avatars (si el bucket ya existe)
-- NOTA: Primero debes crear el bucket 'avatars' en Supabase Storage:
-- - Ve a Storage en tu proyecto de Supabase
-- - Click en "Create bucket"
-- - Nombre: avatars
-- - Public: true (para que las URLs sean públicas)
-- - Click en "Create bucket"

-- Después ejecuta estas políticas:

-- Permitir que los usuarios suban su propio avatar
CREATE POLICY "Usuarios pueden subir su avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que los usuarios actualicen su avatar
CREATE POLICY "Usuarios pueden actualizar su avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que todos lean los avatars (son públicos)
CREATE POLICY "Avatars son públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permitir que los usuarios borren su avatar
CREATE POLICY "Usuarios pueden borrar su avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Verificar que la tabla profiles permita updates en avatar_url
-- (Esto debería estar permitido por las políticas RLS existentes)
