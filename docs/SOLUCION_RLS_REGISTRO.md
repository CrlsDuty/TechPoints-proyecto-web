# Solución de Problema RLS - Registro de Usuarios

## Problema
Error `42501` - "new row violates row-level security policy for table \"profiles\""

Esto significa que las políticas RLS (Row Level Security) en Supabase están bloqueando los INSERTs anónimos.

## Solución: Habilitar RLS para Registro

### Paso 1: Acceder a Supabase SQL Editor
1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto "TechPoints"
3. Ve a la sección **"SQL Editor"** (en el menú izquierdo)

### Paso 2: Crear las Políticas RLS

Copia y ejecuta este SQL:

```sql
-- HABILITAR INSERT ANÓNIMO EN PROFILES
CREATE POLICY "Permitir INSERT anónimo en profiles" ON profiles
FOR INSERT
WITH CHECK (true);

-- HABILITAR INSERT ANÓNIMO EN STORES  
CREATE POLICY "Permitir INSERT anónimo en stores" ON stores
FOR INSERT
WITH CHECK (true);

-- PERMITIR SELECT ANÓNIMO (para login)
CREATE POLICY "Anónimos pueden leer profiles" ON profiles
FOR SELECT
USING (true);

CREATE POLICY "Anónimos pueden leer stores" ON stores
FOR SELECT
USING (true);
```

### Paso 3: Verificar que funcionó

Ejecuta este SQL para verificar:

```sql
-- Ver todas las políticas RLS en profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Ver todas las políticas RLS en stores
SELECT * FROM pg_policies WHERE tablename = 'stores';
```

Deberías ver al menos estas 4 políticas listadas.

### Paso 4: Probar el Registro

Una vez aplicadas las políticas:
1. Recarga la app
2. Ve a Registro
3. Crea un nuevo usuario
4. Deberías ver "Registro exitoso"

## Por qué funciona así

- **Supabase RLS** por defecto bloquea TODOS los accesos a usuarios anónimos
- El registro necesita permitir INSERTs anónimos porque es un proceso público
- Las políticas arriba permiten INSERT y SELECT pero no UPDATE/DELETE sin autenticar
- Esto proporciona un balance entre seguridad y funcionalidad

## Nota de Seguridad

En producción, deberías:
1. Usar el sistema de Autenticación nativo de Supabase (auth.uid())
2. No permitir INSERTs completamente anónimos
3. Validar datos en el servidor antes de insertarlos
4. Usar JWT tokens para autenticación

Pero para este demo, las políticas anteriores son suficientes.
