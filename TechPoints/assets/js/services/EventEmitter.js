/**
 * EventEmitter
 * Sistema de eventos para comunicación entre módulos
 * Permite suscribirse, desuscribirse y emitir eventos
 */

class EventEmitter {
  constructor() {
    this.eventos = {};
  }

  /**
   * Suscribirse a un evento
   * @param {string} evento - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} Función para desuscribirse
   */
  on(evento, callback) {
    if (!this.eventos[evento]) {
      this.eventos[evento] = [];
    }
    this.eventos[evento].push(callback);

    // Retornar función para desuscribirse fácilmente
    return () => this.off(evento, callback);
  }

  /**
   * Suscribirse a un evento solo una vez
   * @param {string} evento - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   */
  once(evento, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(evento, wrapper);
    };
    this.on(evento, wrapper);
  }

  /**
   * Desuscribirse de un evento
   * @param {string} evento - Nombre del evento
   * @param {Function} callback - Función a remover
   */
  off(evento, callback) {
    if (!this.eventos[evento]) return;
    
    this.eventos[evento] = this.eventos[evento].filter(
      cb => cb !== callback
    );

    // Limpiar si no hay más listeners
    if (this.eventos[evento].length === 0) {
      delete this.eventos[evento];
    }
  }

  /**
   * Emitir un evento
   * @param {string} evento - Nombre del evento
   * @param  {...any} args - Argumentos a pasar a los listeners
   */
  emit(evento, ...args) {
    if (!this.eventos[evento]) return;
    
    this.eventos[evento].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`[EventEmitter] Error en evento "${evento}":`, error);
      }
    });
  }

  /**
   * Obtener todos los listeners de un evento
   * @param {string} evento - Nombre del evento
   * @returns {Array} Array de listeners
   */
  listeners(evento) {
    return this.eventos[evento] || [];
  }

  /**
   * Obtener cantidad de listeners
   * @param {string} evento - Nombre del evento
   * @returns {number} Cantidad de listeners
   */
  listenerCount(evento) {
    return this.listeners(evento).length;
  }

  /**
   * Remover todas las suscripciones
   * @param {string} evento - Nombre del evento (si no se especifica, limpia todo)
   */
  removeAllListeners(evento) {
    if (evento) {
      delete this.eventos[evento];
    } else {
      this.eventos = {};
    }
  }

  /**
   * Obtener información de eventos registrados
   * @returns {Object} Objeto con información
   */
  getInfo() {
    const info = {};
    for (const [evento, listeners] of Object.entries(this.eventos)) {
      info[evento] = listeners.length;
    }
    return info;
  }
}

// Crear instancia global para toda la app
const EventBus = new EventEmitter();

// Eventos estándar que puede emitir la aplicación:
// 'usuario-login' - Cuando un usuario inicia sesión
// 'usuario-logout' - Cuando un usuario cierra sesión
// 'puntos-agregados' - Cuando se agregan puntos a un cliente
// 'producto-canjeado' - Cuando se canjea un producto
// 'producto-agregado' - Cuando se agrega un nuevo producto
// 'perfil-actualizado' - Cuando se actualiza un perfil
// 'transaccion-completada' - Cuando se completa una transacción
// 'error-ocurrido' - Cuando ocurre un error
// 'notificacion-mostrada' - Cuando se muestra una notificación

// Exportar para uso global
window.EventEmitter = EventEmitter;
window.EventBus = EventBus;

// Log de carga
console.log('[EventEmitter] Cargado correctamente');

// Ejemplos de uso:
/*

// Suscribirse a un evento
EventBus.on('puntos-agregados', (usuario) => {
  console.log('Usuario con nuevos puntos:', usuario);
  actualizarInfoCliente(usuario);
});

// Suscribirse una sola vez
EventBus.once('usuario-login', (usuario) => {
  console.log('Primer login después de la carga:', usuario);
});

// Emitir un evento
EventBus.emit('puntos-agregados', usuarioActualizado);

// Desuscribirse
const unsubscribe = EventBus.on('evento', callback);
unsubscribe(); // Llamar para desuscribirse

// Obtener listeners
EventBus.listeners('puntos-agregados'); // Array de callbacks

// Remover todo
EventBus.removeAllListeners('puntos-agregados');

// Ver información
EventBus.getInfo(); // {evento1: 2, evento2: 1}

*/
