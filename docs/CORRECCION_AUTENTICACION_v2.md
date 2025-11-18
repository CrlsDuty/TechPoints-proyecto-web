# Correcciones Aplicadas - Autenticación y Carga de Puntos v2

## Resumen del Problema
El usuario no podía ver sus puntos cargados desde Supabase después de hacer login. Console mostraba:
```
[App] Current auth user: null
[App] Current user ID: null
[App] No user ID found in session
```

Los puntos permanecían en el valor cacheado (150) en lugar de cargar los 2000 de Supabase.

---

## Problemas Identificados y Solucionados

### 1. **Login No Usaba Supabase - Estaba usando Fallback Local**
**Problema:** El código de login en `app.js` llamaba a `AuthService.validarLogin()` que solo valida contra localStorage, nunca intentaba autenticarse con Supabase.

**Solución:** Cambiar a `await AuthService.signIn()` que:
- Intenta primero autenticarse con Supabase
- Si Supabase no está disponible, cae al fallback local
- Guarda el `access_token` en localStorage bajo clave `'sb-auth-token'`

**Archivo:** `assets/js/app.js` - Función `inicializarLogin()`

---

### 2. **Bundle Local No Tenía .single() - Crítico para AuthService.signIn()**
**Problema:** `AuthService.signIn()` llama a `.single()` para obtener el perfil del usuario, pero el bundle local no implementaba este método.

**Solución:** Agregué método `.single()` al bundle:
```javascript
single() {
  this._limitCount = 1;
  this._singleMode = true;
  return this;
}
```

Cuando `_singleMode = true`, `_execute()` retorna un objeto en lugar de un array:
```javascript
// En _execute():
if (this._singleMode) {
  data = data.length > 0 ? data[0] : null;
}
```

**Archivo:** `assets/vendor/supabase.min.js` - Clase `PostgrestQueryBuilder`

---

### 3. **Access Token No Se Usaba en Queries Posteriores**
**Problema:** Después de `signInWithPassword()`, el bundle guardaba el `access_token` en `SupabaseAuthClient._session`, pero las queries posteriores (como `SELECT from profiles`) seguían usando solo el `anonKey`, no el JWT del usuario autenticado.

**Solución:** 
1. Agregué método `_getCurrentAuthToken()` al `SupabaseClient`:
   ```javascript
   _getCurrentAuthToken() {
     const session = this.auth._session;
     if (session && session.access_token) {
       return session.access_token;  // ← JWT del usuario autenticado
     }
     return this._anonKey;  // ← Fallback a clave anónima
   }
   ```

2. Modificar `from()` y `rpc()` para usar el token actual:
   ```javascript
   from(table) {
     this.db.authToken = this._getCurrentAuthToken();  // ← Actualizar token antes de query
     return this.db.from(table);
   }
   ```

**Archivo:** `assets/vendor/supabase.min.js` - Clase `SupabaseClient`

**Impacto:** Ahora cuando se hace una query, el JWT incluido en el header `Authorization: Bearer <token>` permite que Supabase valide la RLS policy `auth.uid() = id` correctamente.

---

### 4. **Sesión No Se Recuperaba Correctamente de localStorage**
**Problema:** Cuando el bundle cargaba la sesión desde localStorage, intentaba acceder a `_session.user`, pero algunos responses de Supabase auth no incluyen el objeto `user`. Esto dejaba `_user = null`.

**Solución:** Mejoré `_loadFromStorage()` para parsear el JWT y extraer info:
```javascript
_loadFromStorage() {
  // ... carga _session desde localStorage ...
  
  if (this._session?.access_token) {
    if (this._session?.user) {
      this._user = this._session.user;
    } else {
      // Parse JWT payload sin validar firma (solo para cliente local)
      const parts = this._session.access_token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        this._user = { id: payload.sub, email: payload.email };
      }
    }
  }
}
```

**Archivo:** `assets/vendor/supabase.min.js` - Clase `SupabaseAuthClient`

**Resultado:** `getUser()` ahora devuelve el usuario aunque la sesión solo tenga JWT.

---

### 5. **Queries Fallaban al Manejar Objetos vs Arrays**
**Problema:** Después de agregar `.single()`, el código en `actualizarInfoCliente()` intentaba hacer `data.length` en un objeto, causando error.

**Solución:** Actualizar código para manejar ambos casos:
```javascript
const profileData = Array.isArray(data) ? data[0] : data;
if (profileData) {
  const puntos = parseInt(profileData.puntos) || 0;
  // ...
}
```

**Archivo:** `assets/js/app.js` - Función `actualizarInfoCliente()`

También en `AuthService.signIn()`:
```javascript
const { data: profile, error: pErr } = profileResult;
if (pErr) return { success: false, message: pErr.message };

if (!profile) return { success: false, message: 'Perfil no encontrado' };
```

**Archivo:** `assets/js/authservice.js` - Función `signIn()`

---

### 6. **URL Encoding Mejorado para Filtros String**
**Problema Anterior:** Los filtros de string no se URL-encodaban correctamente, causando problemas con caracteres especiales como `@` en emails.

