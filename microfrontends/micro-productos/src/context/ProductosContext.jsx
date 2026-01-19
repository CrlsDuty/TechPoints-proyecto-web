import React, { createContext, useState, useCallback } from 'react'
import { obtenerProductos } from '../../../shared/supabaseClient'

export const ProductosContext = createContext()

export const ProductosProvider = ({ children }) => {
  const [productos, setProductos] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState({
    categoria: null,
    busqueda: '',
    precioMin: 0,
    precioMax: Infinity
  })

  const cargarProductos = useCallback(async (filtrosAplicar = filtros) => {
    setCargando(true)
    try {
      const datos = await obtenerProductos({
        categoria: filtrosAplicar.categoria,
        busqueda: filtrosAplicar.busqueda
      })
      setProductos(datos)
      aplicarFiltros(datos, filtrosAplicar)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  const aplicarFiltros = (listaProductos, filtrosAplicar) => {
    let filtrados = listaProductos

    if (filtrosAplicar.busqueda) {
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(filtrosAplicar.busqueda.toLowerCase())
      )
    }

    if (filtrosAplicar.precioMin !== undefined) {
      filtrados = filtrados.filter(p => p.costo_puntos >= filtrosAplicar.precioMin)
    }

    if (filtrosAplicar.precioMax !== undefined) {
      filtrados = filtrados.filter(p => p.costo_puntos <= filtrosAplicar.precioMax)
    }

    setProductosFiltrados(filtrados)
  }

  const actualizarFiltros = (nuevosFiltros) => {
    const filtrosActualizados = { ...filtros, ...nuevosFiltros }
    setFiltros(filtrosActualizados)
    aplicarFiltros(productos, filtrosActualizados)
  }

  return (
    <ProductosContext.Provider value={{
      productos,
      productosFiltrados,
      cargando,
      error,
      filtros,
      cargarProductos,
      actualizarFiltros
    }}>
      {children}
    </ProductosContext.Provider>
  )
}

export const useProductos = () => {
  const context = React.useContext(ProductosContext)
  if (!context) {
    throw new Error('useProductos debe usarse dentro de ProductosProvider')
  }
  return context
}
