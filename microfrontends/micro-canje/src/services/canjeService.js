import { crearCanje } from '../../../shared/supabaseClient'
import eventBus from '../../../shared/eventBus'

export const canjeService = {
  async procesarCanjes(usuarioId, carrito, puntosActuales) {
    const puntosNecesarios = carrito.reduce((sum, item) => sum + item.puntos_unitarios, 0)

    if (puntosActuales < puntosNecesarios) {
      throw new Error(`No tienes puntos suficientes. Necesitas ${puntosNecesarios} pero solo tienes ${puntosActuales}`)
    }

    const canjesRealizados = []

    for (const item of carrito) {
      try {
        const resultado = await crearCanje(
          usuarioId,
          item.id,
          item.puntos_unitarios
        )
        canjesRealizados.push(resultado)
      } catch (error) {
        console.error(`Error procesando canje de ${item.nombre}:`, error)
        throw error
      }
    }

    // Emitir evento de canje completado
    eventBus.emit('canje-completado', {
      usuarioId,
      canjesRealizados,
      puntosUsados: puntosNecesarios,
      fecha: new Date().toISOString()
    })

    // Emitir evento de puntos actualizados
    const puntosRestantes = puntosActuales - puntosNecesarios
    eventBus.emit('puntosActualizados', {
      puntosActuales: puntosRestantes,
      puntosUsados: puntosNecesarios
    })

    return canjesRealizados
  }
}
