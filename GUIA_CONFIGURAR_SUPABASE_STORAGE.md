# 🖼️ Guía: Configurar Supabase Storage para Imágenes de Productos

## Paso 1: Crear el Bucket en Supabase

1. Abre **Supabase Console** → Tu proyecto
2. Ve a la sección **Storage** (en el menú lateral)
3. Haz clic en **"Create a new bucket"**
4. **Nombre del bucket**: `product-images` (EXACTAMENTE así)
5. **Public bucket**: ✅ **SÍ, debe ser PÚBLICO** (para que se vean las imágenes)
6. Haz clic en **Create bucket**

## Paso 2: Configurar Políticas de Acceso (CORS)

El bucket ya debería permitir acceso público para lectura. Para subidas, necesitamos permitir que los usuarios autenticados suban imágenes.

### Opción A: Permitir upload anónimo (SIMPLE - para pruebas)

1. En Storage → `product-images` → Settings
2. Ve a **Policies**
3. Haz clic en **"Create a new policy"**
4. Selecciona **CREATE**
5. Nombre: `Allow anon uploads`
6. En la sección **Target roles**: marca `anon` (usuario anónimo)
7. En **Additional policy roles and conditions**: deja vacío
8. Política SQL:
```sql
CREATE POLICY "Allow anon uploads" ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'product-images');
```
9. Haz clic en **Create policy**

### Opción B: Permitir upload solo a usuarios autenticados (MÁS SEGURO)

1. En Storage → `product-images` → Policies
2. **Create a new policy**
3. Nombre: `Allow authenticated uploads`
4. Target roles: `authenticated`
5. SQL:
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');
```

## Paso 3: Verificar Configuración

Después de crear las políticas, verifica en **Storage** → **Policies**:
- `product-images.public` (lectura pública - automática)
- `product-images_insert_anon` o `product-images_insert_authenticated` (creada)

## Paso 4: Probar Upload de Imágenes

1. En tu navegador, ve a **TechPoints** → **Zona Tienda**
2. En "Agregar Producto", selecciona una imagen
3. Deberías ver un preview de la imagen
4. Cuando hagas clic en "Agregar Producto", la imagen debería:
   - Subirse a Supabase Storage
   - Guardarse como URL en el campo `imagen_url` de la BD
   - Mostrarse en la lista de productos

## ✅ Verificar que Funcionó

1. Ve a **Supabase Console** → **Storage** → **product-images**
2. Deberías ver carpetas con tiendas y archivos de imágenes dentro
3. En la BD (Supabase), la tabla `products` debe tener URLs en `imagen_url` como:
```
https://nfetcnyhwgimusluxdfj.supabase.co/storage/v1/object/public/product-images/uuid/id_timestamp_random.jpg
```

## 🐛 Troubleshooting

### "Bucket no configurado" o "404 not found"

**Causa**: El bucket `product-images` no existe o no está configurado correctamente.

**Solución**:
1. Verifica que el bucket se llama exactamente `product-images`
2. Asegúrate de que es **PUBLIC** (no privado)
3. Intenta crear el bucket de nuevo

### Las imágenes no se ven

**Causa**: URL incorrecta o políticas de CORS incorrectas.

**Solución**:
1. Abre DevTools (F12) → Network
2. Busca la petición GET a la URL de la imagen
3. Si es 403 Forbidden → falta política de lectura pública
4. Si es 404 Not Found → la imagen no se subió correctamente

### Error "403 Forbidden" al subir

**Causa**: No hay política de INSERT configurada.

**Solución**:
- Crea la política de upload (Paso 2, Opción A o B)
- Asegúrate de que coincida con tu tipo de usuario (anon o authenticated)

### Error "CORS"

**Causa**: Política CORS incorrecta en Supabase.

**Solución**:
1. Ve a **Storage** → **Settings**
2. Asegúrate de que CORS está habilitado
3. Verifica que tu dominio local está permitido

## 📝 Código de Ejemplo (si necesitas integración manual)

El código ya está integrado en `ImageStorageService.js`, pero aquí está la lógica:

```javascript
// Subir imagen
const file = document.getElementById('imagenProdFile').files[0];
const result = await ImageStorageService.uploadImage(file, tiendaId, productoId);

if (result.success) {
  console.log('✅ Imagen subida:', result.url);
  // Guardar result.url en la BD
} else {
  console.error('❌ Error:', result.error);
}

// Mostrar imagen
const publicUrl = ImageStorageService.getPublicUrl(storagePath);
```

## 🔐 Seguridad

- Las imágenes son **públicas** (cualquiera puede ver)
- Solo usuarios autenticados pueden subir (según política)
- Los nombres de archivo incluyen UUID para evitar colisiones
- Máximo 5MB por imagen
- Solo formatos: JPEG, PNG, WebP, GIF

## 📊 Próximos Pasos

Una vez configurado:

1. Las imágenes se guardan automáticamente al crear/editar productos
2. Las URLs se almacenan en `products.imagen_url`
3. Al eliminar un producto, la imagen se elimina automáticamente del Storage
4. Los clientes verán las imágenes en la tienda

---

**¿Problemas?** Revisa la consola del navegador (F12) para ver logs detallados con `[ImageStorageService]`
