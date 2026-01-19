import { obtenerHistorialCanjes } from '../../../shared/supabaseClient'

export const historialService = {
  async cargarHistorialCanjes(usuarioId) {
    try {
      const datos = await obtenerHistorialCanjes(usuarioId)
      return datos
    } catch (error) {
      console.error('Error cargando historial:', error)
      throw error
    }
  },

  calcularEstadisticas(canjes) {
    return {
      totalCanjes: canjes.length,
      puntosUsados: canjes.reduce((sum, c) => sum + c.puntos_usados, 0),
      fechaUltimoCanje: canjes.length > 0 ? canjes[0].creado_at : null
    }
  }
}
