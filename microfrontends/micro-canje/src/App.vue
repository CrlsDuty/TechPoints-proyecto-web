<template>
  <div class="app">
    <ModalProductoCanje 
      :producto="productoSeleccionado"
      :mostrar="mostrarModal"
      @cerrar="cerrarModal"
      @confirmar="confirmarCanje"
    />
    <CarritoCanjes />
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

const cerrarModal = () => {
  mostrarModal.value = false
  productoSeleccionado.value = null
}

const confirmarCanje = () => {
  cerrarModal()
}

onMounted(() => {
  eventBus.on('add-to-cart', (datos) => {
    productoSeleccionado.value = datos.producto
    mostrarModal.value = true
  })

  eventBus.on('usuario-sesion', (usuario) => {
    store.setPuntosDisponibles(usuario.puntos)
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
</style>
