import React from 'react'
import { useAuth } from '../auth/AuthContext'

export const Header = ({ usuario }) => {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <h1>🎯 TechPoints</h1>
        </div>
        
        {usuario && (
          <div style={styles.userSection}>
            <div style={styles.userInfo}>
              <div>
                <p style={styles.userName}>{usuario.nombre}</p>
                <p style={styles.userPoints}>⭐ {usuario.puntos} puntos</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              style={styles.logoutButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

const styles = {
  header: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: '1rem 0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userName: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '600'
  },
  userPoints: {
    margin: 0,
    fontSize: '0.85rem',
    opacity: 0.9
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'background-color 0.2s'
  }
}

export default Header
