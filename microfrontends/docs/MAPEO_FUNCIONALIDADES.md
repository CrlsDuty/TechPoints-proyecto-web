# Mapeo Detallado de Funcionalidades

## 📊 Funciones del Proyecto Original → Microfrontends

---

## 🟦 HISTORIAL (Integrante 1 - Vue)

### Archivo Original: `app.js` (líneas ~505-570)

#### Función: `mostrarHistorial()`
```javascript
// ORIGINAL (Vanilla JS)
function mostrarHistorial() {
  const usuarioActivo = StorageService.obtenerUsuarioActivo();
  if (!usuarioActivo) return mostrarPagina('login');
  
  const tabButtons = document.querySelectorAll('[data-tab]');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(tc => tc.hidden = true);
      document.getElementById(`tab-${tab}`).hidden = false;
    });
  });
  
  cargarHistorialDesdeSupabase(usuarioActivo);
}
```

**Migración a Vue:**
```vue
<!-- HistorialCompras.vue -->
<template>
  <div class="historial-container">
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab"
        @click="activeTab = tab"
        :class="{ active: activeTab === tab }"
      >
        {{ tab === 'compras' ? 'Compras' : 'Canjes' }}
      </button>
    </div>
    
    <div class="tab-content">
      <HistorialCompras v-if="activeTab === 'compras'" />
      <HistorialCanjes v-if="activeTab === 'canjes'" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { cargarHistorial } from '../services/historialService'
import HistorialCompras from './HistorialCompras.vue'
import HistorialCanjes from './HistorialCanjes.vue'

const activeTab = ref('compras')
const tabs = ['compras', 'canjes']

onMounted(async () => {
  await cargarHistorial()
})
</script>
```

**Services a crear:**
- `historialService.js`: `cargarHistorial()`, `obtenerCompras()`, `obtenerCanjes()`
- `historialStore.js` (Pinia): Estado centralizado del historial

---

#### Función: `cargarHistorialDesdeSupabase(usuarioActivo)`
```javascript
// ORIGINAL - tiendas-catalog.js
async cargarHistorialDesdeSupabase(usuarioActivo) {
  const token = await obtenerTokenAutenticado();
  const respuesta = await fetch(
    `${window.supabase.url}/rest/v1/redemptions?perfil_id=eq.${usuarioActivo.id}`,
    { headers: { ... } }
  );
  // Procesar datos...
}
```

**Migración:**
```javascript
// micro-historial/src/services/historialService.js
export async function cargarHistorial() {
  const usuarioActivo = useAuthStore().usuario
  const response = await supabase
    .from('redemptions')
    .select('*')
    .eq('perfil_id', usuarioActivo.id)
    .order('creado_at', { ascending: false })
  
  return response.data
}
```

---

#### Función: `calcularEstadisticas()`
**Nueva en microfrontends - No existe en vanilla JS**

```javascript
// micro-historial/src/services/historialService.js
export function calcularEstadisticas(historial) {
  return {
    totalPuntosGastados: historial.reduce((sum, h) => sum + h.puntos_usados, 0),
    totalCompras: historial.filter(h => h.tipo === 'compra').length,
    totalCanjes: historial.filter(h => h.tipo === 'canje').length,
    promedioPuntosCompra: ...
  }
}
```

**Componente Vue:**
```vue
<!-- EstadisticasPuntos.vue -->
<template>
  <div class="estadisticas">
    <div class="stat-card">
      <h3>Total Puntos Gastados</h3>
      <p class="stat-value">{{ stats.totalPuntosGastados }}</p>
    </div>
    <!-- Más cards... -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHistorialStore } from '../stores/historialStore'

const store = useHistorialStore()
const stats = computed(() => calcularEstadisticas(store.historial))
</script>
```

---

## 🟨 PRODUCTOS (Integrante 2 - React)

### Archivo Original: `tiendas-catalog.js` (líneas ~47-103)

#### Función: `cargarTiendasYProductos()`
```javascript
// ORIGINAL
async function cargarTiendasYProductos() {
  try {
    const tiendas = await supabase.from('stores').select('*');
    const productos = await supabase.from('products').select('*');
    
    productosData = productos.map(prod => ({
      ...prod,
      costo: prod.costo_puntos // Mapear columna correcta
    }));
    
    mostrarTiendas(tiendas, productosData);
  } catch (err) {
    console.error('Error cargando datos:', err);
  }
}
```

