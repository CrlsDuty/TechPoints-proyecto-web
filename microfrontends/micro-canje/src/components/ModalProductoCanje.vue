<template>
  <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
    <div class="modal-contenido">
      <button class="btn-cerrar" @click="cerrar">✕</button>

      <div class="modal-body">
        <!-- Imagen del producto -->
        <div class="imagen-container">
          <img
            :src="producto.imagen_url || 'https://via.placeholder.com/300?text=Sin+imagen'"
            :alt="producto.nombre"
            class="imagen-producto"
          />
        </div>

        <!-- Datos del producto -->
        <div class="datos-producto">
          <h2 class="nombre">{{ producto.nombre }}</h2>

          <!-- Tienda -->
          <div class="tienda-info">
            <span class="label">Tienda:</span>
            <span class="valor">{{ producto.tienda_nombre || 'Tienda desconocida' }}</span>
          </div>

          <!-- Descripción -->
          <div v-if="producto.descripcion" class="descripcion">
            <p>{{ producto.descripcion }}</p>
          </div>

          <!-- Precios -->
          <div class="precios-section">
            <div class="precio-item">
              <span class="label">⭐ Costo en Puntos:</span>
              <span class="valor puntos">{{ producto.costo_puntos || 0 }} puntos</span>
            </div>
            <div v-if="producto.precio_dolar" class="precio-item">
              <span class="label">💵 Precio:</span>
              <span class="valor">USD ${{ producto.precio_dolar.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Stock -->
          <div class="stock-section">
            <span class="label">Stock disponible:</span>
            <div class="stock-info" :class="{ 'sin-stock': stock <= 0 }">
              <span v-if="stock > 0" class="stock-ok">✓ {{ stock }} unidades</span>
              <span v-else class="stock-sin">Sin stock</span>
            </div>
          </div>

          <!-- Validaciones -->
          <div v-if="puntosActuales < producto.costo_puntos" class="alerta alerta-error">
            <span>❌ No tienes suficientes puntos</span>
            <span class="puntos-falta">Necesitas {{ producto.costo_puntos - puntosActuales }} puntos más</span>
          </div>

          <div v-if="stock <= 0" class="alerta alerta-advertencia">
            <span>⚠️ Este producto no tiene stock disponible</span>
          </div>

          <!-- Información de puntos del usuario -->
          <div class="usuario-puntos">
            <div class="puntos-disponibles">
              <span class="label">Tus puntos disponibles:</span>
              <span class="valor puntos">{{ puntosActuales }} ⭐</span>
            </div>
            <div v-if="puntosActuales >= producto.costo_puntos" class="puntos-despues">
              <span class="label">Te quedarán:</span>
              <span class="valor puntos-restantes">{{ puntosActuales - producto.costo_puntos }} ⭐</span>
            </div>
          </div>

          <!-- Botones -->
          <div class="botones">
            <button 
              @click="confirmarCanje"
              :disabled="!puedeCanjear"
              class="btn btn-confirmar"
            >
              ✓ Añadir al Carrito
            </button>
            <button @click="cerrar" class="btn btn-cancelar">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCanjeStore } from '../stores/canjeStore'

const props = defineProps({
  producto: {
    type: Object,
    required: true
  },
  mostrar: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cerrar', 'confirmar'])

const store = useCanjeStore()

const stock = computed(() => parseInt(props.producto.stock, 10) || 0)
const puntosActuales = computed(() => store.puntosDisponibles)

const puedeCanjear = computed(() => {
  return stock.value > 0 && puntosActuales.value >= props.producto.costo_puntos
})

const cerrar = () => {
  emit('cerrar')
}

const confirmarCanje = () => {
  if (puedeCanjear.value) {
    store.agregarProducto(props.producto)
    emit('confirmar')
    cerrar()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-contenido {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.btn-cerrar {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  color: #999;
  transition: color 0.2s;
}

.btn-cerrar:hover {
  color: #333;
}

.modal-body {
  padding: 2rem;
}

.imagen-container {
  margin-bottom: 2rem;
  text-align: center;
}

.imagen-producto {
  max-width: 100%;
  height: auto;
  max-height: 300px;
  border-radius: 8px;
  object-fit: cover;
}

.datos-producto {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.nombre {
  font-size: 1.8rem;
  margin: 0;
  color: #333;
}

.tienda-info,
.precio-item,
.label-span {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-weight: 600;
  color: #666;
  font-size: 0.95rem;
}

.valor {
  color: #333;
  font-weight: 500;
}

.puntos {
  color: #007bff;
  font-weight: bold;
  font-size: 1.1rem;
}

.descripcion {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.descripcion p {
  margin: 0;
  color: #555;
  line-height: 1.5;
}

.precios-section {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  background: #f0f7ff;
  padding: 1rem;
  border-radius: 8px;
}

.precio-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stock-info {
  padding: 0.75rem;
  border-radius: 6px;
  background: #e7f5e7;
  color: #28a745;
  font-weight: bold;
}

.stock-info.sin-stock {
  background: #ffe7e7;
  color: #dc3545;
}

.stock-ok {
  color: #28a745;
}

.stock-sin {
  color: #dc3545;
}

.alerta {
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 500;
}

.alerta-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alerta-advertencia {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.puntos-falta {
  font-size: 0.9rem;
  opacity: 0.9;
}

.usuario-puntos {
  background: #e8f5e9;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.puntos-disponibles,
.puntos-despues {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.puntos-restantes {
  color: #4caf50;
  font-size: 1.1rem;
}

.botones {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-confirmar {
  background: #28a745;
  color: white;
}

.btn-confirmar:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
}

.btn-confirmar:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-cancelar {
  background: #6c757d;
  color: white;
}

.btn-cancelar:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

@media (max-width: 600px) {
  .modal-contenido {
    width: 95%;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .nombre {
    font-size: 1.4rem;
  }

  .botones {
    flex-direction: column;
  }
}
</style>
