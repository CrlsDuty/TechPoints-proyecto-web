/**
 * Servicio para productos
 */

export const productosService = {
  /**
   * Obtener categorías únicas
   */
  obtenerCategorias(productos) {
    const categorias = new Set(productos.map(p => p.categoria).filter(Boolean))
    return Array.from(categorias)
  },

  /**
   * Obtener rango de precios
   */
  obtenerRangoPrecio(productos) {
    if (productos.length === 0) return { min: 0, max: 0 }
    
    const precios = productos.map(p => p.costo_puntos)
    return {
      min: Math.min(...precios),
      max: Math.max(...precios)
    }
  },

  /**
   * Formatear precio
   */
  formatearPuntos(puntos) {
    return new Intl.NumberFormat('es-ES').format(puntos)
  }
}
