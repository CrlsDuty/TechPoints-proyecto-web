# Guía: Insertar Tiendas y Productos Manualmente (Table Editor)

## 1. Insertar Tienda para Usuario "tienda@mail.com"

### Paso 1: Obtén el UUID del usuario tienda
1. En Supabase Console, ve a **Authentication → Users**
2. Busca `tienda@mail.com` y copia su **UUID** (verás algo como `a1b2c3d4-e5f6-...`)
3. Guárdalo, lo necesitarás en los siguientes pasos

### Paso 2: Ir a Table Editor
1. En Supabase Console, ve a **Table Editor** (lado izquierdo)
2. Selecciona la tabla **stores**

### Paso 3: Insertar nueva fila
1. Click en botón **+ Insert** (esquina superior derecha)
2. Completa los campos:
   - **id**: déjalo vacío (se genera automáticamente con `gen_random_uuid()`)
   - **owner_id**: pega el UUID del usuario tienda@mail.com (copiado en Paso 1)
   - **nombre**: `TechStore Demo` (o el nombre que prefieras)
   - **descripcion**: `Tu tienda de tecnología de confianza` (opcional)
   - **contacto**: pega esto (es JSON):
     ```json
     {"telefono": "+56 9 1234 5678", "horario": "Lun-Vie 9:00-18:00"}
     ```
   - **creado_at** y **actualizado_at**: déjalos vacíos (se auto-rellenan con `now()`)

3. Click en **Save row** (o **Save** al pie de la ventana)

**Resultado esperado:** verás la fila insertada con un UUID generado automáticamente en la columna `id`.

---

## 2. Insertar Productos para la Tienda

### Paso 1: Obtén el ID de la tienda que acabas de crear
1. Aún en **Table Editor → stores**, verás la fila que insertaste
2. Copia el valor de la columna **id** (UUID generado automáticamente)

### Paso 2: Ir a la tabla products
1. En **Table Editor**, selecciona la tabla **products**

### Paso 3: Insertar productos (repite para cada uno)
Click en **+ Insert** e ingresa:

#### Producto 1: Mouse Gaming
- **id**: déjalo vacío (auto-incrementa)
- **tienda_id**: pega el UUID de la tienda (copiado arriba)
- **nombre**: `Mouse Gamer RGB`
- **descripcion**: `Mouse gaming de alta precisión con 7200 DPI`
- **categoria**: `accesorios`
- **costo_puntos**: `500`
- **precio_dolar**: `25.00`
- **stock**: `10`
- **imagen_url**: déjalo vacío (o pega una URL si tienes)
- Click **Save row**

#### Producto 2: Teclado Mecánico
- **id**: déjalo vacío
- **tienda_id**: UUID de la tienda
- **nombre**: `Teclado Mecánico RGB`
- **descripcion**: `Teclado con switches Cherry MX azules`
- **categoria**: `periféricos`
- **costo_puntos**: `800`
- **precio_dolar**: `40.00`
- **stock**: `5`
- **imagen_url**: vacío
- Click **Save row**

#### Producto 3: Auriculares Gaming
- **id**: déjalo vacío
- **tienda_id**: UUID de la tienda
- **nombre**: `Auriculares Gaming 7.1`
- **descripcion**: `Sonido envolvente con micrófono de cancelación de ruido`
- **categoria**: `audio`
- **costo_puntos**: `600`
- **precio_dolar**: `30.00`
- **stock**: `8`
- **imagen_url**: vacío
- Click **Save row**

---

## 3. Verificación

### En Supabase Console:
1. Ve a **Table Editor → stores** → Confirma que ves 1 fila (la tienda)
2. Ve a **Table Editor → products** → Confirma que ves 3 filas (los 3 productos)

### Opcional: Verificar con SQL
En **SQL Editor**, ejecuta:
```sql
-- Ver tiendas
SELECT id, owner_id, nombre, descripcion FROM public.stores;

-- Ver productos
SELECT id, tienda_id, nombre, costo_puntos, precio_dolar, stock FROM public.products;
```

---

## 4. Agregar Puntos al Cliente "ana@mail.com" (Opcional)

Si quieres que el cliente tenga puntos para probar canjes:

1. Ve a **Table Editor → profiles**
2. Busca la fila con `email = 'ana@mail.com'`
3. Haz click en el campo **puntos** y cámbialo (ej: de `0` a `2000`)
4. Click **Save** (o se guarda automáticamente)

**Alternativa SQL:**
```sql
UPDATE public.profiles
SET puntos = 2000
WHERE email = 'ana@mail.com';
```

---

## 5. Configurar Rol de Usuario Tienda (Opcional)

Por defecto, todos los usuarios se crean con `role = 'cliente'`. Si quieres que `tienda@mail.com` sea una tienda:

1. Ve a **Table Editor → profiles**
2. Busca la fila con `email = 'tienda@mail.com'`
3. Haz click en el campo **role** y cámbialo a `tienda`
4. Click **Save**

**Alternativa SQL:**
```sql
UPDATE public.profiles
SET role = 'tienda'
WHERE email = 'tienda@mail.com';
```

---

## ✅ Resumen

Tras completar estos pasos, tendrás:
- ✅ 2 usuarios autenticados (cliente + tienda)
- ✅ 1 tienda con 3 productos
- ✅ Cliente con puntos disponibles (si lo configuraste)

**Siguiente paso:** prueba la app:
1. Abre `index.html` en el navegador
2. Login como `ana@mail.com` / `1234`
3. Deberías ver los productos disponibles
4. Intenta hacer un canje (si tienes puntos suficientes)