**Migración a React:**
```javascript
// micro-productos/src/services/productosService.js
export async function cargarProductos() {
  try {
    const { data: productos, error } = await supabase
      .from('products')
      .select('*, stores(id, nombre, email)')
      .eq('activo', true)
    
    if (error) throw error
    return productos
  } catch (err) {
    console.error('Error:', err)
    throw err
  }
}

// micro-productos/src/hooks/useProductos.js
export function useProductos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    cargarProductos()
      .then(setProductos)
      .finally(() => setLoading(false))
  }, [])
  
  return { productos, loading }
}
```

**Componente React:**
```jsx
// micro-productos/src/components/CatalogoProductos.jsx
function CatalogoProductos() {
  const { productos, loading } = useProductos()
  
  if (loading) return <div>Cargando...</div>
  
  return (
    <div className="catalogo">
      {productos.map(producto => (
        <TarjetaProducto key={producto.id} producto={producto} />
      ))}
    </div>
  )
}
```

---

#### Función: `aplicarFiltros()` (línea 520)
```javascript
// ORIGINAL - tiendas-catalog.js
function aplicarFiltros() {
  const filtroTienda = document.getElementById('filtroTienda')?.value || ''
  const filtroProducto = document.getElementById('filtroProducto')?.value || ''
  const filtroPuntos = document.getElementById('filtroPuntos')?.value || Infinity
  
  let filtrados = tiendasData.filter(tienda => {
    return tienda.nombre.toLowerCase().includes(filtroTienda)
  })
  // ... más lógica de filtrado
  
  mostrarTiendas(filtrados, productosFiltrados)
}
```

**Migración:**
```jsx
// micro-productos/src/components/FiltrosCategoria.jsx
function FiltrosCategoria({ onFilter }) {
  const [filtros, setFiltros] = useState({
    categoria: '',
    precioMax: null,
    tienda: ''
  })
  
  const aplicarFiltros = (productos) => {
    let filtrados = productos
    
    if (filtros.categoria) {
      filtrados = filtrados.filter(p => 
        p.categoria === filtros.categoria
      )
    }
    
    if (filtros.precioMax) {
      filtrados = filtrados.filter(p => 
        parseInt(p.costo_puntos) <= filtros.precioMax
      )
    }
    
    onFilter(filtrados)
  }
  
  return (
    <div className="filtros">
      <select onChange={(e) => {
        setFiltros({...filtros, categoria: e.target.value})
        aplicarFiltros(productos)
      }}>
        {/* opciones */}
      </select>
    </div>
  )
}

// micro-productos/src/hooks/useFiltros.js
export function useFiltros(productos) {
  const [filtros, setFiltros] = useState({...})
  const [filtrados, setFiltrados] = useState(productos)
  
  useEffect(() => {
    const aplicar = () => { /* lógica */ }
    aplicar()
  }, [filtros, productos])
  
  return { filtros, setFiltros, filtrados }
}
```

---

#### Función: `agregarAlCarrito()` (línea 169)
```javascript
// ORIGINAL
function agregarAlCarrito(productoId, tiendaId, tiendaNombre) {
  const producto = productosData.find(p => p.id === productoId)
  if (!producto) return
  
  const puntos = parseInt(producto.costo) || 0
  
  const itemExistente = carritoItems.find(item => 
    item.productoId === productoId
  )
  
  if (itemExistente) {
    itemExistente.cantidad++
  } else {
    carritoItems.push({
      productoId, tiendaId, tiendaNombre,
      nombre: producto.nombre,
      puntos, cantidad: 1
    })
  }
  
  actualizarCarritoUI()
}
```

**Migración a React:**
```jsx
// micro-productos/src/components/CatalogoProductos.jsx
function agregarAlCarrito(producto) {
  // Emitir evento para que Micro Canjes escuche
  eventBus.emit('add-to-cart', {
    productoId: producto.id,
    nombre: producto.nombre,
    puntos: producto.costo_puntos,
    tienda: producto.tienda_id,
    cantidad: 1
  })
}

// O usando Context/Redux
function useCarro() {
  const { dispatch } = useContext(CarroContext)
  
  const agregarAlCarrito = (producto) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: producto
    })
  }
  
  return { agregarAlCarrito }
}
```

---

#### Función: `buscarProductos()` (nueva)
```jsx
// micro-productos/src/components/BuscadorProductos.jsx
function BuscadorProductos({ onSearch }) {
  const [termino, setTermino] = useState('')
  
  const buscar = (termino) => {
    const resultados = productos.filter(p =>
      p.nombre.toLowerCase().includes(termino.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(termino.toLowerCase()) ||
      p.categoria.toLowerCase().includes(termino.toLowerCase())
    )
    onSearch(resultados)
  }
  
  return (
    <input 
      type="search"
      placeholder="Buscar productos..."
      onChange={(e) => {
        setTermino(e.target.value)
        buscar(e.target.value)
      }}
    />
  )
}
```

