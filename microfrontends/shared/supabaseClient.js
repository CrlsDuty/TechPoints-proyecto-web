/**
 * Cliente de Supabase - Compartido entre todos los microfrontends
 */

import { createClient } from '@supabase/supabase-js'

// Obtener credenciales de Supabase desde variables de entorno
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables de entorno: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
}

// Crear instancia del cliente de Supabase para usar en toda la app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Devuelve el usuario autenticado actualmente, o null si no hay sesión.
 */
export const getUsuarioActual = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

/**
 * Obtiene los datos del perfil de un usuario por su ID.
 * @param {string} usuarioId - ID del usuario
 * @returns {object|null} Perfil o null si hay error
 */
export const getPerfilUsuario = async (usuarioId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', usuarioId)
    .single()

  if (error) {
    console.error('Error al obtener perfil:', error)
    return null
  }
  return data
}

/**
 * Actualiza los puntos de un usuario en la tabla profiles.
 * @param {string} usuarioId - ID del usuario
 * @param {number} nuevosPuntos - Nuevo valor de puntos
 * @returns {object|null} Perfil actualizado o null si hay error
 */
export const actualizarPuntos = async (usuarioId, nuevosPuntos) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ puntos: nuevosPuntos })
    .eq('id', usuarioId)
    .select()

  if (error) {
    console.error('Error al actualizar puntos:', error)
    return null
  }
  return data[0]
}

/**
 * Obtiene productos desde Supabase, permite filtrar por categoría, tienda o búsqueda.
 * @param {object} filtros - Filtros opcionales: categoria, tienda_id, busqueda
 * @returns {Array} Lista de productos
 */
export const obtenerProductos = async (filtros = {}) => {
  let query = supabase.from('products').select('*')

  if (filtros.categoria) {
    query = query.eq('categoria', filtros.categoria)
  }
  if (filtros.tienda_id) {
    query = query.eq('tienda_id', filtros.tienda_id)
  }
  if (filtros.busqueda) {
    query = query.ilike('nombre', `%${filtros.busqueda}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener productos:', error)
    return []
  }
  return data
}

/**
 * Obtiene el historial de canjes (redemptions) de un usuario.
 * @param {string} usuarioId - ID del usuario
 * @returns {Array} Lista de canjes
 */
export const obtenerHistorialCanjes = async (usuarioId) => {
  const { data, error } = await supabase
    .from('redemptions')
    .select(`
      *,
      product:products(nombre, precio_dolar, costo_puntos)
    `)
    .eq('perfil_id', usuarioId)
    .order('creado_at', { ascending: false })

  if (error) {
    console.error('Error al obtener historial:', error)
    return []
  }
  return data
}

/**
 * Crea un nuevo canje (redemption) para un usuario y producto.
 * @param {string} perfilId - ID del perfil
 * @param {string} productoId - ID del producto
 * @param {number} puntosUsados - Puntos usados en el canje
 * @returns {object|null} Canje creado o null si hay error
 */
export const crearCanje = async (perfilId, productoId, puntosUsados) => {
  const { data, error } = await supabase
    .from('redemptions')
    .insert([{
      perfil_id: perfilId,
      producto_id: productoId,
      puntos_usados: puntosUsados,
      estado: 'completado',
      creado_at: new Date().toISOString()
    }])
    .select()

  if (error) {
    console.error('Error al crear canje:', error)
    return null
  }
  return data[0]
}

/**
 * Obtiene la lista de tiendas desde Supabase.
 * @returns {Array} Lista de tiendas
 */
export const obtenerTiendas = async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')

  if (error) {
    console.error('Error al obtener tiendas:', error)
    return []
  }
  return data
}

export default supabase
