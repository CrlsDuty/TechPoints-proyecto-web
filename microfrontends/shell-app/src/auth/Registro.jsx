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
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🎯</div>
          <h1 style={styles.title}>TechPoints</h1>
          <p style={styles.subtitle}>Crea tu cuenta</p>
        </div>
        
        {errores.general && (
          <div style={styles.errorGeneral}>
            ⚠️ {errores.general}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
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

          <button type="submit" disabled={cargando} style={cargando ? styles.buttonDisabled : styles.button}>
            {cargando ? '⏳ Registrando...' : '✨ Crear cuenta'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>o</span>
        </div>

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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem 1rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '520px',
    animation: 'fadeIn 0.5s ease-in'
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  logo: {
    fontSize: '3.5rem',
    marginBottom: '0.5rem',
    animation: 'bounce 2s infinite'
  },
  title: {
    margin: '0.5rem 0',
    fontSize: '1.8rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '700'
  },
  subtitle: {
    margin: '0.25rem 0 0 0',
    color: '#666',
    fontSize: '0.95rem'
  },
  form: {
    marginBottom: '1.5rem'
  },
  formGroup: {
    marginBottom: '1.25rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#333',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  inputError: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #ef4444',
    borderRadius: '10px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    backgroundColor: '#fef2f2',
    outline: 'none'
  },
  errorText: {
    color: '#ef4444',
    fontSize: '0.85rem',
    marginTop: '0.35rem',
    display: 'block',
    fontWeight: '500'
  },
  errorGeneral: {
    backgroundColor: '#fef2f2',
    border: '2px solid #fecaca',
    color: '#991b1b',
    padding: '1rem',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    fontWeight: '500'
  },
  button: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.05rem',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
  },
  buttonDisabled: {
    width: '100%',
    padding: '1rem',
    background: '#ccc',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.05rem',
    cursor: 'not-allowed',
    fontWeight: '600'
  },
  divider: {
    textAlign: 'center',
    margin: '1.5rem 0',
    position: 'relative'
  },
  dividerText: {
    background: 'white',
    padding: '0 1rem',
    color: '#999',
    position: 'relative',
    zIndex: 1
  },
  linkContainer: {
    textAlign: 'center',
    marginTop: '1.5rem'
  },
  textGris: {
    color: '#666',
    fontSize: '0.95rem'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: '0.95rem',
    padding: 0,
    fontWeight: '600',
    transition: 'color 0.3s ease'
  }
}

export default Registro
