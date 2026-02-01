import React, { createContext, useState, useCallback, useEffect } from 'react'
import { supabase, getPerfilUsuario } from '../utils/supabase'
import { productosService } from '../services/productosService'

export const ProductosContext = createContext()

export const ProductosProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
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

  const aplicarFiltros = useCallback((lista, f) => {
    let filtrados = lista || []
    if (f.busqueda) {
      filtrados = filtrados.filter((p) =>
        p.nombre.toLowerCase().includes(f.busqueda.toLowerCase())
      )
    }
    if (f.categoria) {
      filtrados = filtrados.filter((p) => p.categoria === f.categoria)
    }
    if (f.precioMin != null) {
      filtrados = filtrados.filter((p) => p.costo_puntos >= f.precioMin)
    }
    if (f.precioMax != null && f.precioMax !== Infinity) {
      filtrados = filtrados.filter((p) => p.costo_puntos <= f.precioMax)
    }
    setProductosFiltrados(filtrados)
  }, [])

  const cargarProductos = useCallback(
    async (filtrosAplicar = filtros) => {
      setCargando(true)
      setError(null)
      try {
        let datos
        if (usuario?.role === 'tienda' && usuario?.id) {
          datos = await productosService.obtenerProductosPorTienda(usuario.id)
        } else {
          datos = await productosService.obtenerProductos({
            categoria: filtrosAplicar.categoria,
            busqueda: filtrosAplicar.busqueda
          })
        }
        setProductos(datos)
        aplicarFiltros(datos, filtrosAplicar)
      } catch (err) {
        setError(err?.message || 'Error al cargar productos')
        setProductos([])
        setProductosFiltrados([])
      } finally {
        setCargando(false)
      }
    },
    [usuario?.id, usuario?.role, filtros, aplicarFiltros]
  )

  const actualizarFiltros = useCallback(
    (nuevosFiltros) => {
      const f = { ...filtros, ...nuevosFiltros }
      setFiltros(f)
      aplicarFiltros(productos, f)
    },
    [filtros, productos, aplicarFiltros]
  )

  const refetch = useCallback(() => {
    return cargarProductos(filtros)
  }, [cargarProductos, filtros])

  const agregarProducto = useCallback(
    async (payload) => {
      if (!usuario?.id) return { success: false, message: 'No autenticado' }
      const res = await productosService.agregarProducto(usuario.id, payload)
      if (res.success) await refetch()
      return res
    },
    [usuario?.id, refetch]
  )

  const actualizarProducto = useCallback(
    async (productoId, payload) => {
      if (!usuario?.id) return { success: false, message: 'No autenticado' }
      const res = await productosService.actualizarProducto(productoId, usuario.id, payload)
      if (res.success) await refetch()
      return res
    },
    [usuario?.id, refetch]
  )

  const eliminarProducto = useCallback(
    async (productoId) => {
      if (!usuario?.id) return { success: false, message: 'No autenticado' }
      const res = await productosService.eliminarProducto(productoId, usuario.id)
      if (res.success) await refetch()
      return res
    },
    [usuario?.id, refetch]
  )

  const canjearProducto = useCallback(
    async (productoId) => {
      if (!usuario?.id) return { success: false, message: 'Debes iniciar sesión para canjear' }
      const res = await productosService.canjearProducto(usuario.id, productoId)
      if (res.success && res.puntosRestantes != null) {
        setUsuario((u) => (u ? { ...u, puntos: res.puntosRestantes } : u))
        await refetch()
      }
      return res
    },
    [usuario?.id, refetch]
  )

  useEffect(() => {
    const init = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (session?.user) {
        const perfil = await getPerfilUsuario(session.user.id)
        setUsuario({
          id: session.user.id,
          email: session.user.email,
          nombre: perfil?.nombre || session.user.email?.split('@')[0],
          puntos: perfil?.puntos ?? 0,
          role: perfil?.role || 'cliente'
        })
      } else {
        setUsuario(null)
      }
    }
    init()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const perfil = await getPerfilUsuario(session.user.id)
        setUsuario({
          id: session.user.id,
          email: session.user.email,
          nombre: perfil?.nombre || session.user.email?.split('@')[0],
          puntos: perfil?.puntos ?? 0,
          role: perfil?.role || 'cliente'
        })
      } else {
        setUsuario(null)
      }
    })
    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    cargarProductos()
    // Solo recargar cuando cambie el usuario (rol/tienda); filtros se aplican en cliente
  }, [usuario?.id, usuario?.role])

  return (
    <ProductosContext.Provider
      value={{
        usuario,
        productos,
        productosFiltrados,
        cargando,
        error,
        filtros,
        cargarProductos,
        actualizarFiltros,
        refetch,
        agregarProducto,
        actualizarProducto,
        eliminarProducto,
        canjearProducto
      }}
    >
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
