<template>
  <div class="carrito-container">
    <Notification 
      :message="notificacion.message"
      :type="notificacion.type"
      :duration="3000"
    />
    
    <h2>🛒 Carrito de Canjes</h2>

    <div v-if="store.carrito.length === 0" class="empty">
      <p>Tu carrito está vacío</p>
    </div>

    <div v-else>
      <div class="items-list">
        <div v-for="item in store.carrito" :key="item.id" class="item">
          <div class="item-info">
            <h4>{{ item.nombre }}</h4>
            <p class="puntos">⭐ {{ item.puntos_unitarios }} puntos</p>
          </div>
          <button @click="remover(item.id)" class="btn-remover">
            ✕
          </button>
        </div>
      </div>

      <div class="resumen">
        <div class="resumen-row">
          <span>Items:</span>
          <strong>{{ store.cantidadItems }}</strong>
        </div>
        <div class="resumen-row">
          <span>Puntos Totales:</span>
          <strong>{{ store.puntosTotal }} ⭐</strong>
        </div>
        <div class="resumen-row" :class="{ insufficient: !puntosValidos }">
          <span>Puntos Disponibles:</span>
          <strong>{{ store.puntosDisponibles }} ⭐</strong>
        </div>
      </div>

      <button 
        @click="confirmar"
        :disabled="!puntosValidos || cargando"
        class="btn-confirmar"
      >
        {{ cargando ? 'Procesando...' : 'Confirmar Canjes' }}
      </button>

      <button @click="limpiar" class="btn-limpiar">
        Limpiar Carrito
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useCanjeStore } from '../stores/canjeStore'
import { canjeService } from '../services/canjeService'
import eventBus from '@shared/eventBus'
import Notification from './Notification.vue'

const store = useCanjeStore()
const cargando = ref(false)
const usuario = ref(null)
const notificacion = ref({
  message: '',
  type: 'success'
})

const puntosValidos = computed(() => {
  return store.puntosDisponibles >= store.puntosTotal
})

onMounted(() => {
  eventBus.on('usuario-sesion', (usuarioData) => {
    usuario.value = usuarioData
  })
})

const remover = (productoId) => {
  store.removerProducto(productoId)
}

const confirmar = async () => {
  if (!usuario.value?.id) {
    console.error('Usuario no autenticado')
    return
  }

  cargando.value = true
  try {
    // Calcular puntos restantes
    const puntosUsados = store.puntosTotal
    await canjeService.procesarCanjes(
      usuario.value.id,
      store.carrito,
      store.puntosDisponibles
    )
    
    const puntosRestantes = store.puntosDisponibles - puntosUsados
    
    // Actualizar puntos en el store
    store.setPuntosDisponibles(puntosRestantes)
    
    // Mostrar notificación de éxito
    notificacion.value.message = '✓ Canjes realizados exitosamente'
    notificacion.value.type = 'success'
    
    // Notificar al padre (micro-productos) que los puntos se actualizaron
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'canje-completado',
        puntosRestantes: puntosRestantes,
        puntosUsados: puntosUsados
      }, '*')
    }
    
    // Emitir evento local
    eventBus.emit('canje-exitoso', {
      puntosRestantes,
      puntosUsados
    })
    
    store.limpiarCarrito()
  } catch (error) {
    console.error('Error en canje:', error)
    
    notificacion.value.message = '❌ Error al realizar los canjes'
    notificacion.value.type = 'error'
  } finally {
    cargando.value = false
  }
}

const limpiar = () => {
  store.limpiarCarrito()
}
</script>

<style scoped>
.carrito-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.item-info h4 {
  margin: 0 0 0.5rem 0;
}

.item-info .puntos {
  margin: 0;
  color: #007bff;
  font-weight: bold;
}

.btn-remover {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  width: 32px;
  height: 32px;
}

.resumen {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.resumen-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.resumen-row.insufficient {
  color: #dc3545;
}

.btn-confirmar,
.btn-limpiar {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.btn-confirmar {
  background: #28a745;
  color: white;
}

.btn-confirmar:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-limpiar {
  background: #6c757d;
  color: white;
}
</style>
