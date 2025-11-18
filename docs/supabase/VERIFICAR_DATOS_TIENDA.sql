-- ========================================================================
-- VERIFICAR DATOS DE LA TIENDA
-- Ejecuta en Supabase SQL Editor
-- ========================================================================

-- 1. Ver perfil de tienda@mail.com
SELECT id, email, role, nombre, puntos FROM profiles WHERE email = 'tienda@mail.com';

-- 2. Ver datos de la tienda (stores)
SELECT id, owner_id, nombre, descripcion, contacto FROM stores 
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'tienda@mail.com');

-- 3. Si no hay tienda, crear una
INSERT INTO stores (owner_id, nombre, descripcion, contacto)
SELECT 
  p.id,
  'TechStore Demo',
  'Tienda de tecnología de demostración',
  jsonb_build_object(
    'telefono', '+56 9 1234 5678',
    'direccion', 'Calle Principal 123, Piso 2',
    'horario', 'Lun-Vie 9:00-18:00, Sab 10:00-14:00',
    'responsable', 'Gerente de Tienda'
  )
FROM profiles p
WHERE p.email = 'tienda@mail.com'
AND NOT EXISTS (
  SELECT 1 FROM stores WHERE owner_id = p.id
);

-- 4. Verificar nuevamente
SELECT 'Verificación Final:' as paso;
SELECT 
  p.email,
  p.role,
  s.nombre as tienda_nombre,
  s.contacto->>'telefono' as telefono,
  s.contacto->>'direccion' as direccion,
  s.contacto->>'horario' as horario,
  s.contacto->>'responsable' as responsable
FROM profiles p
LEFT JOIN stores s ON p.id = s.owner_id
WHERE p.email = 'tienda@mail.com';
