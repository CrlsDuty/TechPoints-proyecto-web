import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const obtenerHistorialCanjes = async (usuarioId) => {
  const { data, error } = await supabase
    .from('redemptions')
    .select(`
      id,
      puntos_usados,
      estado,
      creado_at,
      product:products(
        id,
        nombre,
        descripcion,
        categoria,
        costo_puntos,
        precio_dolar,
        stock,
        imagen_url,
        tienda:stores(
          id,
          nombre,
          descripcion
        )
      )
    `)
    .eq('perfil_id', usuarioId)
    .order('creado_at', { ascending: false })

  if (error) {
    console.error('Error al obtener historial:', error)
    return []
  }
  return data
}
