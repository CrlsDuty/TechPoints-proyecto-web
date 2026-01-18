# Comunicación entre Microfrontends

## 🔄 Patrones de Comunicación

Todos los microfrontends se comunican a través de:
1. **EventBus** - Para eventos asincronos
2. **Shared Services** - Para servicios compartidos
3. **Supabase** - Como base de datos centralizada

---

## 📡 EventBus (Comunicación Centralizada)

### Ubicación
`shell-app/src/utils/eventBus.js`

### Implementación
```javascript
class EventBus {
  constructor() {
    this.events = {}
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
    
    // Retornar función para desuscribirse
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data))
    }
  }
  
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data)
      unsubscribe()
    })
  }
  
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }
}

export default new EventBus()
```

### Importación en Microfrontends
```javascript
// Vue
import eventBus from '../../../shell-app/src/utils/eventBus'

// React
import eventBus from '../../../shell-app/src/utils/eventBus'
```

---

## 📋 Eventos Disponibles

### 1. `add-to-cart`
**Emitido por:** Micro Productos (React)  
**Escuchado por:** Micro Canjes (Vue)

```javascript
// Emisión (CatalogoProductos.jsx)
const handleAgregarAlCarrito = (producto) => {
  eventBus.emit('add-to-cart', {
    productoId: producto.id,
    nombre: producto.nombre,
    puntos: producto.costo_puntos,
    tienda: producto.stores.nombre,
    tiendaId: producto.tienda_id,
    imagen: producto.imagen_url,
    cantidad: 1
  })
}

// Escucha (CarritoCanjes.vue)
onMounted(() => {
  eventBus.on('add-to-cart', (item) => {
    const itemExistente = carrito.value.find(
      c => c.productoId === item.productoId
    )
    
    if (itemExistente) {
      itemExistente.cantidad++
    } else {
      carrito.value.push(item)
    }
    
    actualizarTotal()
  })
})
```

---

### 2. `canje-completado`
**Emitido por:** Micro Canjes (Vue)  
**Escuchado por:** Micro Historial (Vue)

```javascript
// Emisión (ConfirmacionCanje.vue)
const procesarCanje = async () => {
  // ... procesar...
  
  eventBus.emit('canje-completado', {
    usuario_id: usuario.id,
    puntos_usados: totalPuntos,
    items: carrito,
    timestamp: new Date(),
    estado: 'completado'
  })
  
  // Limpiar carrito
  carritoStore.limpiarCarrito()
}

// Escucha (HistorialCompras.vue)
onMounted(() => {
  eventBus.on('canje-completado', async (datos) => {
    // Actualizar historial localmente
    historialStore.agregarAlHistorial(datos)
    
    // Opcional: Recargar desde DB para sincronización
    await historialStore.cargarHistorial(datos.usuario_id)
    
    mostrarToast('Canje registrado en historial', 'success')
  })
})
```

---

### 3. `puntosActualizados`
**Emitido por:** Micro Canjes (Vue), Shell App (Auth)  
**Escuchado por:** Todos los microfrontends

```javascript
// Emisión (ConfirmacionCanje.vue)
const actualizarPuntos = async (usuarioId, nuevoSaldo) => {
  // Actualizar en DB
  await supabase
    .from('profiles')
    .update({ puntos: nuevoSaldo })
    .eq('id', usuarioId)
  
  // Emitir evento
  eventBus.emit('puntosActualizados', {
    usuarioId,
    nuevoSaldo,
    puntosUsados: totalPuntos,
    timestamp: new Date()
  })
}

// Escucha en Micro Historial
eventBus.on('puntosActualizados', (datos) => {
  historialStore.actualizarPuntosDispobibles(datos.nuevoSaldo)
})

// Escucha en Micro Productos
eventBus.on('puntosActualizados', (datos) => {
  productosStore.actualizarPuntosDisponibles(datos.nuevoSaldo)
})
```

---

### 4. `usuario-sesion`
**Emitido por:** Shell App (Auth)  
**Escuchado por:** Todos los microfrontends

```javascript
// Emisión (Login.jsx / AuthContext.jsx)
const handleLogin = async (email, password) => {
  const usuario = await AuthService.login(email, password)
  
  eventBus.emit('usuario-sesion', {
    tipo: 'login',
    usuario: usuario,
    timestamp: new Date()
  })
}

const handleLogout = () => {
  AuthService.logout()
  
  eventBus.emit('usuario-sesion', {
    tipo: 'logout',
    usuario: null,
    timestamp: new Date()
  })
}

// Escucha (Todos los microfrontends)
eventBus.on('usuario-sesion', (datos) => {
  if (datos.tipo === 'login') {
    // Cargar datos del usuario
    cargarDatos(datos.usuario.id)
  } else if (datos.tipo === 'logout') {
    // Limpiar estado local
    limpiarDatos()
  }
})
```

---

### 5. `historialActualizado`
**Emitido por:** Micro Historial (Vue)  
**Escuchado por:** Shell App, Micro Productos, Micro Canjes

