<template>
  <div class="app">
    <div v-if="!cargando">
      <ModalProductoCanje 
        :producto="productoSeleccionado"
        :mostrar="mostrarModal"
        @cerrar="cerrarModal"
        @confirmar="confirmarCanje"
      />
      <CarritoCanjes />
    </div>
    <div v-else class="loading">
      <p>Cargando...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CarritoCanjes from './components/CarritoCanjes.vue'
import ModalProductoCanje from './components/ModalProductoCanje.vue'

// Escuchar evento add-to-cart del EventBus
import eventBus from '@shared/eventBus'
import { useCanjeStore } from './stores/canjeStore'

const store = useCanjeStore()
const mostrarModal = ref(false)
const productoSeleccionado = ref(null)
const cargando = ref(true)

const cerrarModal = () => {
  mostrarModal.value = false
  productoSeleccionado.value = null
}

const confirmarCanje = () => {
  cerrarModal()
}

onMounted(() => {
  console.log('[Micro-Canje] App montada')
  cargando.value = false
  
  eventBus.on('add-to-cart', (datos) => {
    console.log('[Micro-Canje] Producto agregado al carrito:', datos)
    productoSeleccionado.value = datos.producto
    mostrarModal.value = true
  })

  eventBus.on('usuario-sesion', (usuario) => {
    console.log('[Micro-Canje] Usuario recibido:', usuario.email)
    store.setPuntosDisponibles(usuario.puntos || 0)
  })
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-size: 1.2rem;
  color: #666;
}
</style>
