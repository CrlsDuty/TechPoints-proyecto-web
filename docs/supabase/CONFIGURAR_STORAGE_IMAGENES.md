# Configurar Supabase Storage para Imágenes de Productos

## Paso 1: Crear el Bucket

1. Ve a **Supabase Console** → **Storage**
2. Haz clic en **"Create a new bucket"** (o "New bucket")
3. Nombre del bucket: `product-images`
4. **Desactiva** "Restrict file upload (File size limit in MB)" - deja en blanco o desactiva
5. **IMPORTANTE**: Asegúrate de que el bucket sea **PUBLIC** (marca la opción si está disponible)
6. Haz clic en **"Create bucket"**

## Paso 2: Configurar Políticas RLS

Una vez creado el bucket, ve a la pestaña **"Policies"** del bucket:

### Política 1: Permitir INSERT (uploads) anónimos
```sql
CREATE POLICY "product-images-insert-anon" ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'product-images');
```

**O en la UI de Supabase:**
1. En **Policies** → **New policy** → **For inserts**
2. Template: **Allow insert to only your own files** o custom
3. Condición: `bucket_id = 'product-images'`

### Política 2: Permitir SELECT (lectura) pública
```sql
CREATE POLICY "product-images-select-public" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');
```

**O en la UI:**
1. **New policy** → **For selects**
2. Permite acceso público

### Política 3: Permitir DELETE (eliminación) anónimo
```sql
CREATE POLICY "product-images-delete-anon" ON storage.objects FOR DELETE TO anon
USING (bucket_id = 'product-images');
```

## Paso 3: Configurar CORS (si es necesario)

Si tienes problemas de CORS, ve a **Project Settings** → **CORS** y añade:
```json
{
  "origin": ["http://localhost", "http://localhost:*"],
  "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowedHeaders": ["*"]
}
```

## Verificación

1. Intenta subir una imagen en la app
2. Verifica que aparezca en **Storage** → **product-images**
3. Verifica que el campo `imagen_url` en la tabla `products` contenga la URL pública

## URLs de las imágenes

Las imágenes se guardarán en rutas como:
```
https://nfetcnyhwgimusluxdfj.supabase.co/storage/v1/object/public/product-images/{tienda_uuid}/{product_id}_{timestamp}_{random}.jpg
```

## Solución de problemas

- **Error 403 Forbidden**: Las políticas RLS no están configuradas correctamente
- **Error 404**: El bucket no existe o no está en el nombre correcto
- **CORS error**: Configura CORS en Project Settings

---

**Después de hacer esto, recarga la app y prueba subir una imagen.**
