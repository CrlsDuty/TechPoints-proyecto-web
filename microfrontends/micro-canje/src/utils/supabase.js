import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

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
