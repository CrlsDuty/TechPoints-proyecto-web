# Correcciones Aplicadas - Puntos No Cargando desde Supabase

## Problema Identificado
Los puntos del usuario no se cargaban desde Supabase, mostrando siempre el valor en cache (150) en lugar de los 2000 configurados en la tabla `profiles`.

## Causas Raíz

### 1. **RLS Policy Issue**
El problema principal: la política RLS en la tabla `profiles` es:
```sql
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
USING (auth.uid() = id);
```

Esta política permite que un usuario vea **solo su propia fila** comparando `auth.uid()` (su UUID en auth.users) con la columna `id` de profiles.

**Lo que estaba mal:** Se intentaba filtrar por `email` en lugar de por `id`:
```javascript
.eq('email', usuario.email)  // ❌ No funciona con RLS
```

La consulta se construía como: `SELECT * FROM profiles WHERE email = 'ana@mail.com'`
- Aunque la fila existe, Supabase verifica la RLS policy PRIMERO
- La policy compara `auth.uid()` (UUID del usuario autenticado) con `id` (UUID de la fila)
- Si la fila es del usuario autenticado, coincide → se devuelve
- Si NO coincide (o no hay fila que coincida), se devuelve vacío

**La solución:** Filtrar por `id` en lugar de por `email`:
```javascript
const authResult = window.supabase.auth.getUser();
const authUser = authResult && authResult.data && authResult.data.user;
const userId = authUser && authUser.id;

if (userId) {
  window.supabase
    .from('profiles')
    .select('puntos, email')
    .eq('id', userId)  // ✅ Funciona con RLS
    .then((res) => { ... });
}
```

Así: `SELECT * FROM profiles WHERE id = '<uuid_del_usuario_autenticado>'`
- La RLS policy verifica: ¿`auth.uid()` = `id`? Sí → devuelve la fila

### 2. **URL Encoding en Filtros**
Los filtros de string en el bundle local no estaban siendo URL-encoded correctamente.

**Lo que estaba mal:**
```javascript
// Para strings: column=operator."value" (sin codificar)
encodedFilter = `${filter.column}=${filter.operator}."${filterValue}"`;
// Resultado: email=eq."ana@mail.com"
// @ no está codificado → puede causar problemas en algunos servidores
```

**La solución:** URL-encode el valor dentro de las comillas:
```javascript
// Para strings: column=operator."value" (con encoding)
encodedFilter = `${filter.column}=${filter.operator}."${encodeURIComponent(filterValue)}"`;
// Resultado: email=eq."ana%40mail.com"
// @ se codifica a %40 → compatible con PostgREST
```

## Cambios Realizados

### 1. `assets/js/app.js` - `actualizarInfoCliente()`
- ✅ Ahora obtiene el UUID del usuario autenticado usando `window.supabase.auth.getUser()`
- ✅ Filtra profiles por `id` en lugar de por `email`
- ✅ Agrega logging detallado para debug
- ✅ Parsea puntos como `parseInt()` para garantizar número entero

**Código anterior (no funcionaba):**
```javascript
window.supabase
  .from('profiles')
  .select('puntos')
  .eq('email', usuario.email)  // ❌ Bloqueado por RLS
  .then((res) => { ... });
```

**Código nuevo (funciona):**
```javascript
const authResult = window.supabase.auth.getUser();
const authUser = authResult && authResult.data && authResult.data.user;
const userId = authUser && authUser.id;

if (userId) {
  window.supabase
    .from('profiles')
    .select('puntos, email')
    .eq('id', userId)  // ✅ Pasa RLS policy
    .then((res) => { ... });
}
```

### 2. `assets/vendor/supabase.min.js` - `_buildUrl()`
- ✅ URL-encode ahora los valores de string en filtros
- ✅ Mantiene el formato PostgREST correcto: `column=operator."encodedvalue"`

**Código anterior:**
```javascript
encodedFilter = `${filter.column}=${filter.operator}."${filterValue}"`;
```

**Código nuevo:**
```javascript
encodedFilter = `${filter.column}=${filter.operator}."${encodeURIComponent(filterValue)}"`;
```

## Qué Esperar Después de Recarga

1. **Al hacer login** e ir a `cliente.html`:
   - Deberías ver tu email en el header
   - La consulta Supabase debería devolver tus puntos (2000 para ana@mail.com)
   - Console mostrará: `[App] Puntos cargados de Supabase: 2000 para usuario: ana@mail.com`
   - La interfaz actualizará: `💰 Puntos disponibles: 2000`

2. **Logs esperados en console:**
   ```
   [App] Current auth user: {id: "...", email: "ana@mail.com", ...}
   [App] Current user ID: "550e8400-e29b-41d4-a716-446655440000"
   [Supabase Query] URL: https://nfetcnyhwgimusluxdfj.supabase.co/rest/v1/profiles?select=puntos%2Cemail&id=eq."550e8400-e29b-41d4-a716-446655440000"
   [Supabase Query] Response data count: 1
   [App] Profiles query by ID response: {data: [{puntos: 2000, email: "ana@mail.com"}], error: null}
   [App] Puntos cargados de Supabase: 2000
   ```

3. **Si falla:**
   - Console mostrará el error en `[App] Error cargando puntos:`
   - El UI mostrará puntos en fallback (valor en cache)
   - Verifica:
     - ¿Usuario logueado correctamente?
     - ¿`auth.getUser()` devuelve un objeto con `id`?
     - ¿La fila existe en `profiles` para este usuario?
     - ¿El token tiene permisos? (revisa Supabase > Auth Settings > JWT expiration)

## Verificación Manual en Supabase

Para confirmar que la RLS policy funciona:

1. En **Supabase Console > SQL Editor**, ejecuta:
   ```sql
   -- Ver la fila del usuario
   SELECT id, email, puntos FROM profiles WHERE email = 'ana@mail.com';
   
   -- Verifica que el UUID coincida con el usuario en auth.users
   SELECT id, email FROM auth.users WHERE email = 'ana@mail.com';
   ```

2. Si quieres testear la RLS policy directamente:
   - Ve a **Table Editor > profiles**
   - Asegúrate de estar logueado en Supabase como `ana@mail.com`
   - Deberías ver tu fila en la tabla (no las de otros usuarios)
   - Si no ves nada, es un problema de RLS

## Próximos Pasos
1. ✅ Recarga la página y verifica que puntos = 2000
2. ⏭️ Luego testearemos el flujo de canjes (redeem products)
3. ⏭️ Y agregar puntos desde tiendas
