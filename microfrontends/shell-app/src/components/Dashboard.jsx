import React from 'react'
import { useAuth } from '../auth/AuthContext'
import Header from '../components/Header'
import Login from '../auth/Login'

export const Dashboard = () => {
  const { usuario, estaAutenticado, loading } = useAuth()

  console.log('Dashboard render:', { loading, estaAutenticado, usuario })

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Cargando...</h2>
      </div>
    )
  }

  if (!estaAutenticado) {
    return <Login />
  }

  return (
    <div style={styles.wrapper}>
      <Header usuario={usuario} />
      <main style={styles.main}>
        <div style={styles.container}>
          <h1>¡Bienvenido a TechPoints!</h1>
          <p style={styles.subtitle}>Sistema de puntos y canjes para tecnología</p>
          
          {usuario && (
            <div style={styles.userCard}>
              <h3>👤 Mi Perfil</h3>
              <p><strong>Email:</strong> {usuario.email}</p>
              <p><strong>Nombre:</strong> {usuario.nombre}</p>
              <p><strong>⭐ Puntos:</strong> {usuario.puntos}</p>
            </div>
          )}
          
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>📦 Productos</h3>
              <p>Explora nuestro catálogo de tecnología</p>
              <button style={styles.cardButton}>Ver Catálogo</button>
            </div>
            <div style={styles.card}>
              <h3>🛒 Canjes</h3>
              <p>Usa tus puntos para canjear productos</p>
              <button style={styles.cardButton}>Mi Carrito</button>
            </div>
            <div style={styles.card}>
              <h3>📊 Historial</h3>
              <p>Ve tus compras y canjes anteriores</p>
              <button style={styles.cardButton}>Ver Historial</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.5rem'
  },
  main: {
    padding: '2rem 1rem',
    minHeight: 'calc(100vh - 80px)'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '2rem'
  },
  userCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  cardButton: {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem'
  }
}

export default Dashboard
