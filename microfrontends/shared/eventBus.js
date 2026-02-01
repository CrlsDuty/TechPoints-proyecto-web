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

// Clase que implementa un sistema de eventos personalizado (Pub/Sub)
class EventBus {
  constructor() {
    // Objeto que almacena los listeners de cada evento
    this.events = {}
  }

  /**
   * Registrar un listener para un evento
   * @param {string} event - Nombre del evento
   * @param {function} callback - Función a ejecutar
   */
  /**
   * Suscribe una función callback a un evento específico.
   * Retorna una función para desuscribirse fácilmente.
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
  /**
   * Suscribe una función callback que solo se ejecuta una vez para el evento dado.
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
  /**
   * Lanza un evento y ejecuta todos los callbacks asociados.
   * Si algún callback falla, muestra el error en consola.
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
  /**
   * Elimina todos los listeners de un evento específico o de todos los eventos si no se pasa parámetro.
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
  /**
   * Devuelve la cantidad de listeners registrados para un evento.
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
