<template>
  <div class="app">
    <CarritoCanjes />
  </div>
</template>

<script setup>
import CarritoCanjes from './components/CarritoCanjes.vue'

// Escuchar evento add-to-cart del EventBus
import { onMounted } from 'vue'
import eventBus from '@shared/eventBus'
import { useCanjeStore } from './stores/canjeStore'

const store = useCanjeStore()

onMounted(() => {
  eventBus.on('add-to-cart', (datos) => {
    store.agregarProducto(datos.producto)
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
