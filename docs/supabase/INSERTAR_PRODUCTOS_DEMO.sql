-- ========================================================================
-- INSERTAR PRODUCTOS DEMO
-- Ejecuta esto en Supabase SQL Editor
-- ========================================================================

-- 1. Primero, verificar que tienda@mail.com existe y tiene store
SELECT id, owner_id, nombre FROM stores;

-- 2. Si no hay store, crearla
INSERT INTO stores (owner_id, nombre, descripcion, contacto, creado_at, actualizado_at)
SELECT 
  u.id,
  'TechStore Demo',
  'Tienda de tecnología de demostración',
  jsonb_build_object(
    'telefono', '+56 9 0000 0000',
    'direccion', 'Av. Demo 123',
    'horario', 'Lun-Vie 9:00-18:00',
    'responsable', 'Administrador'
  ),
  now(),
  now()
FROM auth.users u
WHERE u.email = 'tienda@mail.com'
AND NOT EXISTS (SELECT 1 FROM stores WHERE owner_id = u.id);

-- 3. Obtener el store_id (tienda_id para products)
SELECT id as store_id FROM stores 
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'tienda@mail.com')
LIMIT 1;

-- 4. Insertar 3 productos DEMO (reemplaza store_id con el valor del paso 3)
-- ⚠️ IMPORTANTE: Reemplaza 'YOUR_STORE_ID' con el UUID que obtuviste en el paso 3
INSERT INTO products (tienda_id, nombre, descripcion, categoria, costo_puntos, precio_dolar, stock, imagen_url, creado_at, actualizado_at)
SELECT 
  id as tienda_id,
  * 
FROM (
  VALUES 
    ('Laptop Gaming ASUS', 'Laptop de alto rendimiento para gaming y desarrollo', 'Electrónica', 500, 1299.99, 5),
    ('Mouse Logitech MX Master', 'Mouse inalámbrico profesional de precisión', 'Periféricos', 100, 99.99, 20),
    ('Teclado Mecánico RGB', 'Teclado mecánico con switches Cherry MX', 'Periféricos', 250, 199.99, 10)
) AS product_data(nombre, descripcion, categoria, costo_puntos, precio_dolar, stock)
CROSS JOIN (
  SELECT id FROM stores 
  WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'tienda@mail.com')
) store;

-- 5. Verificar que se insertaron
SELECT id, nombre, costo_puntos, stock FROM products ORDER BY creado_at DESC LIMIT 3;

-- 6. Verificar que se ven correctamente (query pública)
SELECT 
  p.id,
  p.nombre,
  p.descripcion,
  p.costo_puntos,
  p.stock,
  s.nombre as tienda_nombre
FROM products p
JOIN stores s ON p.tienda_id = s.id
ORDER BY p.creado_at DESC
LIMIT 5;
