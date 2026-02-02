import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export const Login = () => {
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
        <h1>TechPoints - Login</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            minLength={8}
          />
          <div style={styles.infoBox}>
            <strong>Requisitos de contraseña:</strong>
            <ul style={styles.lista}>
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una letra mayúscula</li>
              <li>Al menos un signo especial (!@#$%^&*...)</li>
            </ul>
          </div>
          <button type="submit" disabled={cargando} style={styles.button}>
            {cargando ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>
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
    backgroundColor: '#f5f5f5'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  infoBox: {
    backgroundColor: '#e7f3ff',
    border: '1px solid #b3d9ff',
    borderRadius: '4px',
    padding: '0.75rem',
    marginBottom: '1rem',
    fontSize: '0.85rem',
    color: '#004085'
  },
  lista: {
    margin: '0.5rem 0 0 1rem',
    paddingLeft: '0.5rem'
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer'
  }
}

export default Login
