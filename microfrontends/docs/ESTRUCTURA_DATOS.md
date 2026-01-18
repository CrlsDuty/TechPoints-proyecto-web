# Estructura de Datos y Esquema

## 📊 Esquema de Base de Datos (Supabase)

### Tablas Principales

#### 1. `profiles` (Usuarios/Clientes)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  nombre VARCHAR NOT NULL,
  puntos INTEGER DEFAULT 0,
  tipo_cuenta VARCHAR (admin/cliente), 
  creado_at TIMESTAMP DEFAULT NOW(),
  actualizado_at TIMESTAMP DEFAULT NOW()
);
```

**Campos clave:**
- `id`: ID del usuario
- `puntos`: Saldo de puntos disponibles
- `tipo_cuenta`: Para determinar permisos

---

#### 2. `stores` (Tiendas)
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id),
  nombre VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  telefono VARCHAR,
  creado_at TIMESTAMP DEFAULT NOW()
);
```

---

#### 3. `products` (Productos)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  tienda_id UUID REFERENCES stores(id),
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  categoria VARCHAR NOT NULL,
  costo_puntos INTEGER NOT NULL,
  precio_dolar DECIMAL(10, 2),
  imagen_url VARCHAR,
  stock INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  creado_at TIMESTAMP DEFAULT NOW(),
  actualizado_at TIMESTAMP DEFAULT NOW()
);
```

**Campos clave:**
- `categoria`: Para filtrado (Hardware Internos, Periféricos, etc.)
- `costo_puntos`: Costo en puntos (1 USD = 100 puntos)
- `stock`: Cantidad disponible

---

#### 4. `redemptions` (Canjes/Compras)
```sql
CREATE TABLE redemptions (
  id UUID PRIMARY KEY,
  perfil_id UUID REFERENCES profiles(id),
  producto_id UUID REFERENCES products(id),
  puntos_usados INTEGER NOT NULL,
  estado VARCHAR DEFAULT 'completado', -- (completado/pendiente/cancelado)
  creado_at TIMESTAMP DEFAULT NOW()
);
```

**Campos clave:**
- `puntos_usados`: Puntos gastados en este canje
- `estado`: Permite rastrear estado de transacción

---

## 📦 Estructura de Datos en la Aplicación

### Producto (desde Micro Productos)
```javascript
{
  id: "uuid",
  nombre: "RTX 4090",
  descripcion: "Tarjeta gráfica de última generación",
  categoria: "Tarjetas Gráficas (GPU)",
  costo_puntos: 15000,
  precio_dolar: 150.00,
  imagen_url: "https://...",
  tienda_id: "uuid",
  tienda: {
    id: "uuid",
    nombre: "TechStore Pro",
    email: "admin@techstore.com"
  },
  stock: 5,
  activo: true
}
```

### Item del Carrito (Micro Canjes)
```javascript
{
  productoId: "uuid",
  nombre: "RTX 4090",
  puntos: 15000,
  cantidad: 1,
  tienda: "TechStore Pro",
  tiendaId: "uuid",
  imagen: "https://...",
  total: 15000  // puntos * cantidad
}
```

### Registro del Historial (Micro Historial)
```javascript
{
  id: "uuid",
  perfil_id: "uuid",
  producto_id: "uuid",
  puntos_usados: 15000,
  estado: "completado",
  creado_at: "2026-01-18T10:30:00Z",
  // JOIN con products
  producto: {
    nombre: "RTX 4090",
    categoria: "Tarjetas Gráficas (GPU)",
    imagen_url: "https://..."
  }
}
```

### Usuario Activo (Contexto de Auth)
```javascript
{
  id: "uuid",
  email: "cliente@example.com",
  nombre: "Juan Pérez",
  puntos: 50000,
  tipo_cuenta: "cliente",
  creado_at: "2025-01-01T00:00:00Z"
}
```

---

## 🔄 Flujo de Datos Ejemplo: Canje Completo

```
1. Cargar Productos
   └─ Micro Productos (React) ─→ Supabase.from('products').select(*)
                               ├─ Respuesta: Array<Producto>
                               └─ Mostrar en CatalogoProductos.jsx

2. Agregar al Carrito
   └─ Usuario hace clic en "Agregar"
      ├─ eventBus.emit('add-to-cart', { productoId, ... })
      └─ Micro Canjes escucha evento
         └─ CarritoCanjes.vue agrega item: { productoId, ... }

