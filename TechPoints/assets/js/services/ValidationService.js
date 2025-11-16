/**
 * ValidationService
 * Servicio centralizado para validaciones en la aplicación
 * Incluye email, password, teléfono, URL, y más
 */

const ValidationService = {
  /**
   * Validar email con expresión regular RFC
   * @param {string} email - Email a validar
   * @returns {boolean} Es válido o no
   */
  validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  },

  /**
   * Validar contraseña fuerte
   * Requisitos:
   * - Mínimo 8 caracteres
   * - Al menos 1 mayúscula
   * - Al menos 1 minúscula
   * - Al menos 1 número
   * - Al menos 1 carácter especial
   * @param {string} password - Contraseña a validar
   * @returns {Object} Objeto con validación y requisitos
   */
  validarPasswordFuerte(password) {
    const validaciones = {
      longitud: password.length >= 8,
      mayuscula: /[A-Z]/.test(password),
      minuscula: /[a-z]/.test(password),
      numero: /[0-9]/.test(password),
      especial: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?\/\\|`~]/.test(password)
    };

    const cumplidas = Object.values(validaciones).filter(v => v).length;
    const fuerza = Math.round((cumplidas / Object.keys(validaciones).length) * 100);

    return {
      valido: Object.values(validaciones).every(v => v),
      requisitos: validaciones,
      fuerza, // 0-100
      nivel: fuerza <= 20 ? 'muy-débil' : fuerza <= 40 ? 'débil' : fuerza <= 60 ? 'media' : fuerza <= 80 ? 'fuerte' : 'muy-fuerte'
    };
  },

  /**
   * Validar que dos passwords coincidan
   * @param {string} p1 - Primera contraseña
   * @param {string} p2 - Segunda contraseña
   * @returns {boolean} Coinciden o no
   */
  validarPasswordsCoinciden(p1, p2) {
    return p1 === p2 && p1.length > 0;
  },

  /**
   * Validar nombre (3-100 caracteres, sin caracteres especiales peligrosos)
   * @param {string} nombre - Nombre a validar
   * @returns {boolean} Es válido
   */
  validarNombre(nombre) {
    const regex = /^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ]{3,100}$/;
    return regex.test(nombre.trim());
  },

  /**
   * Validar número de teléfono (formato flexible)
   * @param {string} telefono - Teléfono a validar
   * @returns {boolean} Es válido
   */
  validarTelefono(telefono) {
    const regex = /^[\d\s\-\+\(\)]{7,20}$/;
    return regex.test(telefono.trim());
  },

  /**
   * Validar número (positivo, con rango opcional)
   * @param {any} valor - Valor a validar
   * @param {number} min - Mínimo (por defecto 0)
   * @param {number} max - Máximo (por defecto Infinity)
   * @returns {boolean} Es válido
   */
  validarNumero(valor, min = 0, max = Infinity) {
    const num = Number(valor);
    return !isNaN(num) && num >= min && num <= max;
  },

  /**
   * Validar URL
   * @param {string} url - URL a validar
   * @returns {boolean} Es válida
   */
  validarUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitizar string (prevenir XSS)
   * @param {string} texto - Texto a sanitizar
   * @returns {string} Texto sanitizado
   */
  sanitizarString(texto) {
    if (typeof texto !== 'string') return '';
    
    const element = document.createElement('div');
    element.textContent = texto;
    return element.innerHTML;
  },

  /**
   * Validar que no esté vacío
   * @param {any} valor - Valor a validar
   * @returns {boolean} No está vacío
   */
  validarNoVacio(valor) {
    return valor !== null && valor !== undefined && valor.toString().trim().length > 0;
  },

  /**
   * Validar longitud de texto
   * @param {string} texto - Texto a validar
   * @param {number} min - Longitud mínima
   * @param {number} max - Longitud máxima
   * @returns {boolean} Es válido
   */
  validarLongitud(texto, min = 0, max = Infinity) {
    const longitud = texto.toString().length;
    return longitud >= min && longitud <= max;
  },

  /**
   * Validar que sea solo números
   * @param {any} valor - Valor a validar
   * @returns {boolean} Es válido
   */
  validarSoloNumeros(valor) {
    return /^\d+$/.test(valor.toString().trim());
  },

  /**
   * Validar que sea solo letras
   * @param {any} valor - Valor a validar
   * @returns {boolean} Es válido
   */
  validarSoloLetras(valor) {
    return /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(valor.toString().trim());
  },

  /**
   * Obtener mensajes de error descriptivos
   * @param {string} campo - Campo validado
   * @param {string} tipo - Tipo de error
   * @returns {string} Mensaje de error
   */
  obtenerMensajeError(campo, tipo) {
    const mensajes = {
      email: {
        requerido: 'El email es requerido',
        invalido: 'Email inválido',
        existente: 'Este email ya está registrado'
      },
      password: {
        requerido: 'La contraseña es requerida',
        debil: 'La contraseña es muy débil. Usa mayúsculas, números y caracteres especiales',
        noCoincide: 'Las contraseñas no coinciden',
        corta: 'La contraseña debe tener al menos 4 caracteres',
        conforme: 'Contraseña aceptada'
      },
      nombre: {
        requerido: 'El nombre es requerido',
        invalido: 'El nombre no es válido',
        corto: 'El nombre debe tener al menos 3 caracteres',
        largo: 'El nombre no puede exceder 100 caracteres'
      },
      telefono: {
        requerido: 'El teléfono es requerido',
        invalido: 'Formato de teléfono inválido'
      },
      url: {
        invalido: 'La URL no es válida'
      },
      numero: {
        invalido: 'Debe ser un número válido'
      }
    };

    return mensajes[campo]?.[tipo] || 'Error en validación';
  },

  /**
   * Validar objeto completo contra esquema
   * @param {Object} objeto - Objeto a validar
   * @param {Object} esquema - Esquema de validación
   * @returns {Object} Resultado con errores
   * 
   * Ejemplo:
   * esquema = {
   *   email: { tipo: 'email', requerido: true },
   *   password: { tipo: 'password-fuerte', requerido: true },
   *   edad: { tipo: 'numero', min: 18, max: 120 }
   * }
   */
  validarObjeto(objeto, esquema) {
    const errores = {};
    
    for (const [campo, reglas] of Object.entries(esquema)) {
      const valor = objeto[campo];

      // Verificar requerido
      if (reglas.requerido && !this.validarNoVacio(valor)) {
        errores[campo] = this.obtenerMensajeError(campo, 'requerido');
        continue;
      }

      // Si no es requerido y está vacío, continuar
      if (!reglas.requerido && !this.validarNoVacio(valor)) {
        continue;
      }

      // Validar según tipo
      switch (reglas.tipo) {
        case 'email':
          if (!this.validarEmail(valor)) {
            errores[campo] = this.obtenerMensajeError(campo, 'invalido');
          }
          break;

        case 'password-fuerte':
          const validPassword = this.validarPasswordFuerte(valor);
          if (!validPassword.valido) {
            errores[campo] = this.obtenerMensajeError(campo, 'debil');
          }
          break;

        case 'numero':
          if (!this.validarNumero(valor, reglas.min, reglas.max)) {
            errores[campo] = this.obtenerMensajeError(campo, 'invalido');
          }
          break;

        case 'url':
          if (!this.validarUrl(valor)) {
            errores[campo] = this.obtenerMensajeError(campo, 'invalido');
          }
          break;

        case 'telefono':
          if (!this.validarTelefono(valor)) {
            errores[campo] = this.obtenerMensajeError(campo, 'invalido');
          }
          break;

        case 'nombre':
          if (!this.validarNombre(valor)) {
            errores[campo] = this.obtenerMensajeError(campo, 'invalido');
          }
          break;

        case 'texto':
          if (!this.validarLongitud(valor, reglas.min, reglas.max)) {
            errores[campo] = `Debe tener entre ${reglas.min} y ${reglas.max} caracteres`;
          }
          break;
      }
    }

    return {
      valido: Object.keys(errores).length === 0,
      errores
    };
  }
};

// Exportar para uso global
window.ValidationService = ValidationService;

// Log de carga
console.log('[ValidationService] Cargado correctamente');
