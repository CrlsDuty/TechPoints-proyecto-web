import React, { useMemo } from 'react'

export const BadgesSystem = ({ totalCanjes, puntosGastados, categoriaFavorita }) => {
  const badges = useMemo(() => {
    const allBadges = [
      {
        id: 'primer-canje',
        nombre: '🎯 Primer Canje',
        descripcion: 'Realizaste tu primer canje',
        obtenido: totalCanjes >= 1
      },
      {
        id: 'cinco-canjes',
        nombre: '🌟 5 Canjes',
        descripcion: 'Completaste 5 canjes',
        obtenido: totalCanjes >= 5
      },
      {
        id: 'diez-canjes',
        nombre: '⭐ 10 Canjes',
        descripcion: 'Alcanzaste 10 canjes',
        obtenido: totalCanjes >= 10
      },
      {
        id: 'veinte-canjes',
        nombre: '💎 20 Canjes',
        descripcion: '¡20 canjes completados!',
        obtenido: totalCanjes >= 20
      },
      {
        id: 'cincuenta-canjes',
        nombre: '👑 50 Canjes',
        descripcion: '¡Eres un experto!',
        obtenido: totalCanjes >= 50
      },
      {
        id: 'mil-puntos',
        nombre: '💰 1000 Puntos Gastados',
        descripcion: 'Gastaste 1000 puntos',
        obtenido: puntosGastados >= 1000
      },
      {
        id: 'cinco-mil-puntos',
        nombre: '💸 5000 Puntos Gastados',
        descripcion: 'Gastaste 5000 puntos',
        obtenido: puntosGastados >= 5000
      },
      {
        id: 'especialista',
        nombre: '🎓 Especialista',
        descripcion: `Fan de ${categoriaFavorita}`,
        obtenido: categoriaFavorita !== '-'
      },
      {
        id: 'coleccionista',
        nombre: '🏅 Coleccionista',
        descripcion: 'Obtén todos los badges',
        obtenido: false // Se calcula al final
      }
    ]

    // Calcular si tiene todos los badges (excepto el de coleccionista)
    const badgesObtenidos = allBadges.filter(b => b.obtenido && b.id !== 'coleccionista').length
    allBadges.find(b => b.id === 'coleccionista').obtenido = badgesObtenidos >= 8

    return allBadges
  }, [totalCanjes, puntosGastados, categoriaFavorita])

  const badgesObtenidos = badges.filter(b => b.obtenido).length
  const progreso = Math.round((badgesObtenidos / badges.length) * 100)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.titulo}>🏆 Mis Logros</h3>
        <div style={styles.progreso}>
          <span style={styles.progresoTexto}>
            {badgesObtenidos}/{badges.length} desbloqueados
          </span>
          <div style={styles.progresoBarra}>
            <div 
              style={{
                ...styles.progresoFill,
                width: `${progreso}%`
              }}
            />
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {badges.map(badge => (
          <div 
            key={badge.id}
            style={{
              ...styles.badge,
              opacity: badge.obtenido ? 1 : 0.4,
              background: badge.obtenido ?
                'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' :
                '#f8f9fa'
            }}
            title={badge.descripcion}
          >
            <div style={styles.badgeIcono}>{badge.nombre.split(' ')[0]}</div>
            <div style={styles.badgeInfo}>
              <div style={styles.badgeNombre}>
                {badge.nombre.substring(badge.nombre.indexOf(' ') + 1)}
              </div>
              <div style={styles.badgeDescripcion}>{badge.descripcion}</div>
            </div>
            {badge.obtenido && (
              <div style={styles.checkmark}>✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0'
  },
  header: {
    marginBottom: '1.5rem'
  },
  titulo: {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '800'
  },
  progreso: {
    marginBottom: '0.5rem'
  },
  progresoTexto: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#64748b',
    display: 'block',
    marginBottom: '0.5rem'
  },
  progresoBarra: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progresoFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    transition: 'width 0.5s ease',
    borderRadius: '4px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem'
  },
  badge: {
    position: 'relative',
    padding: '1rem',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  badgeIcono: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    lineHeight: 1
  },
  badgeInfo: {
    flex: 1
  },
  badgeNombre: {
    fontWeight: '700',
    fontSize: '0.9rem',
    color: '#1e293b',
    marginBottom: '0.25rem'
  },
  badgeDescripcion: {
    fontSize: '0.75rem',
    color: '#64748b',
    lineHeight: '1.4'
  },
  checkmark: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
  }
}

export default BadgesSystem
