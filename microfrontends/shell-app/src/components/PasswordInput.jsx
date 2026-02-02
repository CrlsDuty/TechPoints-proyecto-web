import React, { useState } from 'react'

/**
 * Componente de input de contraseña con botón para mostrar/ocultar
 */
export const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "Contraseña",
  name = "password",
  required = false,
  minLength,
  hasError = false,
  style
}) => {
  const [mostrarPassword, setMostrarPassword] = useState(false)

  return (
    <div style={styles.container}>
      <input
        type={mostrarPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        style={style}
      />
      <button
        type="button"
        onClick={() => setMostrarPassword(!mostrarPassword)}
        style={styles.toggleButton}
        aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {mostrarPassword ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  toggleButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    fontSize: '1.2rem',
    lineHeight: 1,
    opacity: 0.6,
    transition: 'opacity 0.2s'
  }
}

export default PasswordInput
