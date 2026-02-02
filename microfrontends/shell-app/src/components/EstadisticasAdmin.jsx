import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

const EstadisticasAdmin = () => {
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalClientes: 0,
    totalProductos: 0,
    totalCanjes: 0,
    puntosOtorgados: 0,
    cargando: true
  })

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      // Total usuarios
      const { count: usuarios } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Total clientes (no tienda)
      const { count: clientes } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'cliente')

      // Total productos
      const { count: productos } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // Total canjes
      const { count: canjes } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })

      // Puntos totales otorgados
      const { data: puntosData } = await supabase
        .from('points_transactions')
        .select('cantidad')
        .eq('tipo', 'credito')

      const totalPuntos = puntosData?.reduce((sum, t) => sum + t.cantidad, 0) || 0

      setStats({
        totalUsuarios: usuarios || 0,
        totalClientes: clientes || 0,
        totalProductos: productos || 0,
        totalCanjes: canjes || 0,
        puntosOtorgados: totalPuntos,
        cargando: false
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      setStats(prev => ({ ...prev, cargando: false }))
    }
  }

  if (stats.cargando) {
    return <div style={styles.loading}>Cargando estadísticas...</div>
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>📊 Estadísticas del Sistema</h2>
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.icon}>👥</div>
          <div style={styles.number}>{stats.totalUsuarios}</div>
          <div style={styles.label}>Total Usuarios</div>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>🛒</div>
          <div style={styles.number}>{stats.totalClientes}</div>
          <div style={styles.label}>Clientes</div>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>📦</div>
          <div style={styles.number}>{stats.totalProductos}</div>
          <div style={styles.label}>Productos</div>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>✅</div>
          <div style={styles.number}>{stats.totalCanjes}</div>
          <div style={styles.label}>Canjes Realizados</div>
        </div>

        <div style={{ ...styles.card, gridColumn: 'span 2' }}>
          <div style={styles.icon}>⭐</div>
          <div style={styles.number}>
            {new Intl.NumberFormat('es-ES').format(stats.puntosOtorgados)}
          </div>
          <div style={styles.label}>Puntos Totales Otorgados</div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    marginBottom: '2rem'
  },
  titulo: {
    marginBottom: '1.5rem',
    fontSize: '1.5rem',
    color: '#333'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.2s'
  },
  icon: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem'
  },
  number: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '0.25rem'
  },
  label: {
    fontSize: '0.9rem',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }
}

export default EstadisticasAdmin
