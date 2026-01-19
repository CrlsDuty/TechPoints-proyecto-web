import React from 'react'

export const Header = ({ usuario }) => {
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <h1>🎯 TechPoints</h1>
        </div>
        
        {usuario && (
          <div style={styles.userInfo}>
            <div>
              <p style={styles.userName}>{usuario.nombre}</p>
              <p style={styles.userPoints}>⭐ {usuario.puntos} puntos</p>
            </div>
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
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userName: {
    margin: 0,
    fontSize: '0.95rem'
  },
  userPoints: {
    margin: 0,
    fontSize: '0.85rem',
    opacity: 0.9
  }
}

export default Header