**Solución (ya aplicada):** 
```javascript
if (typeof filterValue === 'string') {
  encodedFilter = `${filter.column}=${filter.operator}."${encodeURIComponent(filterValue)}"`;
}
```

**Archivo:** `assets/vendor/supabase.min.js` - Método `_buildUrl()`

---

## Flow Completo Después de Cambios

### Paso 1: Login (login.html)
```
Usuario ingresa email/password
  ↓
App.js inicializarLogin() → await AuthService.signIn()
  ↓
AuthService.signIn() → isSupabaseEnabled? Sí
  ↓
window.supabase.auth.signInWithPassword(email, password)
  ↓
SupabaseAuthClient._session = response  (contiene access_token)
_saveToStorage() → localStorage['sb-auth-token'] = JSON.stringify(session)
return { data: { user: {...} }, error: null }
  ↓
AuthService obtiene userId de data.user.id
  ↓
window.supabase.from('profiles').select('*').eq('id', userId).single()
  ↓
SupabaseClient.from() actualiza db.authToken = _getCurrentAuthToken()
  ↓
Query va con header: Authorization: Bearer <access_token_jwt>
  ↓
PostgREST valida RLS: auth.uid() = perfil.id ✓
  ↓
Retorna perfil del usuario
  ↓
AuthService guarda perfil en StorageService
return { success: true, usuario: profile }
  ↓
App redirige a cliente.html
```

### Paso 2: Cargar Puntos en cliente.html
```
inicializarCliente(usuarioActivo)
  ↓
actualizarInfoCliente(usuario)
  ↓
window.supabase.auth.getUser()
  ↓
SupabaseAuthClient._loadFromStorage() (ya fue cargada en login)
  ↓
getUser() retorna { data: { user: {id: "...", email: "..."} }, error: null }
  ↓
window.supabase.from('profiles').select('puntos, email').eq('id', userId)
  ↓
SupabaseClient.from() actualiza db.authToken = _getCurrentAuthToken()
  ↓
Query con access_token ✓
  ↓
Retorna [{ puntos: 2000, email: "ana@mail.com" }]
  ↓
App.js parsea: const puntos = parseInt(data[0].puntos) = 2000
  ↓
UI muestra: "💰 Puntos disponibles: 2000"
```

---

## Qué Verificar Después de Recarga

1. **Login con ana@mail.com / 1234:**
   - Console debe mostrar:
     ```
     [AuthService] Intentando signIn con Supabase para: ana@mail.com
     [AuthService] signInWithPassword response: {data: {...}, error: null}
     [AuthService] userId obtenido: 550e8400-...
     [AuthService] Login exitoso, perfil cargado: {id: "...", email: "ana@mail.com", puntos: 2000, ...}
     ```
   - Debe redirigir a cliente.html

2. **En cliente.html:**
   - Console:
     ```
     [App] Current auth user: {id: "550e8400-...", email: "ana@mail.com"}
     [App] Current user ID: 550e8400-...
     [Supabase Query] URL: https://...com/rest/v1/profiles?select=puntos%2Cemail&id=eq."550e8400-..."
     [Supabase Query] Response data count: 1
     [App] Puntos cargados de Supabase: 2000 para usuario: ana@mail.com
     ```
   - UI debe mostrar: `💰 Puntos disponibles: 2000`

3. **Si falla:**
   - Verifica localStorage: `localStorage.getItem('sb-auth-token')` debe tener sesión
   - Verifica token: `localStorage.getItem('sb-auth-token').split('.')[1]` parsea el JWT
   - Verifica RLS: En Supabase Console > SQL Editor, ejecuta:
     ```sql
     SELECT * FROM public.profiles WHERE id = '<user_id>';
     ```

---

## Archivos Modificados

1. ✅ `assets/vendor/supabase.min.js`
   - Agregó `.single()` method
   - Mejoró `_loadFromStorage()` para parsear JWT
   - Agregó `_getCurrentAuthToken()` en SupabaseClient
   - Mejoró `_execute()` para manejar single mode
   - URL-encode mejorado para filtros string

2. ✅ `assets/js/authservice.js`
   - Mejoró `signIn()` con logging detallado
   - Ahora maneja correctamente responses con `.single()`
   - Verifica que profile existe antes de retornar

3. ✅ `assets/js/app.js`
   - Cambió `inicializarLogin()` a `async` y usa `await AuthService.signIn()`
   - Mejora `actualizarInfoCliente()` para manejar objeto vs array en data
   - Agrega logging detallado para debug

---

## Próximos Pasos

1. ✅ Recarga la página, haz login con ana@mail.com / 1234
2. ✅ Verifica que puntos = 2000 (no 150)
3. ⏭️ Luego: Probar flujo de canjes (redeem products)
4. ⏭️ Luego: Probar agregar puntos desde tiendas

Si aún falla, los logs en console te dirán exactamente dónde falló. Escribe lo que veas en console y te ayudaré a debuggear.
