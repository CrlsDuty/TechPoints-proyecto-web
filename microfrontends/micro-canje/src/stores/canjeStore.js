import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCanjeStore = defineStore('canje', () => {
  const carrito = ref([])
  const puntosDisponibles = ref(0)
  const cargando = ref(false)
  const error = ref(null)

  const cantidadItems = computed(() => carrito.value.length)
  
  const puntosTotal = computed(() => {
    return carrito.value.reduce((sum, item) => sum + item.puntos_unitarios, 0)
  })

  const agregarProducto = (producto) => {
    const existe = carrito.value.find(item => item.id === producto.id)
    if (existe) {
      existe.cantidad++
    } else {
      carrito.value.push({
        ...producto,
        cantidad: 1,
        puntos_unitarios: producto.costo_puntos
      })
    }
  }

  const removerProducto = (productoId) => {
    carrito.value = carrito.value.filter(item => item.id !== productoId)
  }

  const limpiarCarrito = () => {
    carrito.value = []
  }

  const setPuntosDisponibles = (puntos) => {
    puntosDisponibles.value = puntos
  }

  return {
    carrito,
    puntosDisponibles,
    cantidadItems,
    puntosTotal,
    cargando,
    error,
    agregarProducto,
    removerProducto,
    limpiarCarrito,
    setPuntosDisponibles
  }
})
