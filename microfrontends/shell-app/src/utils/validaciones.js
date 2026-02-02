/**
 * Utilidades de validación
 */

/**
 * Valida que la contraseña cumpla con los requisitos de seguridad
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos un signo especial
 * @param {string} password - Contraseña a validar
 * @returns {Object} - { valida: boolean, mensaje: string }
 */
export const validarPassword = (password) => {
  if (!password) {
    return { valida: false, mensaje: 'La contraseña es requerida' }
  }

  if (password.length < 8) {
    return { valida: false, mensaje: 'La contraseña debe tener al menos 8 caracteres' }
  }

  // Verificar que tenga al menos una mayúscula
  if (!/[A-Z]/.test(password)) {
    return { valida: false, mensaje: 'La contraseña debe contener al menos una letra mayúscula' }
  }

  // Verificar que tenga al menos un signo especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valida: false, mensaje: 'La contraseña debe contener al menos un signo especial (!@#$%^&*...)' }
  }

  return { valida: true, mensaje: 'Contraseña válida' }
}

/**
 * Obtiene los requisitos de contraseña como texto
 * @returns {string[]} - Lista de requisitos
 */
export const obtenerRequisitosPassword = () => {
  return [
    'Mínimo 8 caracteres',
    'Al menos una letra mayúscula',
    'Al menos un signo especial (!@#$%^&*...)'
  ]
}
