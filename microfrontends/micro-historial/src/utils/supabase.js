import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

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