---

## 🟩 CANJES (Integrante 3 - Vue)

### Archivo Original: `tiendas-catalog.js` (líneas ~322-445)

#### Función: `realizarCompra()` (línea 322)
```javascript
// ORIGINAL
function realizarCompra() {
  const totalPuntos = carritoItems.reduce((sum, item) => {
    const puntos = parseInt(item.puntos) || 0
    const cantidad = parseInt(item.cantidad) || 1
    return sum + (puntos * cantidad)
  }, 0)
  
  const usuario = StorageService.obtenerUsuarioActivo()
  
  if (!usuario) {
    if (Utils && typeof Utils.mostrarToast === 'function')
      Utils.mostrarToast('Debes iniciar sesión', 'error')
    return
  }
  
  const puntosActuales = parseInt(usuario.puntos) || 0
  
  if (totalPuntos > puntosActuales) {
    mostrarToast('No tienes suficientes puntos', 'error')
    return
  }
  
  mostrarConfirmacion(totalPuntos)
}
```

**Migración a Vue:**
```vue
<!-- CarritoCanjes.vue -->
<template>
  <div class="carrito">
    <div v-for="item in carrito" :key="item.productoId" class="item">
      {{ item.nombre }} - {{ item.puntos }} puntos
      <input 
        v-model.number="item.cantidad" 
        @change="actualizarCarrito"
        type="number"
      />
      <button @click="quitarDelCarrito(item.productoId)">Quitar</button>
    </div>
    <button @click="realizarCompra" class="btn-comprar">
      Comprar ({{ totalPuntos }} puntos)
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCanjeStore } from '../stores/canjeStore'

const store = useCanjeStore()
const carrito = computed(() => store.carrito)

const totalPuntos = computed(() => 
  carrito.value.reduce((sum, item) => 
    sum + (item.puntos * item.cantidad), 0
  )
)

const realizarCompra = () => {
  const usuario = useAuthStore().usuario
  
  if (!usuario) {
    mostrarToast('Debes iniciar sesión', 'error')
    return
  }
  
  const puntosActuales = usuario.puntos || 0
  
  if (totalPuntos.value > puntosActuales) {
    mostrarToast('No tienes suficientes puntos', 'error')
    return
  }
  
  mostrarConfirmacion(totalPuntos.value)
}
</script>
```

---

#### Función: `confirmarCompra()` (línea 370)
```javascript
// ORIGINAL - Crea redemptions en Supabase
async function confirmarCompra() {
  submitBtn.disabled = true
  submitBtn.textContent = 'Procesando...'
  
  try {
    const usuario = StorageService.obtenerUsuarioActivo()
    
    for (let item of carritoItems) {
      for (let i = 0; i < item.cantidad; i++) {
        const redemption = {
          perfil_id: usuario.id,
          producto_id: item.productoId,
          puntos_usados: item.puntos
        }
        
        await fetch(`${supabase.url}/rest/v1/redemptions`, {
          method: 'POST',
          headers: { ... },
          body: JSON.stringify(redemption)
        })
      }
    }
    
    // Actualizar puntos del usuario
    const nuevosPuntos = usuario.puntos - totalPuntos
    await actualizarPuntosUsuario(usuario.id, nuevosPuntos)
    
    mostrarToast('Canje realizado exitosamente', 'success')
    carritoItems = []
    actualizarCarritoUI()
    
  } catch (err) {
    console.error('Error:', err)
    mostrarToast('Error al procesar canje', 'error')
  }
}
```

