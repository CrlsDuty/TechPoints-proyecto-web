<template>
  <div class="historial-container">
    <h2>📊 Historial de Canjes</h2>
    
    <div v-if="cargando" class="loading">
      Cargando historial...
    </div>

    <div v-else-if="canjes.length === 0" class="empty">
      <p>No tienes canjes aún</p>
    </div>

    <div v-else class="canjes-list">
      <div v-for="canje in canjesPaginados" :key="canje.id" class="canje-item">
        <div class="canje-imagen" v-if="canje.product?.imagen_url">
          <img :src="canje.product.imagen_url" :alt="canje.product.nombre" />
        </div>
        <div class="canje-info">
          <h4>{{ canje.product?.nombre || 'Producto no disponible' }}</h4>
          <p class="descripcion">{{ canje.product?.descripcion }}</p>
          <div class="meta-info">
            <span class="tienda" v-if="canje.product?.tienda">
              🏪 {{ canje.product.tienda.nombre }}
            </span>
            <span class="categoria" v-if="canje.product?.categoria">
              📦 {{ canje.product.categoria }}
            </span>
            <span class="fecha">📅 {{ formatearFecha(canje.creado_at) }}</span>
          </div>
          <div class="estado-info">
            <span :class="['estado-badge', canje.estado]">{{ canje.estado.toUpperCase() }}</span>
          </div>
        </div>
        <div class="canje-puntos">
          <span class="puntos-badge">{{ canje.puntos_usados }} ⭐</span>
          <p class="precio-ref" v-if="canje.product?.precio_dolar">${{ canje.product.precio_dolar }}</p>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="!cargando && canjes.length > canjesPorPagina" class="paginacion">
      <button 
        @click="paginaActual--" 
        :disabled="paginaActual === 1"
        class="btn-pagina"
      >
        ← Anterior
      </button>
      
      <div class="paginas-numeros">
        <button
          v-for="pagina in totalPaginas"
          :key="pagina"
          @click="paginaActual = pagina"
          :class="['btn-numero', { activo: paginaActual === pagina }]"
        >
          {{ pagina }}
        </button>
      </div>
      
      <button 
        @click="paginaActual++" 
        :disabled="paginaActual === totalPaginas"
        class="btn-pagina"
      >
        Siguiente →
      </button>
    </div>

    <div v-if="!cargando && canjes.length > 0" class="estadisticas">
      <div class="stat">
        <h4>Total de Canjes</h4>
        <p>{{ canjes.length }}</p>
      </div>
      <div class="stat">
        <h4>Puntos Usados</h4>
        <p>{{ puntosUsadosTotal }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHistorialStore } from '../stores/historialStore'
import { historialService } from '../services/historialService'
import { supabase } from '../utils/supabase'

const store = useHistorialStore()
const usuario = ref(null)
const paginaActual = ref(1)
const canjesPorPagina = 20

const canjes = computed(() => store.canjes)
const cargando = computed(() => store.cargando)

// Calcular total de páginas
const totalPaginas = computed(() => {
  return Math.ceil(canjes.value.length / canjesPorPagina)
})

// Obtener canjes de la página actual
const canjesPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * canjesPorPagina
  const fin = inicio + canjesPorPagina
  return canjes.value.slice(inicio, fin)
})

const puntosUsadosTotal = computed(() => {
  return canjes.value.reduce((sum, c) => sum + c.puntos_usados, 0)
})

const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const cargarHistorial = async () => {
  store.setCargando(true)
  try {
    // Obtener usuario autenticado de Supabase
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      usuario.value = user
      console.log('[Historial] Usuario obtenido:', user.email)
      
      const datos = await historialService.cargarHistorialCanjes(user.id)
      console.log('[Historial] Canjes cargados:', datos.length)
      store.setCanjes(datos)
    } else {
      console.warn('[Historial] No hay usuario autenticado')
      store.setCanjes([])
    }
  } catch (error) {
    console.error('[Historial] Error:', error)
    store.setError(error.message)
  } finally {
    store.setCargando(false)
  }
}

// Escuchar cambios de sesión
onMounted(async () => {
  console.log('[Historial] Componente montado')
  
  // Cargar historial inicial
  await cargarHistorial()
  
  // Escuchar evento de canje completado para recargar
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'canje-completado') {
      console.log('[Historial] Recargando después de canje')
      cargarHistorial()
    }
  })
  
  // Listener de cambios de autenticación
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      console.log('[Historial] Usuario autenticado')
      cargarHistorial()
    }
  })
})
</script>

<style scoped>
.historial-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.loading,
.empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.canjes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.canje-item {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.canje-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.canje-imagen {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}

.canje-imagen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.canje-info {
  flex: 1;
}

.canje-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.canje-info .descripcion {
  margin: 0 0 0.75rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.meta-info span {
  font-size: 0.85rem;
  color: #666;
}

.tienda {
  font-weight: 600;
  color: #007bff;
}

.categoria {
  color: #28a745;
}

.fecha {
  color: #999;
}

.estado-info {
  margin-top: 0.5rem;
}

.estado-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.estado-badge.completado {
  background: #d4edda;
  color: #155724;
}

.estado-badge.pendiente {
  background: #fff3cd;
  color: #856404;
}

.estado-badge.cancelado {
  background: #f8d7da;
  color: #721c24;
}

.canje-puntos {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.precio-ref {
  margin: 0;
  font-size: 0.9rem;
  color: #999;
  text-decoration: line-through;
}

.puntos-badge {
  background: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
}

.estadisticas {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 2rem;
}

.stat {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat h4 {
  margin: 0 0 0.5rem 0;
  color: #666;
}

.stat p {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

/* Estilos de paginación */
.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  padding: 1.5rem 0;
}

.btn-pagina {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-pagina:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-pagina:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  box-shadow: none;
}

.paginas-numeros {
  display: flex;
  gap: 0.5rem;
}

.btn-numero {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
  background: white;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-numero:hover {
  border-color: #667eea;
  color: #667eea;
  transform: scale(1.1);
}

.btn-numero.activo {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
