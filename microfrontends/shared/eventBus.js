/**
 * EventBus - Sistema de comunicación entre microfrontends
 * Patrón: Pub/Sub
 * 
 * Uso:
 * import eventBus from '../../../shared/eventBus'
 * 
 * // Escuchar evento
 * eventBus.on('usuario-sesion', (usuario) => {
 *   console.log('Usuario:', usuario)
 * })
 * 
 * // Emitir evento
 * eventBus.emit('usuario-sesion', { id: 1, nombre: 'Juan' })
 */

class EventBus {
  constructor() {
    this.events = {}
  }

  /**
   * Registrar un listener para un evento
   * @param {string} event - Nombre del evento
   * @param {function} callback - Función a ejecutar
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
    
    // Retornar función para desuscribirse
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }

  /**
   * Registrar un listener que solo se ejecuta una vez
   * @param {string} event - Nombre del evento
   * @param {function} callback - Función a ejecutar
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data)
      unsubscribe()
    })
    return unsubscribe
  }

  /**
   * Emitir un evento
   * @param {string} event - Nombre del evento
   * @param {any} data - Datos a enviar
   */
  emit(event, data) {
    if (!this.events[event]) {
      return
    }
    this.events[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error en EventBus (${event}):`, error)
      }
    })
  }

  /**
   * Remover todos los listeners de un evento
   * @param {string} event - Nombre del evento (opcional)
   */
  off(event) {
    if (event) {
      delete this.events[event]
    } else {
      this.events = {}
    }
  }

  /**
   * Obtener cantidad de listeners
   * @param {string} event - Nombre del evento
   */
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0
  }
}

// Exportar instancia única
const eventBus = new EventBus()
export default eventBus

// Eventos disponibles (comentarios para documentación):
// 1. usuario-sesion: { id, email, nombre, puntos }
// 2. add-to-cart: { producto, cantidad }
// 3. canje-completado: { redemptionId, productosCanjeados, puntosUsados }
// 4. puntosActualizados: { puntosActuales, puntosUsados }
// 5. historialActualizado: { tipo, transaccion }
// 6. error-operacion: { mensaje, tipo, detalles }
