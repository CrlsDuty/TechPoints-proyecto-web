import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const BUCKET_IMAGENES = 'product-images'
const TASA_CONVERSION = 100 // 1 USD = 100 puntos

/**
 * Obtener todos los productos con nombre de tienda (para catálogo cliente)
 */
export const obtenerProductosConTienda = async (filtros = {}) => {
  let query = supabase
    .from('products')
    .select('*, stores(nombre, owner_id)')

  if (filtros.categoria) {
    query = query.eq('categoria', filtros.categoria)
  }
  if (filtros.tienda_id) {
    query = query.eq('tienda_id', filtros.tienda_id)
  }
  if (filtros.busqueda) {
    query = query.ilike('nombre', `%${filtros.busqueda}%`)
  }

  const { data, error } = await query.order('creado_at', { ascending: false })

  if (error) {
    return []
  }
  
  return (data || []).map((p) => ({
    ...p,
    tienda_nombre: p.stores?.nombre || 'Tienda desconocida',
    tienda_id: p.tienda_id,
    owner_id: p.stores?.owner_id
  }))
}

/**
 * Obtener productos de la tienda del usuario (por owner_id)
 */
export const obtenerProductosPorTienda = async (ownerId) => {
  console.log('[supabase] Buscando tienda para owner:', ownerId)
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', ownerId)
    .single()

  if (storeError || !store) {
    console.warn('[productos] No se encontró tienda para owner:', ownerId, storeError)
    return []
  }

  console.log('[supabase] Tienda encontrada:', store.id)
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tienda_id', store.id)
    .order('creado_at', { ascending: false })

  if (error) {
    console.error('[productos] Error al obtener productos de tienda:', error)
    return []
  }

  console.log('[supabase] Productos de tienda obtenidos:', data?.length || 0)
  
  return (data || []).map((p) => ({
    ...p,
    tienda: 'Supabase'
  }))
}

/**
 * Subir imagen a Supabase Storage
 */
export const subirImagenProducto = async (file, tiendaId, productoId) => {
  if (!file || !file.type?.startsWith('image/')) {
    return { success: false, error: 'Archivo no válido' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'Imagen demasiado grande (máx 5MB)' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${tiendaId}/${productoId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .upload(path, file, { upsert: false })

  if (error) {
    console.warn('[productos] Error subiendo imagen:', error)
    return { success: false, error: error.message }
  }

  const { data: urlData } = supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(data.path)
  return { success: true, url: urlData?.publicUrl, path: data.path }
}

/**
 * Obtener tienda id del usuario autenticado
 */
export const obtenerTiendaId = async (userId) => {
  const { data, error } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', userId)
    .single()
  if (error || !data) return null
  return data.id
}

/**
 * Obtener perfil del usuario (role, puntos, nombre) por id de auth
 */
export const getPerfilUsuario = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', usuarioId)
      .single()
    
    if (error) return null
    return data
  } catch (err) {
    return null
  }
}

export { TASA_CONVERSION }