3. Confirmar Canje
   └─ Usuario hace clic en "Confirmar"
      ├─ ConfirmacionCanje.vue valida puntos
      ├─ Envía POST a Supabase.from('redemptions').insert(...)
      ├─ Supabase actualiza: profiles.puntos -= puntos_usados
      ├─ eventBus.emit('canje-completado', { ... })
      └─ Micro Historial escucha
         └─ HistorialCompras.vue actualiza lista

4. Actualizar Historial
   └─ Micro Historial carga nuevamente
      ├─ SELECT * FROM redemptions WHERE perfil_id = $1
      ├─ Mostrar en HistorialCompras.vue
      └─ eventBus.emit('historialActualizado', { ... })
```

---

## 🎯 Tipado (TypeScript - Opcional pero Recomendado)

### types/index.ts
```typescript
// Usuario
export interface Usuario {
  id: string
  email: string
  nombre: string
  puntos: number
  tipo_cuenta: 'admin' | 'cliente'
  creado_at: string
}

// Tienda
export interface Tienda {
  id: string
  owner_id: string
  nombre: string
  email: string
  telefono?: string
  creado_at: string
}

// Producto
export interface Producto {
  id: string
  tienda_id: string
  nombre: string
  descripcion?: string
  categoria: string
  costo_puntos: number
  precio_dolar?: number
  imagen_url?: string
  stock: number
  activo: boolean
  creado_at: string
  actualizado_at: string
  tienda?: Tienda
}

// Canje/Redemption
export interface Canje {
  id: string
  perfil_id: string
  producto_id: string
  puntos_usados: number
  estado: 'completado' | 'pendiente' | 'cancelado'
  creado_at: string
  producto?: Producto
}

// Item del Carrito
export interface ItemCarrito {
  productoId: string
  nombre: string
  puntos: number
  cantidad: number
  tienda: string
  tiendaId: string
  imagen?: string
}

// Evento de Canje
export interface CanjeCompletado {
  usuario_id: string
  puntos_usados: number
  items: ItemCarrito[]
  timestamp: string
  estado: string
}
```

---

## 📝 Validaciones

### Validaciones en Cliente (React/Vue)
```javascript
// Validar canje
function validarCanje(usuario, totalPuntos) {
  const validaciones = []
  
  if (!usuario) {
    validaciones.push('Debes iniciar sesión')
  }
  
  if (totalPuntos <= 0) {
    validaciones.push('El carrito está vacío')
  }
  
  if (usuario && totalPuntos > usuario.puntos) {
    validaciones.push(
      `No tienes suficientes puntos (tienes ${usuario.puntos}, necesitas ${totalPuntos})`
    )
  }
  
  return {
    valido: validaciones.length === 0,
    errores: validaciones
  }
}
```

### Validaciones en Servidor (Supabase RLS)
```sql
-- Row Level Security en tabla redemptions
CREATE POLICY "Usuarios solo pueden ver sus propias redenciones"
ON redemptions FOR SELECT
USING (auth.uid() = perfil_id);

CREATE POLICY "Sistema solo puede insertar redenciones válidas"
ON redemptions FOR INSERT
WITH CHECK (
  -- Validar que el usuario tiene suficientes puntos
  (SELECT puntos FROM profiles WHERE id = perfil_id) >= puntos_usados
  AND puntos_usados > 0
  AND perfil_id = auth.uid()
);
```

---

## 🔐 Relaciones y JOINs

### Obtener historial con detalles del producto
```sql
SELECT 
  r.id,
  r.perfil_id,
  r.puntos_usados,
  r.creado_at,
  p.nombre as producto_nombre,
  p.categoria,
  p.imagen_url,
  s.nombre as tienda_nombre
FROM redemptions r
JOIN products p ON r.producto_id = p.id
JOIN stores s ON p.tienda_id = s.id
WHERE r.perfil_id = $1
ORDER BY r.creado_at DESC;
```

### Implementación en Servicio
```javascript
// micro-historial/src/services/historialService.js
export async function obtenerHistorialConDetalles(usuarioId) {
  const { data, error } = await supabase
    .from('redemptions')
    .select(`
      id,
      perfil_id,
      puntos_usados,
      creado_at,
      producto:products(
        id,
        nombre,
        categoria,
        imagen_url
      ),
      tienda:products(tienda_id).stores(id, nombre)
    `)
    .eq('perfil_id', usuarioId)
    .order('creado_at', { ascending: false })
  
  return data
}
```

---

**Última actualización**: Enero 2026
