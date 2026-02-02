import React from 'react'
import { useAuth } from '../auth/AuthContext'
import AvatarUpload from './AvatarUpload'

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
            <AvatarUpload userId={usuario.id} currentAvatar={usuario.avatar_url} />
            <div style={styles.userInfo}>
              <div>
                <p style={styles.userName}>{usuario.nombre}</p>
                <p style={styles.userPoints}>⭐ {usuario.puntos} puntos</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              style={styles.logoutButton}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.3)'
                e.target.style.borderColor = 'rgba(255,255,255,0.6)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)'
                e.target.style.borderColor = 'rgba(255,255,255,0.4)'
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

const styles = {
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '1.25rem 0',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '800',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(255,255,255,0.1)',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)'
  },
  userName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '700'
  },
  userPoints: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '600',
    opacity: 0.95
  },
  logoutButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '2px solid rgba(255,255,255,0.4)',
    padding: '0.65rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'background-color 0.2s'
  }
}

export default Header
