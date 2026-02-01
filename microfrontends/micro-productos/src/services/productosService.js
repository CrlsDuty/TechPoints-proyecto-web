/**
 * Servicio de productos - migrado desde TechPoints vanilla.
 * CRUD, canje e integración con Supabase (products, stores, redemptions, profiles).
 */

import {
  supabase,
  obtenerProductosConTienda,
  obtenerProductosPorTienda,
  subirImagenProducto,
  obtenerTiendaId,
  getPerfilUsuario,
  TASA_CONVERSION
} from '../utils/supabase'

export { TASA_CONVERSION }

export const productosService = {
  /**
   * Obtener categorías únicas de una lista
   */
  obtenerCategorias(productos) {
    const categorias = new Set(productos.map((p) => p.categoria).filter(Boolean))
    return Array.from(categorias)
  },

  obtenerRangoPrecio(productos) {
    if (!productos?.length) return { min: 0, max: 0 }
    const precios = productos.map((p) => p.costo_puntos)
    return { min: Math.min(...precios), max: Math.max(...precios) }
  },

  formatearPuntos(puntos) {
    return new Intl.NumberFormat('es-ES').format(puntos)
  },

  /**
   * Catálogo: todos los productos con nombre de tienda (para cliente)
   */
  async obtenerProductos(filtros = {}) {
    return await obtenerProductosConTienda(filtros)
  },

  /**
   * Productos de la tienda del usuario (para rol tienda)
   */
  async obtenerProductosPorTienda(ownerId) {
    return await obtenerProductosPorTienda(ownerId)
  },

  /**
   * Agregar producto (tienda). Sube imagen si hay file.
   */
  async agregarProducto(ownerId, payload) {
    const {
      nombre,
      costo_puntos = Math.round((payload.precio_dolar || 0) * 100),
      precio_dolar,
      descripcion,
      categoria,
      stock,
      imagenFile
    } = payload
    const tiendaId = await obtenerTiendaId(ownerId)
    if (!tiendaId) {
      return { success: false, message: 'No se encontró la tienda del usuario' }
    }

    let imagenUrl = null
    if (imagenFile) {
      const upload = await subirImagenProducto(imagenFile, tiendaId, `temp_${Date.now()}`)
      if (upload.success) imagenUrl = upload.url
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        tienda_id: tiendaId,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        categoria: categoria?.trim() || null,
        costo_puntos: parseInt(costo_puntos, 10),
        precio_dolar: precio_dolar != null ? parseFloat(precio_dolar) : null,
        stock: parseInt(stock, 10) || 0,
        imagen_url: imagenUrl
      })
      .select()
      .single()

    if (error) {
      console.error('[productosService] Error agregar:', error)
      return { success: false, message: error.message }
    }
    return { success: true, producto: data }
  },

  /**
   * Actualizar producto (tienda). Opcional: nueva imagen (File)
   */
  async actualizarProducto(productoId, ownerId, payload) {
    const { nombre, costo_puntos, precio_dolar, descripcion, stock, imagenFile, imagen_url } = payload
    const tiendaId = await obtenerTiendaId(ownerId)
    if (!tiendaId) {
      return { success: false, message: 'No se encontró la tienda del usuario' }
    }

    let imagenUrlFinal = imagen_url || null
    if (imagenFile) {
      const upload = await subirImagenProducto(imagenFile, tiendaId, productoId)
      if (upload.success) imagenUrlFinal = upload.url
    }

    const update = {
      ...(nombre != null && { nombre: nombre.trim() }),
      ...(costo_puntos != null && { costo_puntos: parseInt(costo_puntos, 10) }),
      ...(precio_dolar != null && { precio_dolar: parseFloat(precio_dolar) }),
      ...(descripcion != null && { descripcion: descripcion.trim() || null }),
      ...(stock != null && { stock: parseInt(stock, 10) }),
      ...(imagenUrlFinal != null && { imagen_url: imagenUrlFinal })
    }

    const { data, error } = await supabase
      .from('products')
      .update(update)
      .eq('id', productoId)
      .eq('tienda_id', tiendaId)
      .select()
      .single()

    if (error) {
      console.error('[productosService] Error actualizar:', error)
      return { success: false, message: error.message }
    }
    return { success: true, producto: data }
  },

  /**
   * Eliminar producto (solo de la tienda del usuario)
   */
  async eliminarProducto(productoId, ownerId) {
    const tiendaId = await obtenerTiendaId(ownerId)
    if (!tiendaId) {
      return { success: false, message: 'No se encontró la tienda del usuario' }
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productoId)
      .eq('tienda_id', tiendaId)

    if (error) {
      console.error('[productosService] Error eliminar:', error)
      return { success: false, message: error.message }
    }
    return { success: true, message: 'Producto eliminado' }
  },

  /**
   * Canjear producto (cliente): restar puntos, decrementar stock, crear redemption.
   */
  async canjearProducto(perfilId, productoId) {
    const perfil = await getPerfilUsuario(perfilId)
    if (!perfil) return { success: false, message: 'Cliente no encontrado' }

    const { data: producto, error: errProducto } = await supabase
      .from('products')
      .select('*')
      .eq('id', productoId)
      .single()

    if (errProducto || !producto) {
      return { success: false, message: 'Producto no encontrado' }
    }

    const stock = parseInt(producto.stock, 10) || 0
    if (stock <= 0) {
      return { success: false, message: 'Producto sin stock' }
    }

    const costo = parseInt(producto.costo_puntos, 10) || 0
    const puntosActuales = parseInt(perfil.puntos, 10) || 0
    if (puntosActuales < costo) {
      return {
        success: false,
        message: 'No tienes suficientes puntos para canjear este producto',
        puntosNecesarios: costo,
        puntosActuales
      }
    }

    const nuevosPuntos = puntosActuales - costo
    const nuevoStock = stock - 1

    const { error: errPerfil } = await supabase
      .from('profiles')
      .update({ puntos: nuevosPuntos })
      .eq('id', perfilId)

    if (errPerfil) {
      return { success: false, message: 'Error al actualizar puntos' }
    }

    await supabase
      .from('products')
      .update({ stock: nuevoStock })
      .eq('id', productoId)

    const { error: errRedemption } = await supabase.from('redemptions').insert({
      perfil_id: perfilId,
      producto_id: productoId,
      puntos_usados: costo,
      estado: 'completado'
    })

    if (errRedemption) {
      console.warn('[productosService] Redemption no registrado:', errRedemption)
    }

    return {
      success: true,
      message: `¡Canje exitoso! Has canjeado ${producto.nombre}`,
      puntosRestantes: nuevosPuntos,
      stockRestante: nuevoStock,
      producto: producto.nombre
    }
  }
}
