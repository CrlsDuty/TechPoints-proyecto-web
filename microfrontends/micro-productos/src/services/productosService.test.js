import { describe, it, expect } from 'vitest'
import { productosService, TASA_CONVERSION } from './productosService'

describe('productosService', () => {
  describe('obtenerCategorias', () => {
    it('debe extraer categorías únicas de una lista de productos', () => {
      const productos = [
        { id: 1, nombre: 'Laptop', categoria: 'Electrónica' },
        { id: 2, nombre: 'Mouse', categoria: 'Periféricos' },
        { id: 3, nombre: 'Teclado', categoria: 'Periféricos' },
        { id: 4, nombre: 'Monitor', categoria: 'Electrónica' }
      ]

      const categorias = productosService.obtenerCategorias(productos)
      
      expect(categorias).toEqual(expect.arrayContaining(['Electrónica', 'Periféricos']))
      expect(categorias.length).toBe(2)
    })

    it('debe retornar array vacío para lista vacía', () => {
      const categorias = productosService.obtenerCategorias([])
      expect(categorias).toEqual([])
    })
  })

  describe('obtenerRangoPrecio', () => {
    it('debe retornar el rango de precios correcto', () => {
      const productos = [
        { costo_puntos: 100 },
        { costo_puntos: 500 },
        { costo_puntos: 250 }
      ]

      const rango = productosService.obtenerRangoPrecio(productos)
      
      expect(rango.min).toBe(100)
      expect(rango.max).toBe(500)
    })

    it('debe retornar {min: 0, max: 0} para lista vacía', () => {
      const rango = productosService.obtenerRangoPrecio([])
      expect(rango).toEqual({ min: 0, max: 0 })
    })
  })

  describe('formatearPuntos', () => {
    it('debe formatear puntos con separador de miles', () => {
      expect(productosService.formatearPuntos(1000)).toBe('1.000')
      expect(productosService.formatearPuntos(27078)).toBe('27.078')
      expect(productosService.formatearPuntos(100)).toBe('100')
    })
  })

  describe('TASA_CONVERSION', () => {
    it('debe tener la tasa de conversión correcta', () => {
      expect(TASA_CONVERSION).toBe(100)
    })
  })
})
