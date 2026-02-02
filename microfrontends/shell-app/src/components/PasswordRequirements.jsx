import React from 'react'

/**
 * Componente que muestra los requisitos de contraseña con validación en tiempo real
 */
export const PasswordRequirements = ({ password }) => {
  const requisitos = [
    {
      texto: 'Mínimo 8 caracteres',
      cumple: password.length >= 8
    },
    {
      texto: 'Al menos una letra mayúscula',
      cumple: /[A-Z]/.test(password)
    },
    {
      texto: 'Al menos un signo especial (!@#$%^&*...)',
      cumple: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
  ]

  return (
    <div style={styles.container}>
      <strong style={styles.titulo}>Requisitos de contraseña:</strong>
      <ul style={styles.lista}>
        {requisitos.map((req, index) => (
          <li 
            key={index}
            style={{
              ...styles.item,
              color: password ? (req.cumple ? '#28a745' : '#dc3545') : '#666'
            }}
          >
            <span style={styles.icono}>
              {password ? (req.cumple ? '✓' : '✗') : '•'}
            </span>
            {req.texto}
          </li>
        ))}
      </ul>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    padding: '0.75rem',
    marginBottom: '1rem',
    fontSize: '0.85rem'
  },
  titulo: {
    color: '#333',
    display: 'block',
    marginBottom: '0.5rem'
  },
  lista: {
    margin: '0',
    paddingLeft: '1.5rem',
    listStyleType: 'none'
  },
  item: {
    marginBottom: '0.25rem',
    fontWeight: '500',
    transition: 'color 0.2s ease'
  },
  icono: {
    marginRight: '0.5rem',
    fontWeight: 'bold'
  }
}

export default PasswordRequirements
