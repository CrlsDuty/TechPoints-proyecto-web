# Fix RLS para Redemptions en Supabase

## Problema
La tabla `redemptions` tiene RLS habilitado pero sin políticas que permitan inserts anónimos (usuarios sin autenticación).

Error:
```
401 (Unauthorized)
"new row violates row-level security policy for table \"redemptions\""
```

## Solución: Crear Políticas RLS Permisivas

Ejecuta este script en **Supabase Console > SQL Editor**:

```sql
-- ========================================
-- POLÍTICAS RLS PARA REDEMPTIONS
-- ========================================

-- 1. Permitir SELECT (lectura) sin autenticación
CREATE POLICY "redemptions_select_anonymous" ON redemptions
  FOR SELECT
  USING (true);

-- 2. Permitir INSERT (escritura) sin autenticación
CREATE POLICY "redemptions_insert_anonymous" ON redemptions
  FOR INSERT
  WITH CHECK (true);

-- 3. Permitir UPDATE (actualización) sin autenticación
CREATE POLICY "redemptions_update_anonymous" ON redemptions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Permitir DELETE (eliminación) sin autenticación
CREATE POLICY "redemptions_delete_anonymous" ON redemptions
  FOR DELETE
  USING (true);

-- ========================================
-- Verifica que las políticas fueron creadas
-- ========================================
SELECT * FROM pg_policies WHERE tablename = 'redemptions';
```

## Pasos

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **TechPoints**
3. En el menú izquierdo: **SQL Editor**
4. Copia y ejecuta el script anterior
5. Verifica que aparezcan 4 políticas nuevas

## Después de ejecutar

- Cierra sesión en la app
- Vuelve a iniciar sesión
- Intenta canjear un producto nuevamente
- Los redemptions deberían registrarse correctamente

## Si algo sale mal

Si ves errores al ejecutar:

```sql
-- Opción 1: Ver todas las políticas actuales
SELECT * FROM pg_policies WHERE tablename IN ('redemptions', 'products', 'profiles');

-- Opción 2: Eliminar política duplicada (si existe)
DROP POLICY IF EXISTS "redemptions_insert_anonymous" ON redemptions;

-- Opción 3: Habilitar RLS si está deshabilitado
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
```

## Verificación Final

Una vez aplicadas las políticas:

1. **En la app:**
   - Canjea un producto
   - Debería aparecer en el historial
   - Console debería mostrar: `✅ Redemption registrado en Supabase`

2. **En Supabase:**
   - Ve a: **SQL Editor**
   - Ejecuta: `SELECT * FROM redemptions ORDER BY creado_at DESC LIMIT 10;`
   - Debería mostrar los canjes que realizaste
