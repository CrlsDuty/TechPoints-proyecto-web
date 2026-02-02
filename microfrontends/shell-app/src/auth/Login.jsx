import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import PasswordInput from '../components/PasswordInput'

export const Login = ({ onIrRegistro }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    const resultado = await login(email, password)
    if (resultado.success) {
      // Redirigir al dashboard
      window.location.href = '/dashboard'
    }
    setCargando(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🎯</div>
          <h1 style={styles.title}>TechPoints</h1>
          <p style={styles.subtitle}>Ingresa a tu cuenta</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.labelInput}>Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.labelInput}>Contraseña</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              name="password"
              required
              minLength={8}
              style={styles.input}
            />
          </div>
          
          <div style={styles.infoBox}>
            <strong style={styles.infoTitle}>💡 Requisitos de contraseña:</strong>
            <ul style={styles.lista}>
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una letra mayúscula</li>
              <li>Al menos un signo especial (!@#$%^&*...)</li>
            </ul>
          </div>
          
          <button type="submit" disabled={cargando} style={cargando ? styles.buttonDisabled : styles.button}>
            {cargando ? '⏳ Cargando...' : '🚀 Ingresar'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>o</span>
        </div>

        <div style={styles.linkContainer}>
          <span style={styles.textGris}>¿No tienes cuenta? </span>
          <button
            type="button"
            onClick={onIrRegistro}
            style={styles.linkButton}
          >
            Regístrate aquí
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
    padding: '1rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '440px',
    animation: 'fadeIn 0.5s ease-in'
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  logo: {
    fontSize: '4rem',
    marginBottom: '0.5rem',
    animation: 'bounce 2s infinite'
  },
  title: {
    margin: '0.5rem 0',
    fontSize: '2rem',
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
  inputGroup: {
    marginBottom: '1.25rem'
  },
  labelInput: {
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
  infoBox: {
    backgroundColor: '#f8f9ff',
    border: '2px solid #e0e7ff',
    borderRadius: '10px',
    padding: '1rem',
    marginBottom: '1.5rem',
    fontSize: '0.85rem'
  },
  infoTitle: {
    color: '#4f46e5',
    display: 'block',
    marginBottom: '0.5rem'
  },
  lista: {
    margin: '0.5rem 0 0 1.25rem',
    paddingLeft: '0',
    color: '#666'
  },
  button: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.05rem',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
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

export default Login
