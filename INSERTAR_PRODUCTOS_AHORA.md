# 🚀 INSTRUCCIONES RÁPIDAS - Insertar Productos Demo

## ⚡ Pasos (5 minutos)

### 1. Ir a Supabase Dashboard
Abre: https://supabase.com/dashboard

### 2. Abrir SQL Editor
- Selecciona tu proyecto: `nfetcnyhwgimusluxdfj`
- Ve a **SQL Editor** (icono de consola en el menú izquierdo)
- Click en **New Query**

### 3. Copiar y Ejecutar este SQL

```sql
-- ========================================================================
-- INSERTAR PRODUCTOS DEMO - RÁPIDO
-- ========================================================================

-- PASO 1: Verificar que existe la tienda (debe retornar una fila)
SELECT id, owner_id, nombre FROM stores;

-- PASO 2: Si NO existe tienda, crear una para tienda@mail.com
INSERT INTO stores (owner_id, nombre, descripcion, contacto)
SELECT 
  u.id,
  'TechStore Demo',
  'Tienda de tecnología oficial',
  jsonb_build_object(
    'telefono', '+56 9 1234 5678',
    'direccion', 'Av. Tecnológica 123',
    'horario', 'Lun-Vie 9:00-18:00'
  )
FROM auth.users u
WHERE u.email = 'tienda@mail.com'
AND NOT EXISTS (SELECT 1 FROM stores WHERE owner_id = u.id);

-- PASO 3: Insertar productos demo
INSERT INTO products (tienda_id, nombre, descripcion, categoria, costo_puntos, precio_dolar, stock, imagen_url)
SELECT 
  s.id,
  p.nombre,
  p.descripcion,
  p.categoria,
  p.costo_puntos,
  p.precio_dolar,
  p.stock,
  p.imagen_url
FROM stores s
CROSS JOIN (
  VALUES 
    ('Laptop Gaming ASUS ROG', 'Laptop de alto rendimiento para gaming y desarrollo. Procesador Intel i7, 16GB RAM, RTX 3060', 'Electrónica', 50000, 1299.99, 5, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400'),
    ('Mouse Logitech MX Master 3', 'Mouse inalámbrico profesional de precisión con diseño ergonómico', 'Periféricos', 10000, 99.99, 20, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'),
    ('Teclado Mecánico RGB Corsair', 'Teclado mecánico gaming con switches Cherry MX e iluminación RGB', 'Periféricos', 15000, 149.99, 15, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400'),
    ('Monitor Samsung 27" 4K', 'Monitor profesional 4K UHD de 27 pulgadas con HDR', 'Electrónica', 35000, 399.99, 8, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'),
    ('Auriculares Sony WH-1000XM5', 'Auriculares inalámbricos con cancelación de ruido premium', 'Accesorios', 28000, 349.99, 12, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400'),
    ('SSD Samsung 1TB NVMe', 'Disco sólido de 1TB con velocidades de lectura hasta 7000MB/s', 'Componentes', 12000, 129.99, 25, 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400'),
    ('Webcam Logitech C920', 'Cámara web Full HD 1080p para videoconferencias profesionales', 'Periféricos', 8000, 79.99, 18, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400'),
    ('Router WiFi 6 TP-Link', 'Router de alta velocidad WiFi 6 AX3000 para gaming', 'Redes', 18000, 179.99, 10, 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400')
) AS p(nombre, descripcion, categoria, costo_puntos, precio_dolar, stock, imagen_url)
WHERE s.owner_id = (SELECT id FROM auth.users WHERE email = 'tienda@mail.com');

-- PASO 4: Verificar que se insertaron
SELECT 
  p.id,
  p.nombre,
  p.categoria,
  p.costo_puntos,
  p.stock,
  s.nombre as tienda
FROM products p
JOIN stores s ON p.tienda_id = s.id
ORDER BY p.creado_at DESC;
```

### 4. Click en **RUN** (o Ctrl+Enter)

Deberías ver:
- ✅ 8 productos insertados
- ✅ En la última query, ver la lista de productos

### 5. Refrescar la aplicación

Vuelve a http://localhost:5174/ y verás los productos en el catálogo.

---

## 🆘 Si hay error "permission denied"

Ejecuta primero esto:

```sql
-- Dar permisos completos temporalmente
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Luego ejecuta el script de arriba

-- Al final, vuelve a habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Listo!

Ahora tu catálogo tendrá 8 productos listos para la demostración.
