# 🚀 Guía: Integración de TechPoints con Supabase

Este documento te guía paso a paso para:
1. Crear un proyecto en Supabase
2. Aplicar el esquema SQL
3. Configurar RLS (Row Level Security) y políticas
4. Integrar tu frontend con las claves de Supabase

---

## 📋 Pre-requisitos

- Cuenta en [Supabase](https://supabase.com)
- Proyecto web TechPoints clonado/descargado
- Acceso a Supabase Console (SQL Editor)

---

## 1️⃣ Crear Proyecto en Supabase

### Paso 1: Ir a Supabase Console
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta (o crea una)
3. Haz clic en **"New Project"** (Nuevo Proyecto)

### Paso 2: Configurar el Proyecto
- **Name**: `techpoints` (o el nombre que prefieras)
- **Database Password**: Crea una contraseña fuerte (guardala en un lugar seguro)
- **Region**: Selecciona la región más cercana a tus usuarios (ej. `us-east-1` para América)
- Haz clic en **"Create new project"**

Espera a que Supabase inicialice el proyecto (~2-5 minutos).

### Paso 3: Obtener las Claves
Una vez que el proyecto esté listo:
1. Ve a **Settings** → **API**
2. Copia los valores:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`
3. **IMPORTANTE**: Guarda estas claves en un lugar seguro. La clave pública es segura para usar en el frontend.

---

## 2️⃣ Aplicar el Esquema SQL

### Paso 1: Abrir SQL Editor
1. En Supabase Console, ve a **SQL Editor** (en el menú izquierdo)
2. Haz clic en **"New query"**

### Paso 2: Copiar y Ejecutar el Schema
1. Abre el archivo `docs/supabase/schema.sql` en tu editor
2. Copia TODO el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** (o presiona `Ctrl+Enter`)

Deberías ver mensajes de éxito confirmando que se crearon:
- ✅ Tablas (`profiles`, `stores`, `products`, `points_transactions`, `redemptions`, `transactions`)
- ✅ Índices (para optimizar consultas)
- ✅ Funciones RPC (`canjear_producto`, `agregar_puntos_cliente`, `obtener_estadisticas_cliente`)
- ✅ Políticas RLS

**Si hay errores**, revisa que el código SQL no tenga conflictos con tablas/funciones existentes. Puedes ejecutar primero:
```sql
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

---

## 3️⃣ Habilitar y Configurar Auth

### Paso 1: Habilitar Email/Password Auth
1. Ve a **Authentication** → **Providers**
2. Asegúrate de que **Email** esté habilitado (debería estarlo por defecto)
3. Configura opciones si es necesario:
   - **Auto Confirm email**: Toggle ON (para desarrollo)
   - **Require email verification**: Toggle OFF (para desarrollo)

### Paso 2: Configurar URL de Redirección
1. Ve a **Authentication** → **URL Configuration**
2. En **Authorized redirect URLs**, agrega:
   - `http://localhost:8000` (local development)
   - `http://localhost:3000` (si usas otro puerto)
   - `https://your-domain.com` (dominio en producción cuando despliegues)

---

## 4️⃣ Integrar con el Frontend

### Paso 1: Actualizar las Claves de Supabase
1. Abre `TechPoints/assets/js/supabaseClient.js`
2. Reemplaza los placeholders con tus claves:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Ejemplo real:
```javascript
const SUPABASE_URL = 'https://nfetcnyhwgimusluxdfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...';
```

### Paso 2: Incluir el Script en tus HTMLs
Verifica que tus archivos HTML incluyan:
```html
<!-- Supabase client (CDN) and initialization -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js"></script>
<script src="./assets/js/supabaseClient.js"></script>
```

**Los archivos que necesitan esto**:
- `index.html`
- `pages/login.html`
- `pages/registro.html`
- `pages/tienda.html`
- `pages/cliente.html`

---

## 5️⃣ Flujos Actualizados

### 📝 Registro (Sign Up)
Con las nuevas adaptaciones, el registro ahora usa `AuthService.signUp()` que:
1. Crea la cuenta en Supabase Auth (vía `supabase.auth.signUp`)
2. Inserta datos en la tabla `profiles`
3. Retorna el usuario con su ID de Supabase

Ejemplo desde un formulario:
```javascript
const resultado = await AuthService.signUp(email, password, 'cliente');
if (resultado.success) {
  console.log('Usuario registrado:', resultado.usuario);
  // Redirigir a login o dashboard
}
```

### 🔑 Login (Sign In)
El login ahora usa `AuthService.signIn()` que:
1. Autentica en Supabase Auth (vía `supabase.auth.signInWithPassword`)
2. Lee el perfil desde la tabla `profiles`
3. Retorna el usuario con sus datos (puntos, rol, etc.)

Ejemplo:
```javascript
const resultado = await AuthService.signIn(email, password);
if (resultado.success) {
  console.log('Sesión iniciada:', resultado.usuario);
  // Redirigir al dashboard según rol
}
```

### 🛒 Agregar Productos
Con `ProductService.agregarProducto()`:
- Busca la tienda del usuario autenticado en Supabase
- Inserta en la tabla `products` (protegido por RLS)
- Retorna el producto con su ID generado

Ejemplo:
```javascript
const resultado = await ProductService.agregarProducto(
  'tienda@mail.com',
  'Mouse Gamer',
  500,  // costo en puntos
  25.00, // precio en dólares
  'Mouse de alta precisión',
  null, // imagen URL
  10    // stock
);
```

### 💰 Agregar Puntos
Con `StoreService.agregarPuntosCliente()`:
- Busca al cliente por email
- Llama la función RPC `agregar_puntos_cliente` (operación segura en servidor)
- Registra la transacción

Ejemplo:
```javascript
const resultado = await StoreService.agregarPuntosCliente('ana@mail.com', 100);
if (resultado.success) {
  console.log('Puntos nuevos:', resultado.puntosNuevos);
}
```

### 🎁 Canjear Producto
Con `ProductService.canjearProducto()`:
- Llama la función RPC `canjear_producto` que:
  1. Verifica que el cliente tenga suficientes puntos
  2. Verifica que el producto tenga stock
  3. Resta puntos de `profiles`
  4. Decrementa stock en `products`
  5. Inserta registros de auditoría en `redemptions` y `points_transactions`
  - **Todo en una transacción atómica** (evita fraudes)

Ejemplo:
```javascript
const resultado = await ProductService.canjearProducto('ana@mail.com', 0);
if (resultado.success) {
  console.log('Canje exitoso!', resultado.message);
  console.log('Puntos restantes:', resultado.puntosRestantes);
}
```

---

## 6️⃣ Migración de Datos Mock (Opcional)

Si tienes datos locales que quieres migrar a Supabase:

### Opción A: Script Manual en Consola
```javascript
// En la consola del navegador, después de autenticarse:

// 1. Obtener datos locales
const backup = StorageService.exportAll();
console.log(backup);

// 2. Parsear y insertar productos
const productos = JSON.parse(backup.productos);
for (const prod of productos) {
  await window.supabase
    .from('products')
    .insert([{
      tienda_id: 1,  // Ajusta según tu tienda
      nombre: prod.nombre,
      costo_puntos: prod.costo,
      stock: prod.stock,
      descripcion: prod.descripcion
    }]);
}

// 3. Insertar perfiles (si necesario)
const usuarios = JSON.parse(backup.usuarios);
for (const user of usuarios) {
  // Esto es solo para referencia; usa Supabase Auth para crear usuarios
  await window.supabase
    .from('profiles')
    .insert([{
      email: user.email,
      role: user.role,
      nombre: user.nombre || user.email.split('@')[0],
      puntos: user.puntos || 0
    }]);
}
```

### Opción B: CSV/JSON via Supabase Console
1. Ve a **Table Editor** en Supabase
2. Haz clic en la tabla donde quieras insertar
3. Haz clic en **Import** y selecciona tu CSV/JSON

---

## 7️⃣ Debugging & Troubleshooting

### ❌ Error: "supabase no está definido"
**Causa**: El script CDN no se cargó correctamente.
**Solución**:
- Verifica que `supabaseClient.js` esté incluido DESPUÉS del CDN en tu HTML
- Abre DevTools (F12) y ve a la pestaña **Network** para verificar que los scripts se descargaron

### ❌ Error: "anon key inválida" o "CORS error"
**Causa**: La clave de Supabase no es correcta o no es la clave pública.
**Solución**:
- Verifica que estés usando la **anon public key** (no la service_role key)
- Copia nuevamente desde Supabase Console → Settings → API

### ❌ Error en RLS: "permission denied"
**Causa**: Las políticas RLS están bloqueando la operación.
**Solución**:
- Verifica que el usuario esté autenticado (`supabase.auth.getUser()`)
- Revisa en Supabase Console → Authentication → Users que el usuario exista
- Comprueba que la política RLS sea correcta para esa operación

### ✅ Verificar que todo funciona
```javascript
// En la consola del navegador:

// 1. Verifica que Supabase esté disponible
console.log(window.supabase);

// 2. Prueba obtener productos
const { data, error } = await window.supabase.from('products').select('*');
console.log(data, error);

// 3. Prueba obtener usuario autenticado
const { data: user, error: userError } = await window.supabase.auth.getUser();
console.log(user, userError);
```

---

## 8️⃣ Security Best Practices (Producción)

⚠️ **IMPORTANTE**: Si vas a desplegar a producción:

1. **NUNCA** hagas commit de las claves de Supabase en Git:
   - Crea un archivo `supabaseClient.local.js` (gitignore)
   - O usa variables de entorno + build step

2. **Rota las claves regularmente**:
   - Ve a Settings → API → Regenerate Keys

3. **Habilita RLS en TODAS las tablas** (ya está en el schema)

4. **Usa HTTPS** en producción:
   - Las URLs de redirección deben ser HTTPS

5. **Restringir permisos**:
   - No des más permisos en RLS de los necesarios
   - Usa `SECURITY DEFINER` solo en funciones críticas

6. **Monitorear transacciones**:
   - Revisa regularmente la tabla `transactions` y `redemptions`
   - Detecta patrones fraudulentos

---

## 🎯 Próximos Pasos

1. ✅ Crea el proyecto en Supabase
2. ✅ Aplica el esquema SQL
3. ✅ Actualiza tus claves en el frontend
4. ✅ Prueba el flujo: Registro → Login → Agregar Productos → Canje
5. ✅ Verifica que los datos aparezcan en Supabase Console
6. ✅ Implementa Realtime (opcional) para actualizaciones en tiempo real

---

## 📞 Soporte & Recursos

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [RLS & Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

**¡Listo!** 🎉 Tu TechPoints ahora está integrado con Supabase. Si tienes preguntas, revisa los logs en Supabase Console → Logs.
