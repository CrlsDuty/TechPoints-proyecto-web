# 📚 TechPoints - Documentación

## 🚀 Inicio Rápido

### Prerequisitos
- Supabase cuenta configurada
- Base de datos creada
- Usuario de tienda y cliente

### Archivos Esenciales

#### 1. `schema.sql`
Estructura de la base de datos PostgreSQL.
- Tablas: `auth.users`, `profiles`, `products`, `stores`, `transactions`
- Roles y niveles de acceso
- **Ejecutar primero al crear la BD**

#### 2. `trigger_and_backfill.sql`
Automatiza la creación de perfiles.
- Trigger: Crea profile automáticamente cuando se registra usuario
- Backfill: Llena perfiles existentes
- **Ejecutar después de schema.sql**

#### 3. `INSERTAR_PRODUCTOS_DEMO.sql`
Datos de prueba para desarrollo.
- 3 productos demo (Laptop, Mouse, Teclado)
- Store de demostración
- **Ejecutar para llenar datos iniciales**

---

## 📋 Estructura de la BD

```
USUARIOS (auth.users)
  ├─ id (UUID)
  ├─ email
  └─ password (hasheado)

PERFILES (profiles)
  ├─ id (UUID de auth.users)
  ├─ email
  ├─ role (cliente/tienda)
  ├─ nombre
  ├─ puntos (default: 0)
  └─ metadata

TIENDAS (stores)
  ├─ id (UUID)
  ├─ owner_id (FK auth.users)
  ├─ nombre
  └─ contacto (JSON)

PRODUCTOS (products)
  ├─ id (UUID)
  ├─ tienda_id (FK stores)
  ├─ nombre
  ├─ costo_puntos
  ├─ precio_dolar
  └─ stock

TRANSACCIONES (transactions)
  ├─ id (UUID)
  ├─ usuario_id (FK profiles)
  ├─ tipo (compra/canje/regalo)
  ├─ puntos
  └─ timestamp
```

---

## 🔐 RLS Policies (Seguridad)

- **Profiles**: Usuarios anónimos pueden consultar por email
- **Products**: Lectura pública, escritura solo tienda
- **Transactions**: Lectura propia, escritura del sistema

---

## 🔧 Configuración Supabase

### 1. Crear proyecto
- URL: Copiar y guardar
- API Key (anon): Guardar en `supabaseClient.js`

### 2. Ejecutar SQL
```bash
1. schema.sql
2. trigger_and_backfill.sql
3. INSERTAR_PRODUCTOS_DEMO.sql
```

### 3. Credenciales Demo
```
Cliente: ana@mail.com / 1234
Tienda: tienda@mail.com / admin
```

---

## 📝 Variables de Entorno

En `assets/js/config.js`:
```javascript
const SUPABASE_URL = 'https://nfetcnyhwgimusluxdfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## ✅ Checklist de Implementación

- [ ] Crear proyecto Supabase
- [ ] Ejecutar schema.sql
- [ ] Ejecutar trigger_and_backfill.sql
- [ ] Insertar productos demo
- [ ] Guardar credenciales
- [ ] Configurar URL y API Key
- [ ] Probar login (ana@mail.com / 1234)
- [ ] Verificar productos cargan

---

## 🧪 Testing

### Login
```javascript
// Abrir DevTools (F12) → Consola
authService.signIn('ana@mail.com', '1234');
// Debe retornar: { success: true, usuario: {...} }
```

### Productos
```javascript
productService.obtenerProductos();
// Debe retornar: array con 3 productos
```

### Puntos
```javascript
const usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
console.log(usuario.puntos);
// Debe mostrar puntos del usuario
```

---

## 📊 Datos Demo

| Producto | Puntos | Precio |
|----------|--------|--------|
| Laptop Gaming | 500 | $1299.99 |
| Mouse Logitech | 100 | $99.99 |
| Teclado Mecánico | 250 | $199.99 |

---

## 🐛 Troubleshooting

**Error: "supabase is undefined"**
- Verificar que supabase.min.js cargó antes de supabaseClient.js
- Abrir DevTools → Network → Verificar scripts

**Login falla**
- Verificar email/password en profiles table
- Confirmar que el usuario existe: `SELECT * FROM profiles WHERE email = 'xxx@xxx.com';`

**Productos no cargan**
- Verificar que existen en la tabla: `SELECT * FROM products;`
- Confirmar que tienda_id es correcto

**Puntos muestran 0**
- Es normal al crear nuevo usuario (inician con 0)
- Modificar en BD: `UPDATE profiles SET puntos = 50 WHERE email = 'ana@mail.com';`

---

## 📞 Soporte

Para más información:
- Revisar archivos .sql en orden
- Consultar schema.sql para estructura
- Verificar credenciales en config.js

---

**Última actualización**: Noviembre 2025  
**Estado**: ✅ Operativo
