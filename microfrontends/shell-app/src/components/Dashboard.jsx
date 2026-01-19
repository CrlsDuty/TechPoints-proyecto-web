import React from 'react'
import { useAuth } from '../auth/AuthContext'
import Header from '../components/Header'
import Login from '../auth/Login'

export const Dashboard = () => {
  const { usuario, estaAutenticado, loading } = useAuth()

  if (loading) {
    return <div style={styles.loading}>Cargando...</div>
  }

  if (!estaAutenticado) {
    return <Login />
  }

  return (
    <div>
      <Header usuario={usuario} />
      <main style={styles.main}>
        <div style={styles.container}>
          <h2>Bienvenido a TechPoints</h2>
          <p>Sistema de puntos y canjes para tecnología</p>
          
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>📦 Productos</h3>
              <p>Explora nuestro catálogo de tecnología</p>
            </div>
            <div style={styles.card}>
              <h3>🛒 Canjes</h3>
              <p>Usa tus puntos para canjear productos</p>
            </div>
            <div style={styles.card}>
              <h3>📊 Historial</h3>
              <p>Ve tus compras y canjes anteriores</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.5rem'
  },
  main: {
    padding: '2rem 1rem'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginTop: '2rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  }
}

export default Dashboard
