import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

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
