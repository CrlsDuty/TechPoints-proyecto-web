-- ========================================================================
-- VERIFICAR Y CONFIGURAR USUARIO TIENDA
-- Ejecuta esto en Supabase SQL Editor
-- ========================================================================

-- PASO 1: Verificar si existe el usuario tienda@mail.com
SELECT 
  u.id as user_id,
  u.email,
  p.role,
  p.nombre,
  s.id as store_id,
  s.nombre as store_nombre
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN stores s ON u.id = s.owner_id
WHERE u.email = 'tienda@mail.com';

-- PASO 2: Si el usuario NO existe en profiles, agregarlo
INSERT INTO profiles (id, email, role, nombre, puntos)
SELECT 
  u.id,
  u.email,
  'tienda',
  'Tienda Admin',
  0
FROM auth.users u
WHERE u.email = 'tienda@mail.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- PASO 3: Si el usuario existe pero tiene rol incorrecto, actualizarlo
UPDATE profiles
SET role = 'tienda',
    nombre = COALESCE(nombre, 'Tienda Admin')
WHERE email = 'tienda@mail.com'
AND role != 'tienda';

-- PASO 4: Verificar nuevamente
SELECT 
  u.id as user_id,
  u.email,
  p.role,
  p.nombre,
  p.puntos,
  s.id as store_id,
  s.nombre as store_nombre
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN stores s ON u.id = s.owner_id
WHERE u.email = 'tienda@mail.com';

-- PASO 5: Verificar que la tienda (store) existe
SELECT id, owner_id, nombre, descripcion 
FROM stores 
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'tienda@mail.com');

-- RESULTADO ESPERADO:
-- user_id: (UUID)
-- email: tienda@mail.com
-- role: tienda
-- nombre: Tienda Admin
-- store_id: (UUID si existe)
-- store_nombre: TechStore Demo (o similar)

-- ✅ Si store_id es NULL, significa que falta crear la tienda.
--    El script INSERTAR_PRODUCTOS_AHORA.md ya crea la tienda automáticamente.
