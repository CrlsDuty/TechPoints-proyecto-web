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
      <div v-for="canje in canjes" :key="canje.id" class="canje-item">
        <div class="canje-info">
          <h4>{{ canje.product?.nombre }}</h4>
          <p>{{ formatearFecha(canje.creado_at) }}</p>
        </div>
        <div class="canje-puntos">
          <span class="puntos-badge">{{ canje.puntos_usados }} ⭐</span>
        </div>
      </div>
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

const store = useHistorialStore()
const usuario = ref(null)

const canjes = computed(() => store.canjes)
const cargando = computed(() => store.cargando)

const puntosUsadosTotal = computed(() => {
  return canjes.value.reduce((sum, c) => sum + c.puntos_usados, 0)
})

const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES')
}

const cargarHistorial = async () => {
  store.setCargando(true)
  try {
    // El usuario vendría del AuthContext del shell
    if (usuario.value?.id) {
      const datos = await historialService.cargarHistorialCanjes(usuario.value.id)
      store.setCanjes(datos)
    }
  } catch (error) {
    store.setError(error.message)
  } finally {
    store.setCargando(false)
  }
}

onMounted(() => {
  cargarHistorial()
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
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.canje-info h4 {
  margin: 0 0 0.5rem 0;
}

.canje-info p {
  margin: 0;
  color: #999;
  font-size: 0.9rem;
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
</style>
