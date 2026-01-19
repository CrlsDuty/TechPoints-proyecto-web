import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHistorialStore = defineStore('historial', () => {
  const compras = ref([])
  const canjes = ref([])
  const cargando = ref(false)
  const error = ref(null)

  const setCompras = (nuevasCompras) => {
    compras.value = nuevasCompras
  }

  const setCanjes = (nuevosCanjes) => {
    canjes.value = nuevosCanjes
  }

  const agregarCompra = (compra) => {
    compras.value.push(compra)
  }

  const agregarCanje = (canje) => {
    canjes.value.push(canje)
  }

  const setCargando = (estado) => {
    cargando.value = estado
  }

  const setError = (mensaje) => {
    error.value = mensaje
  }

  return {
    compras,
    canjes,
    cargando,
    error,
    setCompras,
    setCanjes,
    agregarCompra,
    agregarCanje,
    setCargando,
    setError
  }
})
