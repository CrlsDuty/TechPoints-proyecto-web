import { useEffect } from 'react'
import { useProductos } from '../context/ProductosContext'

export const useProductosHook = () => {
  const { productos, cargarProductos } = useProductos()

  useEffect(() => {
    cargarProductos()
  }, [])

  return {
    productos,
    cargarProductos
  }
}

export const useFiltros = () => {
  const { filtros, actualizarFiltros } = useProductos()

  const setBusqueda = (busqueda) => {
    actualizarFiltros({ busqueda })
  }

  const setCategoria = (categoria) => {
    actualizarFiltros({ categoria })
  }

  const setRangoPrecio = (precioMin, precioMax) => {
    actualizarFiltros({ precioMin, precioMax })
  }

  return {
    filtros,
    setBusqueda,
    setCategoria,
    setRangoPrecio
  }
}