```javascript
// Emisión (HistorialCompras.vue)
const cargarHistorial = async () => {
  const datos = await historialService.obtenerHistorial(usuarioId)
  historialStore.setHistorial(datos)
  
  eventBus.emit('historialActualizado', {
    cantidad: datos.length,
    ultimoRegistro: datos[0],
    timestamp: new Date()
  })
}

// Escucha (Micro Productos - Para mostrar notificación)
eventBus.on('historialActualizado', (datos) => {
  console.log(`Historial actualizado: ${datos.cantidad} registros`)
})
```

---

### 6. `error-operacion`
**Emitido por:** Cualquier microfrontend  
**Escuchado por:** Shell App (para mostrar notificación global)

```javascript
// Emisión (En cualquier servicio)
try {
  // operación...
} catch (error) {
  eventBus.emit('error-operacion', {
    titulo: 'Error al procesar canje',
    mensaje: error.message,
    tipo: 'error',
    timestamp: new Date()
  })
}

// Escucha (Shell App)
eventBus.on('error-operacion', (datos) => {
  mostrarNotificacionGlobal(datos)
})
```

---

## 🔐 Autenticación y Contexto Compartido

### AuthContext (Shell App)

El AuthContext se proporciona a través de Supabase Auth:

```javascript
// shell-app/src/auth/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import eventBus from '../utils/eventBus'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Verificar sesión existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        cargarPerfilUsuario(session.user.id)
      }
      setLoading(false)
    })
    
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          cargarPerfilUsuario(session.user.id)
          eventBus.emit('usuario-sesion', {
            tipo: 'login',
            usuario: session.user
          })
        } else if (event === 'SIGNED_OUT') {
          setUsuario(null)
          eventBus.emit('usuario-sesion', {
            tipo: 'logout',
            usuario: null
          })
        }
      }
    )
    
    return () => subscription?.unsubscribe()
  }, [])
  
  const cargarPerfilUsuario = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    setUsuario(profile)
  }
  
  return (
    <AuthContext.Provider value={{ usuario, loading, cargarPerfilUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Acceso desde Microfrontends

```vue
<!-- Micro Historial -->
<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import eventBus from '../../../shell-app/src/utils/eventBus'

const authStore = useAuthStore()

onMounted(() => {
  // Esperar a que la sesión se establezca
  eventBus.once('usuario-sesion', (datos) => {
    if (datos.tipo === 'login') {
      authStore.setUsuario(datos.usuario)
    }
  })
})
</script>
```

---

## 🗄️ Supabase como Fuente de Verdad

### Patrón de Sincronización

```
Micro A ─┐
         ├─→ Supabase (Fuente de Verdad) ←─ Micro B
Micro C ─┘
```

### Implementación
```javascript
// Cuando ocurre una acción importante
const procesarCanje = async (datos) => {
  // 1. Actualizar en Supabase (fuente de verdad)
  await supabase
    .from('redemptions')
    .insert({ ...datos })
  
  // 2. Emitir evento a otros microfrontends
  eventBus.emit('canje-completado', datos)
  
  // 3. Actualizar estado local
  canjeStore.agregarCanje(datos)
}
```

---

## ⚠️ Mejores Prácticas

### 1. No duplicar lógica
```javascript
// ❌ MAL - Lógica en ambos microfrontends
Micro A: Calcula total de puntos
Micro B: Calcula total de puntos (duplicado)

// ✅ BIEN - Lógica centralizada
service.calcularTotal() → compartido
```

### 2. Desuscribirse de eventos
```javascript
// ❌ MAL - Memory leak
eventBus.on('evento', callback)

// ✅ BIEN
const unsubscribe = eventBus.on('evento', callback)
onUnmounted(() => unsubscribe())
```

### 3. Validación en cliente y servidor
```javascript
// ✅ BIEN - Validar en ambos lados
Frontend: Validar puntos disponibles
Backend: Validar puntos disponibles (RLS en Supabase)
```

### 4. Orden de dependencias
```javascript
// ✅ Orden correcto
1. Cargar usuario (Shell App)
2. Cargar productos (Micro Productos)
3. Mostrar historial (Micro Historial)
4. Permitir canjes (Micro Canjes)
```

---

## 🧪 Testing de Eventos

```javascript
// __tests__/eventBus.spec.js
import eventBus from '../eventBus'
import { describe, it, expect, beforeEach } from 'vitest'

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.events = {}
  })
  
  it('debe emitir eventos', () => {
    const callback = vi.fn()
    eventBus.on('test', callback)
    eventBus.emit('test', { data: 'test' })
    
    expect(callback).toHaveBeenCalledWith({ data: 'test' })
  })
  
  it('debe permitir desuscribirse', () => {
    const callback = vi.fn()
    const unsubscribe = eventBus.on('test', callback)
    unsubscribe()
    eventBus.emit('test', {})
    
    expect(callback).not.toHaveBeenCalled()
  })
})
```

---

**Última actualización**: Enero 2026
