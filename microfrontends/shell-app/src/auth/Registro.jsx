import React, { useState } from 'react'
import { useAuth } from './AuthContext'
import { validarPassword } from '../utils/validaciones'
import PasswordInput from '../components/PasswordInput'
import PasswordRequirements from '../components/PasswordRequirements'

export const Registro = ({ onVolverLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    role: 'cliente'
  })
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)
  const { registro } = useAuth()

  const validarFormulario = () => {
    const nuevosErrores = {}

    // Validar email
    if (!formData.email) {
      nuevosErrores.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nuevosErrores.email = 'El email no es válido'
    }

    // Validar nombre
    if (!formData.nombre || formData.nombre.trim().length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres'
    }

    // Validar contraseña
    const validacionPassword = validarPassword(formData.password)
    if (!validacionPassword.valida) {
      nuevosErrores.password = validacionPassword.mensaje
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      nuevosErrores.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpiar error del campo al escribir
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validarFormulario()) {
      return
    }

    setCargando(true)
    const resultado = await registro({
      email: formData.email,
      password: formData.password,
      nombre: formData.nombre.trim(),
      role: formData.role
    })

    if (resultado.success) {
      // Redirigir al dashboard después de registro exitoso
      window.location.href = '/dashboard'
    } else {
      setErrores({ general: resultado.error || 'Error al registrar usuario' })
    }
    setCargando(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>TechPoints - Registro</h1>
        
        {errores.general && (
          <div style={styles.errorGeneral}>
            {errores.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre completo *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              style={errores.nombre ? styles.inputError : styles.input}
              placeholder="Ej: Juan Pérez"
            />
            {errores.nombre && <span style={styles.errorText}>{errores.nombre}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={errores.email ? styles.inputError : styles.input}
              placeholder="ejemplo@mail.com"
            />
            {errores.email && <span style={styles.errorText}>{errores.email}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tipo de cuenta *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="cliente">Cliente</option>
              <option value="tienda">Tienda</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña *</label>
            <PasswordInput
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              name="password"
              required
              minLength={8}
              style={errores.password ? styles.inputError : styles.input}
            />
            {errores.password && <span style={styles.errorText}>{errores.password}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirmar contraseña *</label>
            <PasswordInput
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="********"
              name="confirmPassword"
              required
              minLength={8}
              style={errores.confirmPassword ? styles.inputError : styles.input}
            />
            {errores.confirmPassword && <span style={styles.errorText}>{errores.confirmPassword}</span>}
          </div>

          <PasswordRequirements password={formData.password} />

          <button type="submit" disabled={cargando} style={styles.button}>
            {cargando ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <div style={styles.linkContainer}>
          <span style={styles.textGris}>¿Ya tienes cuenta? </span>
          <button
            type="button"
            onClick={onVolverLogin}
            style={styles.linkButton}
          >
            Inicia sesión aquí
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '1rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box'
  },
  inputError: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #dc3545',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    backgroundColor: '#fff5f5'
  },
  errorText: {
    color: '#dc3545',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
    display: 'block'
  },
  errorGeneral: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500'
  },
  linkContainer: {
    marginTop: '1.5rem',
    textAlign: 'center'
  },
  textGris: {
    color: '#666'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '1rem',
    padding: 0
  }
}

export default Registro
