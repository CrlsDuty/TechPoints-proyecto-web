/**
 * Cliente de Supabase - Compartido entre todos los microfrontends
 */

import { createClient } from '@supabase/supabase-js'

// Obtener credenciales de variables de entorno
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables de entorno: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
}

// Crear cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Obtener usuario actual
 */
export const getUsuarioActual = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

/**
 * Obtener datos del perfil del usuario
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
 * Actualizar puntos del usuario
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
 * Obtener productos de Supabase
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
 * Obtener historial de canjes
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
 * Crear un canje (redemption)
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
 * Obtener tiendas
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
