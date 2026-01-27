import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const getPerfilUsuario = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', usuarioId)
      .single()

    if (error) {
      console.warn('Perfil no encontrado, usando datos por defecto:', error)
      return null
    }

    console.log('Perfil obtenido:', data)
    return data
  } catch (err) {
    console.error('Error al obtener perfil:', err)
    return null
  }
}
