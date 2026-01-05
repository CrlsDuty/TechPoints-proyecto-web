# 🔧 Requisitos de Configuración para Guardar Imágenes

## ❌ Errores Encontrados y Soluciones

### 1. **Error: "Storage no disponible"**
**Causa**: `window.supabase.storage` no está inicializado correctamente

**Solución**: Esto es normal si aún no has creado el bucket. Se mostrará cuando intentes subir.

**Cómo verificar**: Abre DevTools (F12) → Console, escribe:
```javascript
console.log(window.supabase)
console.log(window.supabase.storage)
```

Deberías ver el objeto de storage.

---

### 2. **Error: "HTTP 404: RPC actualizar_producto not found"**
**Causa**: ⚠️ **LA FUNCIÓN RPC NO EXISTE EN SUPABASE**

**Solución URGENTE**: Necesitas crear la función RPC ejecutando este SQL:

#### PASO 1: Ir a Supabase Console
1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto: nfetcnyhwgimusluxdfj
3. Ve a **SQL Editor**

#### PASO 2: Crear la Función RPC
Copia y ejecuta este SQL:

```sql
DROP FUNCTION IF EXISTS actualizar_producto(bigint, text, integer, numeric, integer);

CREATE OR REPLACE FUNCTION actualizar_producto(
  p_id BIGINT,
  p_nombre TEXT DEFAULT NULL,
  p_costo_puntos INTEGER DEFAULT NULL,
  p_precio_dolar NUMERIC DEFAULT NULL,
  p_stock INTEGER DEFAULT NULL,
  p_descripcion TEXT DEFAULT NULL,
  p_imagen_url TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  producto_id BIGINT,
  producto_nombre TEXT
) AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM products WHERE id = p_id;
  IF v_count = 0 THEN
    RETURN QUERY SELECT false, 'Producto no encontrado'::TEXT, p_id, ''::TEXT;
    RETURN;
  END IF;
  
  UPDATE products
  SET 
    nombre = COALESCE(p_nombre, nombre),
    costo_puntos = COALESCE(p_costo_puntos, costo_puntos),
    precio_dolar = COALESCE(p_precio_dolar, precio_dolar),
    descripcion = COALESCE(p_descripcion, descripcion),
    imagen_url = COALESCE(p_imagen_url, imagen_url),
    stock = COALESCE(p_stock, stock),
    actualizado_at = NOW()
  WHERE id = p_id;
  
  RETURN QUERY SELECT 
    true, 
    'Producto actualizado correctamente'::TEXT, 
    p_id, 
    COALESCE(p_nombre, (SELECT nombre FROM products WHERE id = p_id))::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### PASO 3: Verificar que Funcionó
Ejecuta esta prueba:
```sql
SELECT * FROM actualizar_producto(
  1,
  'Test Producto',
  500,
  25.99,
  10,
  'Descripción test',
  'https://ejemplo.com/imagen.jpg'
);
```

Deberías ver resultado: `success: true`

---

### 3. **Error: "ReferenceError: imagen is not defined"**
**Causa**: Variable mal nombrada en el fallback de localStorage

**Solución**: ✅ **YA ARREGLADO** en productService.js línea 692

---

## 📋 CHECKLIST ANTES DE PROBAR

- [ ] **Crear bucket** en Supabase Storage
  - Nombre: `product-images`
  - Tipo: PUBLIC
  
- [ ] **Crear política** de upload
  ```sql
  CREATE POLICY "Allow anon uploads" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'product-images');
  ```

- [ ] **Crear función RPC** `actualizar_producto`
  - SQL arriba ↑

- [ ] **Verificar** en Supabase → Functions
  - Deberías ver `actualizar_producto` listada

---

## 🧪 Probar Después de Configurar

1. **En Tienda** → **Editar Producto** (sin cambiar imagen)
   - Debería funcionar si la RPC existe
   
2. **En Tienda** → **Editar Producto** (con nueva imagen)
   - Si Storage está configurado, debería subir imagen
   - Si no, continuará sin error

3. **Revisar logs** en DevTools Console
   - Deberías ver: `✅ Imagen subida` (si todo bien)
   - O: `⚠️ Storage no disponible` (si falta bucket)

---

## ✅ Una vez configurado todo:

✔️ Las imágenes se suben a Supabase Storage
✔️ Los productos se actualizan en BD
✔️ Las URLs se guardan correctamente
✔️ El sistema fallback funciona si algo falla

