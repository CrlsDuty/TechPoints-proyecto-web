import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { ProductosProvider, useProductos } from './ProductosContext'
import React from 'react'

describe('ProductosContext', () => {
  const wrapper = ({ children }) => (
    <ProductosProvider usuarioExterno={null}>{children}</ProductosProvider>
  )

  it('debe proporcionar el contexto de productos', () => {
    const { result } = renderHook(() => useProductos(), { wrapper })
    
    expect(result.current).toBeDefined()
    expect(result.current.productosFiltrados).toBeDefined()
    expect(result.current.filtros).toBeDefined()
  })

  it('debe iniciar con filtros vacíos', () => {
    const { result } = renderHook(() => useProductos(), { wrapper })
    
    expect(result.current.filtros).toEqual({
      busqueda: '',
      categoria: '',
      tienda_id: null
    })
  })

  it('debe proporcionar función actualizarFiltros', () => {
    const { result } = renderHook(() => useProductos(), { wrapper })
    
    expect(typeof result.current.actualizarFiltros).toBe('function')
  })

  it('debe proporcionar funciones CRUD de productos', () => {
    const { result } = renderHook(() => useProductos(), { wrapper })
    
    expect(typeof result.current.agregarProducto).toBe('function')
    expect(typeof result.current.actualizarProducto).toBe('function')
    expect(typeof result.current.eliminarProducto).toBe('function')
    expect(typeof result.current.canjearProducto).toBe('function')
  })

  it('debe iniciar con cargando=true', () => {
    const { result } = renderHook(() => useProductos(), { wrapper })
    
    expect(result.current.cargando).toBe(true)
  })
})