**Migración a Vue:**
```vue
<!-- ConfirmacionCanje.vue -->
<template>
  <div class="modal-confirmacion">
    <h2>Confirmar Canje</h2>
    <p>Vas a usar {{ totalPuntos }} puntos</p>
    <p>Puntos disponibles: {{ usuario.puntos }}</p>
    
    <button @click="procesarCanje" :disabled="procesando">
      {{ procesando ? 'Procesando...' : 'Confirmar Canje' }}
    </button>
    <button @click="cerrarModal">Cancelar</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCanjeStore } from '../stores/canjeStore'
import { useAuthStore } from '../stores/authStore'
import { procesarCanjeEnSupabase } from '../services/canjeService'

const canjeStore = useCanjeStore()
const authStore = useAuthStore()
const procesando = ref(false)

const procesarCanje = async () => {
  procesando.value = true
  
  try {
    // Procesar cada item del carrito
    for (const item of canjeStore.carrito) {
      for (let i = 0; i < item.cantidad; i++) {
        await procesarCanjeEnSupabase({
          perfilId: authStore.usuario.id,
          productoId: item.productoId,
          puntosUsados: item.puntos
        })
      }
    }
    
    // Actualizar puntos en auth store
    const nuevosPuntos = authStore.usuario.puntos - canjeStore.totalPuntos
    authStore.actualizarPuntos(nuevosPuntos)
    
    // Emitir evento
    eventBus.emit('canje-completado', {
      usuario: authStore.usuario.id,
      puntos: canjeStore.totalPuntos,
      items: canjeStore.carrito
    })
    
    // Limpiar carrito
    canjeStore.limpiarCarrito()
    
    mostrarToast('Canje realizado exitosamente', 'success')
    cerrarModal()
    
  } catch (err) {
    console.error('Error:', err)
    mostrarToast('Error al procesar canje', 'error')
  } finally {
    procesando.value = false
  }
}
</script>
```

---

#### Función: `validarPuntos()` (nueva)
```vue
<!-- ResumenPuntos.vue -->
<template>
  <div class="resumen-puntos">
    <div class="puntos-disponibles">
      <h3>Puntos Disponibles</h3>
      <p :class="{ 'suficientes': tieneNegociarPuntos, 'insuficientes': !tieneNegociarPuntos }">
        {{ usuario.puntos }}
      </p>
    </div>
    
    <div class="puntos-a-usar">
      <h3>Puntos a Usar</h3>
      <p>{{ carrito.totalPuntos }}</p>
    </div>
    
    <div v-if="!tieneNegociarPuntos" class="alerta">
      No tienes suficientes puntos para este canje
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCanjeStore } from '../stores/canjeStore'
import { useAuthStore } from '../stores/authStore'

const canjeStore = useCanjeStore()
const authStore = useAuthStore()

const usuario = computed(() => authStore.usuario)
const tieneNegociarPuntos = computed(() => 
  usuario.value.puntos >= canjeStore.totalPuntos
)
</script>
```

---

## 📋 Tabla Resumen

| Función Original | Ubicación Original | Componente Destino | Framework | Integrante |
|-----------------|-------------------|------------------|-----------|-----------|
| `mostrarHistorial()` | app.js:505 | HistorialCompras.vue | Vue | 1 |
| `cargarHistorialDesdeSupabase()` | tiendas-catalog.js | historialService.js | Vue | 1 |
| `calcularEstadisticas()` | app.js | EstadisticasPuntos.vue | Vue | 1 |
| `cargarTiendasYProductos()` | tiendas-catalog.js:47 | CatalogoProductos.jsx | React | 2 |
| `mostrarTiendas()` | tiendas-catalog.js:111 | CatalogoProductos.jsx | React | 2 |
| `aplicarFiltros()` | tiendas-catalog.js:520 | FiltrosCategoria.jsx | React | 2 |
| `buscarProductos()` | (nueva) | BuscadorProductos.jsx | React | 2 |
| `agregarAlCarrito()` | tiendas-catalog.js:169 | CatalogoProductos.jsx | React | 2 |
| `mostrarDetalle()` | tiendas-catalog.js | DetalleProducto.jsx | React | 2 |
| `realizarCompra()` | tiendas-catalog.js:322 | CarritoCanjes.vue | Vue | 3 |
| `confirmarCompra()` | tiendas-catalog.js:370 | ConfirmacionCanje.vue | Vue | 3 |
| `validarPuntos()` | (nueva) | ResumenPuntos.vue | Vue | 3 |
| `actualizarCarritoUI()` | tiendas-catalog.js:242 | CarritoCanjes.vue | Vue | 3 |

---

## 🔄 Flujo de Datos de Ejemplo

```
1. Usuario ve productos en Micro Productos (React)
   └─ CatalogoProductos.jsx carga productos
   
2. Usuario hace clic en "Agregar al Carrito"
   └─ eventBus.emit('add-to-cart', { producto })
   
3. Micro Canjes (Vue) escucha el evento
   └─ CarritoCanjes.vue agrega a su carrito local
   
4. Usuario hace clic en "Confirmar Canje"
   └─ ConfirmacionCanje.vue valida puntos
   └─ procesarCanjeEnSupabase() inserta redemptions
   
5. Actualizar historial en Micro Historial
   └─ eventBus.emit('canje-completado', {...})
   └─ HistorialCompras.vue recibe evento y se actualiza
```

---

**Última actualización**: Enero 2026
