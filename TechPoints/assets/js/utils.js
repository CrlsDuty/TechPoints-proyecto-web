// assets/js/utils.js
// Funciones auxiliares y utilidades

const Utils = {
  /**
   * Formatea números con separadores de miles
   * @param {number} numero - Número a formatear
   * @returns {string} Número formateado
   */
  formatearNumero(numero) {
    return new Intl.NumberFormat('es-EC').format(numero);
  },

  /**
   * Formatea puntos con el símbolo
   * @param {number} puntos - Cantidad de puntos
   * @returns {string} Puntos formateados
   */
  formatearPuntos(puntos) {
    return `${this.formatearNumero(puntos)} pts`;
  },

  /**
   * Formatea dinero en USD
   * @param {number} cantidad - Cantidad en dólares
   * @returns {string} Dinero formateado
   */
  formatearDinero(cantidad) {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(cantidad);
  },

  /**
   * Formatea fecha a formato legible
   * @param {Date|string} fecha - Fecha a formatear
   * @returns {string} Fecha formateada
   */
  formatearFecha(fecha) {
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  },

  /**
   * Formatea fecha con hora
   * @param {Date|string} fecha - Fecha a formatear
   * @returns {string} Fecha y hora formateadas
   */
  formatearFechaHora(fecha) {
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  },

  /**
   * Calcula puntos basados en el monto de compra
   * @param {number} monto - Monto de la compra
   * @param {number} ratio - Ratio de conversión (por defecto 10)
   * @returns {number} Puntos calculados
   */
  calcularPuntos(monto, ratio = 10) {
    return Math.floor(monto / ratio) * 10;
  },

  /**
   * Convierte puntos a valor en dinero
   * @param {number} puntos - Cantidad de puntos
   * @param {number} ratio - Ratio de conversión (por defecto 100)
   * @returns {number} Valor en dinero
   */
  puntosADinero(puntos, ratio = 100) {
    return puntos / ratio;
  },

  /**
   * Valida formato de email
   * @param {string} email - Email a validar
   * @returns {boolean} True si es válido
   */
  validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Genera un ID único
   * @returns {string} ID único
   */
  generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Sanitiza texto para prevenir XSS
   * @param {string} texto - Texto a sanitizar
   * @returns {string} Texto sanitizado
   */
  sanitizarTexto(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  },

  /**
   * Trunca texto a una longitud específica
   * @param {string} texto - Texto a truncar
   * @param {number} longitud - Longitud máxima
   * @returns {string} Texto truncado
   */
  truncarTexto(texto, longitud = 50) {
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
  },

  /**
   * Capitaliza la primera letra de un string
   * @param {string} texto - Texto a capitalizar
   * @returns {string} Texto capitalizado
   */
  capitalize(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  },

  /**
   * Debounce - Retrasa la ejecución de una función
   * @param {Function} func - Función a ejecutar
   * @param {number} delay - Delay en ms
   * @returns {Function} Función con debounce
   */
  debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  /**
   * Obtiene un valor de un objeto de forma segura
   * @param {Object} obj - Objeto
   * @param {string} path - Ruta (ej: 'user.profile.name')
   * @param {*} defaultValue - Valor por defecto
   * @returns {*} Valor o default
   */
  obtenerValorSeguro(obj, path, defaultValue = null) {
    try {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj) || defaultValue;
    } catch {
      return defaultValue;
    }
  },

  /**
   * Copia texto al portapapeles
   * @param {string} texto - Texto a copiar
   * @returns {Promise<boolean>} True si se copió exitosamente
   */
  async copiarAlPortapapeles(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Fallback para navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  },
  

  /**
   * Ordena array de objetos por una propiedad
   * @param {Array} array - Array a ordenar
   * @param {string} propiedad - Propiedad por la que ordenar
   * @param {boolean} ascendente - Orden ascendente o descendente
   * @returns {Array} Array ordenado
   */
  ordenarPor(array, propiedad, ascendente = true) {
    return [...array].sort((a, b) => {
      const valorA = a[propiedad];
      const valorB = b[propiedad];
      
      if (valorA < valorB) return ascendente ? -1 : 1;
      if (valorA > valorB) return ascendente ? 1 : -1;
      return 0;
    });
  },

  /**
   * Agrupa array de objetos por una propiedad
   * @param {Array} array - Array a agrupar
   * @param {string} propiedad - Propiedad por la que agrupar
   * @returns {Object} Objeto con grupos
   */
  agruparPor(array, propiedad) {
    return array.reduce((acc, obj) => {
      const key = obj[propiedad];
      if (!acc[key]) acc[key] = [];
      acc[key].push(obj);
      return acc;
    }, {});
  },

  /**
   * Muestra notificación toast (requiere implementación CSS)
   * @param {string} mensaje - Mensaje a mostrar
   * @param {string} tipo - Tipo: 'success', 'error', 'info', 'warning'
   * @param {number} duracion - Duración en ms
   */
  mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duracion);
  },

  /**
   * Calcula el porcentaje de progreso
   * @param {number} actual - Valor actual
   * @param {number} total - Valor total
   * @returns {number} Porcentaje (0-100)
   */
  calcularPorcentaje(actual, total) {
    if (total === 0) return 0;
    return Math.min(Math.round((actual / total) * 100), 100);
  },

  /**
   * Obtiene el nivel del usuario según puntos
   * @param {number} puntos - Puntos del usuario
   * @returns {Object} Información del nivel
   */
  obtenerNivel(puntos) {
    const niveles = [
      { nombre: 'Bronce', min: 0, max: 500, multiplicador: 1, color: '#cd7f32' },
      { nombre: 'Plata', min: 501, max: 1500, multiplicador: 1.25, color: '#c0c0c0' },
      { nombre: 'Oro', min: 1501, max: Infinity, multiplicador: 1.5, color: '#ffd700' }
    ];

    return niveles.find(nivel => puntos >= nivel.min && puntos <= nivel.max) || niveles[0];
  },

  /**
   * Calcula puntos hasta el siguiente nivel
   * @param {number} puntosActuales - Puntos actuales
   * @returns {Object} Información de progreso
   */
  progresoNivel(puntosActuales) {
    const nivelActual = this.obtenerNivel(puntosActuales);
    const puntosParaSiguiente = nivelActual.max === Infinity ? 0 : nivelActual.max - puntosActuales;
    const porcentaje = nivelActual.max === Infinity ? 100 : 
                      this.calcularPorcentaje(puntosActuales - nivelActual.min, nivelActual.max - nivelActual.min);

    return {
      nivelActual,
      puntosParaSiguiente,
      porcentaje,
      esMaximo: nivelActual.max === Infinity
    };
  }
};

// Estilos CSS para las animaciones de toast (agregar al CSS)
const toastStyles = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;

// Exportar para usar en otros archivos
window.Utils = Utils;

// Helpers asíncronos (delay y callback) para demostraciones
Utils.delay = function(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

Utils.delayWithCallback = function(ms = 300, cb) {
  if (typeof cb !== 'function') return;
  setTimeout(() => cb(), ms);
};